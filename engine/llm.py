"""Provider-agnostic structured-output client.

Deliberately not tied to one vendor: Anthropic if there's an API key, Google Gemini otherwise
(its free tier is generous enough for a corpus this size). The pipeline shouldn't care, and you
shouldn't have to rewrite extraction because of a billing decision.

    export ANTHROPIC_API_KEY=sk-ant-...     # or
    export GEMINI_API_KEY=...

Both absent raises at construction rather than three thousand documents into a run.
"""

from __future__ import annotations

import json
import logging
import os
import re
import threading
import time
from typing import Any

from tenacity import retry, retry_if_exception, stop_after_attempt, wait_exponential

log = logging.getLogger(__name__)

# Gemini's free tier is capped per-minute, not just per-day (5 requests/minute observed on the
# flash tier) — a batch loop with no pacing exhausts it within seconds of starting, every single
# run. Anthropic's paid tier has no equivalent ceiling worth pre-emptively throttling for.
GEMINI_MIN_INTERVAL_SECONDS = float(os.getenv("GEMINI_MIN_INTERVAL_SECONDS", "13"))

_RATE_LIMIT_MARKERS = ("429", "RESOURCE_EXHAUSTED", "rate_limit", "overloaded", "503")


def _is_retryable(exc: BaseException) -> bool:
    """Retry on our own errors plus anything that looks like a transient provider hiccup.

    Deliberately message-based rather than exception-type-based: Anthropic and Gemini raise
    different exception classes for the same underlying condition (a 429), and matching on type
    silently misses one SDK's version of "try again later" — which is exactly what happened here,
    where the tenacity retry list didn't include google.genai.errors.ClientError at all.
    """
    if isinstance(exc, (LLMError, ConnectionError, TimeoutError)):
        return True
    return any(marker in str(exc) for marker in _RATE_LIMIT_MARKERS)

# Overridable without a code change — model names churn, and a stale identifier is the single
# most likely reason a run dies on someone else's machine.
ANTHROPIC_MODEL_FAST = os.getenv("ANTHROPIC_MODEL_FAST", "claude-haiku-4-5-20251001")
ANTHROPIC_MODEL_STRONG = os.getenv("ANTHROPIC_MODEL_STRONG", "claude-sonnet-5")

# Google retires dated Gemini snapshots for new API keys faster than any hardcoded name survives
# (gemini-2.5-flash 404'd within months of release). "-latest" aliases are Google's own answer to
# this and are tried first; if even those are gone, the client asks the account's own model list
# at runtime instead of guessing a name that will just as quickly go stale.
GEMINI_MODEL_FAST = os.getenv("GEMINI_MODEL_FAST", "gemini-flash-latest")
GEMINI_MODEL_STRONG = os.getenv("GEMINI_MODEL_STRONG", "gemini-flash-latest")


class LLMError(RuntimeError):
    pass


def _extract_json(text: str) -> Any:
    """Pull JSON out of a response that may be wrapped in prose or fences."""
    text = text.strip()
    fenced = re.search(r"```(?:json)?\s*(.*?)```", text, re.S)
    if fenced:
        text = fenced.group(1).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Last resort: first balanced object/array in the string.
        match = re.search(r"[\{\[].*[\}\]]", text, re.S)
        if not match:
            raise LLMError(f"No JSON found in response: {text[:200]}")
        return json.loads(match.group(0))


class LLMClient:
    """One method that matters: `structured()`."""

    def __init__(self, provider: str | None = None) -> None:
        self.provider = provider or self._autodetect()

        if self.provider == "anthropic":
            from anthropic import Anthropic

            self._client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
        elif self.provider == "gemini":
            # Google shipped a replacement SDK (`google-genai`) and put the old one
            # (`google-generativeai`) into maintenance. Prefer the new one, fall back to the old,
            # so this works whichever is installed.
            try:
                from google import genai as new_genai

                self._gemini_sdk = "new"
                self._client = new_genai.Client(api_key=os.environ["GEMINI_API_KEY"])
            except ImportError:
                import google.generativeai as legacy_genai

                self._gemini_sdk = "legacy"
                legacy_genai.configure(api_key=os.environ["GEMINI_API_KEY"])
                self._genai = legacy_genai
            log.info("Gemini SDK: %s", self._gemini_sdk)
        else:
            raise LLMError(f"Unknown provider: {self.provider}")

        self._resolved_model: dict[str, str] = {}
        self._exhausted_models: dict[str, set[str]] = {}
        self._last_call_lock = threading.Lock()
        self._last_call_at = 0.0
        log.info("LLM provider: %s", self.provider)

    def _pace_gemini(self) -> None:
        """Block until GEMINI_MIN_INTERVAL_SECONDS has passed since the last call.

        The free tier enforces a per-minute request cap (observed: 5/min on the flash tier), which
        a plain retry loop cannot outrun — every retry after a 429 just contends for the same
        exhausted minute. Pacing calls up front avoids tripping the limit at all, which is faster
        in aggregate than repeatedly hitting it and waiting out the backoff.
        """
        if self.provider != "gemini":
            return
        with self._last_call_lock:
            wait = self._last_call_at + GEMINI_MIN_INTERVAL_SECONDS - time.monotonic()
            if wait > 0:
                time.sleep(wait)
            self._last_call_at = time.monotonic()

    def _discover_gemini_model(self, exclude: set[str] | None = None) -> str:
        """Ask the account's own model list for something that still exists and isn't exhausted.

        Reached in two cases: the configured name 404'd (moved/retired), or it hit its per-day
        free-tier quota and `exclude` names it so a different model gets picked instead. Different
        model names appear to carry independent daily quota buckets, so switching is a real escape
        hatch rather than hitting the same wall again under a different name.
        """
        if self._gemini_sdk != "new":
            raise LLMError(
                "Configured Gemini model is unavailable and the legacy SDK has no model-listing "
                "API here. Set GEMINI_MODEL_FAST/GEMINI_MODEL_STRONG to a current model name from "
                "https://ai.google.dev/gemini-api/docs/models"
            )

        exclude = exclude or set()
        candidates = []
        for m in self._client.models.list():
            name = m.name.split("/")[-1]
            if name in exclude:
                continue
            actions = getattr(m, "supported_actions", None) or []
            if actions and "generateContent" not in actions:
                continue
            if "flash" in name and not any(x in name for x in ("tts", "embedding", "vision", "image")):
                candidates.append(name)

        if not candidates:
            raise LLMError(
                "No usable Gemini flash model left untried on this API key (all either 404'd or "
                "hit their daily free-tier quota). Add ANTHROPIC_API_KEY for a paid-tier run "
                "tonight, or wait for the free tier's daily quota to reset."
            )

        # Ranking learned from two live failures, cheapest-signal first:
        #   - gemini-2.5-flash 404'd with "no longer available to new users" — an account-age
        #     gate, not a missing model. The whole 2.x generation (and older) is almost certainly
        #     gated the same way for this key, so it's actively deprioritized rather than retried
        #     one snapshot at a time.
        #   - gemini-flash-latest resolved to gemini-3.6-flash: a 20-request/DAY free cap. "Lite"
        #     variants and the open-weight gemma models conventionally carry more generous free
        #     allocations than a generation's flagship model, so they're tried first.
        def rank(name: str) -> tuple:
            old_generation = bool(re.match(r"gemini-[0-2]\.", name))
            flagship_alias = name in ("gemini-flash-latest", "gemini-pro-latest")
            preferred = "lite" in name or "gemma" in name
            return (old_generation, flagship_alias, not preferred)

        candidates.sort(key=rank)
        chosen = candidates[0]
        log.warning("Switching Gemini model (unavailable or quota-exhausted) -> '%s'", chosen)
        return chosen

    @staticmethod
    def _gemini_text(resp) -> str:
        """resp.text is a convenience getter that returns None when there's no plain-text part —
        empty candidates, a safety block, or a thinking-only response that never reached an
        answer. Surface WHY instead of letting a bare None reach json.loads as an AttributeError.
        """
        if resp.text is not None:
            return resp.text

        candidates = getattr(resp, "candidates", None) or []
        finish_reason = candidates[0].finish_reason if candidates else "no candidates"
        raise LLMError(f"Gemini returned no text (finish_reason={finish_reason}). Full response: {resp!r:.500}")

    def _gemini_model_for(self, tier: str) -> str:
        if tier in self._resolved_model:
            return self._resolved_model[tier]
        configured = GEMINI_MODEL_STRONG if tier == "strong" else GEMINI_MODEL_FAST
        self._resolved_model[tier] = configured
        return configured

    def list_gemini_models(self) -> list[str]:
        """Raw model catalog for this key — a metadata call, not a generate_content call, so it
        doesn't spend generation quota. Use this to see the real menu before guessing further.
        """
        if self.provider != "gemini" or self._gemini_sdk != "new":
            raise LLMError("list_gemini_models only applies to the new Gemini SDK.")
        out = []
        for m in self._client.models.list():
            name = m.name.split("/")[-1]
            actions = getattr(m, "supported_actions", None) or []
            out.append(f"{name}  actions={actions}")
        return out

    def selftest(self) -> None:
        """One real call, with the traceback allowed to escape.

        Worth its own entry point: a bad model name or key fails identically to a rate limit once
        it has been swallowed by batch-level error handling, and telling those apart after the fact
        costs more than checking up front.
        """
        log.info("selftest: provider=%s model=%s", self.provider, self.model("fast"))
        result = self.structured(
            system='Reply with JSON only, exactly: [{"ok": true}]',
            user="respond now",
            tier="fast",
            max_tokens=100,
        )
        log.info("selftest OK -> %r", result)

    @staticmethod
    def _autodetect() -> str:
        if os.getenv("ANTHROPIC_API_KEY"):
            return "anthropic"
        if os.getenv("GEMINI_API_KEY"):
            return "gemini"
        raise LLMError(
            "No API key found. Set ANTHROPIC_API_KEY (console.anthropic.com) or "
            "GEMINI_API_KEY (aistudio.google.com — free tier is sufficient for this corpus)."
        )

    def model(self, tier: str) -> str:
        strong = tier == "strong"
        if self.provider == "anthropic":
            return ANTHROPIC_MODEL_STRONG if strong else ANTHROPIC_MODEL_FAST
        return self._gemini_model_for(tier)

    @retry(
        retry=retry_if_exception(_is_retryable),
        # Google's own 429 payload suggested a 19s retry delay on a 5-req/min free-tier quota;
        # min=15 respects that instead of retrying straight into the same exhausted minute.
        wait=wait_exponential(multiplier=2, min=15, max=90),
        stop=stop_after_attempt(5),
        reraise=True,
    )
    def structured(
        self,
        system: str,
        user: str,
        tier: str = "fast",
        max_tokens: int = 2000,
    ) -> Any:
        """Return parsed JSON. `system` is cached where the provider supports it."""
        if self.provider == "anthropic":
            resp = self._client.messages.create(
                model=self.model(tier),
                max_tokens=max_tokens,
                system=[
                    {
                        "type": "text",
                        "text": system,
                        # The system prompt is identical across thousands of calls; caching it is
                        # the single biggest cost lever in the whole pipeline.
                        "cache_control": {"type": "ephemeral"},
                    }
                ],
                messages=[{"role": "user", "content": user}],
            )
            return _extract_json(resp.content[0].text)

        if self._gemini_sdk == "new":

            def gen(with_thinking_off: bool, tokens: int):
                config = {
                    "system_instruction": system,
                    "response_mime_type": "application/json",
                    "max_output_tokens": tokens,
                }
                if with_thinking_off:
                    # Newer flash models default to spending part of max_output_tokens on
                    # invisible "thinking" content before the visible answer. For a fixed-schema
                    # classification task that budget is pure waste. Not every model accepts the
                    # field though (some 400 on it), so this is attempted, not assumed.
                    config["thinking_config"] = {"thinking_budget": 0}
                self._pace_gemini()  # every real call goes through here, retries included
                return self._client.models.generate_content(
                    model=self.model(tier), contents=user, config=config
                )

            exhausted = self._exhausted_models.setdefault(tier, set())
            thinking_off, tokens = True, max_tokens
            last_exc: Exception | None = None

            # Bounded loop, not a single fallback: the next candidate model can be just as dead
            # as the first (observed — it switched straight into gemini-2.5-flash, a name already
            # known 404 from an earlier fix). Each iteration handles one failure class and moves
            # to the next candidate; only a genuinely unhandled error or per-minute exhaustion
            # breaks out to the caller.
            for _ in range(10):
                try:
                    resp = gen(with_thinking_off=thinking_off, tokens=tokens)
                    return _extract_json(self._gemini_text(resp))
                except Exception as exc:  # noqa: BLE001
                    msg = str(exc)
                    last_exc = exc
                    dead_or_exhausted = ("NOT_FOUND" in msg or "404" in msg) or (
                        "RESOURCE_EXHAUSTED" in msg and "PerDay" in msg
                    )
                    if dead_or_exhausted:
                        # Exclude both the name we called it by (may be an alias) and whatever
                        # real model name the API's own error message reports — the alias rarely
                        # matches an entry in models.list(), so excluding only it lets discovery
                        # hand back the very same underlying model next time.
                        exhausted.add(self.model(tier))
                        reported = re.search(r"model:\s*([\w.\-]+)", msg)
                        if reported:
                            exhausted.add(reported.group(1))
                        self._resolved_model[tier] = self._discover_gemini_model(exclude=exhausted)
                        thinking_off, tokens = True, max_tokens
                        continue
                    if "INVALID_ARGUMENT" in msg or "400" in msg:
                        # This model rejects thinking_config outright. Retry it without one, with
                        # room for the invisible thinking budget so it doesn't eat the whole
                        # response the way it did before this fallback existed.
                        log.warning("Gemini rejected thinking_config, retrying without it: %s", msg)
                        thinking_off, tokens = False, max(tokens, 1024)
                        continue
                    # Includes per-MINUTE RESOURCE_EXHAUSTED, which the outer @retry on
                    # _is_retryable will wait out and retry against this same model.
                    raise

            raise LLMError(f"Exhausted every Gemini model fallback attempt. Last error: {last_exc}")

        self._pace_gemini()
        model = self._genai.GenerativeModel(
            self.model(tier),
            system_instruction=system,
            generation_config={"response_mime_type": "application/json"},
        )
        resp = model.generate_content(user)
        return _extract_json(resp.text)
