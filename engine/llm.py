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
    except json.JSONDecodeError as exc:
        # Before anything else: is this good JSON that simply ran out of tokens mid-object?
        #
        # That is a completely different fault from "the model wrote prose instead of JSON", and it
        # has a different fix (raise max_tokens, not fix the prompt). The raw decoder message —
        # "Expecting value: line 1 column 1" — suggests neither, and the old fallback regex made it
        # worse: `[\{\[].*[\}\]]` needs a closing bracket, so a truncated response failed to match
        # and was reported as "No JSON found", which reads like the model ignored the schema.
        #
        # Synthesis hit exactly this on every batch and logged it as an unremarkable warning, so the
        # stage wrote 25 placeholders and exited 0.
        unclosed = max(text.count("{") - text.count("}"), text.count("[") - text.count("]"))
        if unclosed > 0:
            raise LLMError(
                f"Response is truncated JSON — {unclosed} unclosed bracket(s) after {len(text)} "
                f"chars. Raise max_tokens for this call. Tail: ...{text[-160:]}"
            ) from exc

        # Otherwise: first balanced object/array in the string, in case it is wrapped in prose.
        match = re.search(r"[\{\[].*[\}\]]", text, re.S)
        if not match:
            raise LLMError(f"No JSON found in response: {text[:200]}") from exc
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError as inner:
            raise LLMError(f"Malformed JSON in response: {inner}. Head: {text[:200]}") from inner


def _anthropic_text(resp) -> str:
    """First text block in the response.

    Not `content[0]`. When a model returns extended thinking, block 0 is a ThinkingBlock with no
    `.text` attribute and the answer sits further down the list. Indexing blindly worked on Haiku
    and crashed every batch on Sonnet — which meant the cheap relevance stage passed and the
    expensive extraction stage failed, the most expensive way for this to break.
    """
    for block in resp.content:
        if getattr(block, "type", None) == "text" and getattr(block, "text", None):
            return block.text
    kinds = [getattr(b, "type", "?") for b in resp.content]
    raise LLMError(f"No text block in Anthropic response (blocks: {kinds}, stop={resp.stop_reason})")


def _is_provider_dead(exc: Exception) -> str:
    """Is this error about the *account* rather than the request?

    Returns a short reason, or "" if the error is request-scoped.

    Retrying an exhausted balance on the same key is pointless — it fails in 60ms, nine times in a
    row, and every stage downstream then falls back to placeholders. These conditions mean "this
    provider is unusable for the rest of the run", which is a different response from "this call
    failed": switch providers if another key exists.
    """
    text = str(exc).lower()
    if "credit balance is too low" in text or "billing" in text and "upgrade" in text:
        return "credit balance exhausted"
    if "invalid x-api-key" in text or "authentication_error" in text:
        return "invalid API key"
    if "api key not valid" in text or "api_key_invalid" in text:
        return "invalid API key"
    if "permission_denied" in text and "consumer" in text:
        return "key lacks access"
    return ""


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
        # Preserved across the in-place rebuild in `structured()` so failover happens at most once
        # and a dead-on-both-providers run raises instead of ping-ponging.
        self._failed_over = getattr(self, "_failed_over", False)
        # Models that reject thinking_config outright. Whether a model supports the field is a
        # fixed property, so discovering it once and remembering is the difference between one
        # wasted call and one per batch — which on a per-day request quota halves throughput.
        self._no_thinking_config: set[str] = set()
        self._last_call_lock = threading.Lock()
        self._last_call_at: dict[str, float] = {}
        # Loud, because a run silently falling back to the free tier looks identical to a healthy
        # one except for taking an order of magnitude longer — which is exactly how it was missed.
        if self.provider == "gemini" and os.getenv("ANTHROPIC_API_KEY") is not None:
            log.warning("ANTHROPIC_API_KEY is set but EMPTY — falling back to Gemini free tier")
        log.info("LLM provider: %s  (models: fast=%s strong=%s)",
                 self.provider, self.model("fast"), self.model("strong"))

    def _pace_gemini(self, model: str | None = None) -> None:
        """Block until GEMINI_MIN_INTERVAL_SECONDS has passed since the last call TO THIS MODEL.

        Both the per-minute and per-day free-tier caps are enforced per model
        ("...PerProjectPerModel"), so pacing has to be per model too. A single global timer made
        every model switch cost a full interval, which meant one batch could spend minutes rotating
        and the failure guard would trip before rotation reached a model with quota remaining —
        the reason a 10-model fallback chain still failed in under three minutes.

        Tracking per model also means switching is genuinely free: a model that has not been called
        yet has no interval to wait out.
        """
        if self.provider != "gemini":
            return
        key = model or "_global"
        with self._last_call_lock:
            last = self._last_call_at.get(key, 0.0)
            wait = last + GEMINI_MIN_INTERVAL_SECONDS - time.monotonic()
            if wait > 0:
                time.sleep(wait)
            self._last_call_at[key] = time.monotonic()

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
            # gemma-* are text models with their own quota buckets and were confirmed usable by
            # the probe; matching only "flash" silently excluded two working fallbacks.
            if not any(k in name for k in ("flash", "gemma")):
                continue
            if any(x in name for x in ("tts", "embedding", "vision", "image", "audio", "live")):
                continue
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

    def probe_gemini_models(self) -> list[dict]:
        """Try one tiny generation against every candidate model and report what happens.

        Free-tier quota is enforced per model ("GenerateRequestsPerDayPerProjectPerModel"), so the
        practical daily budget is the number of *working* models times each one's cap — not a single
        shared pool. That makes "can this run on the free tier at all" an empirical question, and
        this answers it for a handful of tokens rather than by guessing.
        """
        if self.provider != "gemini" or self._gemini_sdk != "new":
            raise LLMError("probe_gemini_models only applies to the new Gemini SDK.")

        candidates = []
        for m in self._client.models.list():
            name = m.name.split("/")[-1]
            actions = getattr(m, "supported_actions", None) or []
            if actions and "generateContent" not in actions:
                continue
            if not any(k in name for k in ("flash", "gemma", "pro")):
                continue
            if any(k in name for k in ("tts", "embedding", "image", "audio", "live", "robotics",
                                       "computer-use", "deep-research", "veo", "lyria", "banana")):
                continue
            candidates.append(name)

        results = []
        for name in candidates:
            entry = {"model": name}
            try:
                self._pace_gemini()
                resp = self._client.models.generate_content(
                    model=name,
                    contents="reply with JSON: [{\"ok\":true}]",
                    config={"response_mime_type": "application/json", "max_output_tokens": 2048},
                )
                entry["status"] = "OK" if resp.text else "EMPTY"
            except Exception as exc:  # noqa: BLE001
                msg = str(exc)
                if "NOT_FOUND" in msg or "404" in msg:
                    entry["status"] = "404_GATED"
                elif "RESOURCE_EXHAUSTED" in msg and "PerDay" in msg:
                    entry["status"] = "QUOTA_DAY"
                elif "RESOURCE_EXHAUSTED" in msg:
                    entry["status"] = "QUOTA_MIN"
                else:
                    entry["status"] = f"ERR: {msg[:80]}"
            log.info("  %-38s %s", name, entry["status"])
            results.append(entry)
        return results

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
        # Explicit override wins. Needed because "a key is present" and "a key works" are different
        # things: an Anthropic key with an exhausted balance is present, selected, and useless.
        forced = os.getenv("LLM_PROVIDER", "").strip().lower()
        if forced:
            if forced not in ("anthropic", "gemini"):
                raise LLMError(f"LLM_PROVIDER={forced!r} — expected 'anthropic' or 'gemini'.")
            if not os.getenv(f"{forced.upper()}_API_KEY"):
                raise LLMError(f"LLM_PROVIDER={forced} but {forced.upper()}_API_KEY is not set.")
            return forced
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
        """Return parsed JSON. `system` is cached where the provider supports it.

        Fails over to the other provider once, if the current one turns out to be dead at the
        account level (see `_is_provider_dead`). Synthesis ran nine batches against an Anthropic key
        with an exhausted balance, got nine 400s in under a second, and wrote placeholder insights —
        with a working Gemini key sitting unused in the same environment the whole time. A
        provider-agnostic client that cannot actually change provider is not much of one.
        """
        try:
            return self._structured_once(system, user, tier, max_tokens)
        except Exception as exc:  # noqa: BLE001
            reason = _is_provider_dead(exc)
            other = "gemini" if self.provider == "anthropic" else "anthropic"
            if not reason or self._failed_over or not os.getenv(f"{other.upper()}_API_KEY"):
                raise
            log.warning(
                "%s unusable (%s) — failing over to %s for the rest of this run",
                self.provider, reason, other,
            )
            self.__init__(provider=other)  # noqa: PLC2801  rebuild in place; callers hold this object
            self._failed_over = True
            return self._structured_once(system, user, tier, max_tokens)

    def _structured_once(
        self,
        system: str,
        user: str,
        tier: str = "fast",
        max_tokens: int = 2000,
    ) -> Any:
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
            return _extract_json(_anthropic_text(resp))

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
                # Pace per MODEL, not globally. The per-minute limit is enforced per model, so
                # after switching models there is nothing to wait for — and waiting anyway meant a
                # single batch could burn minutes just rotating, which is what made the failure
                # guard trip before rotation ever reached a model with quota left.
                self._pace_gemini(self.model(tier))
                return self._client.models.generate_content(
                    model=self.model(tier), contents=user, config=config
                )

            exhausted = self._exhausted_models.setdefault(tier, set())
            # Skip the attempt entirely on models already known to reject the field.
            thinking_off = self.model(tier) not in self._no_thinking_config
            tokens = max_tokens if thinking_off else max(max_tokens, 1024)
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
                        # This model rejects thinking_config. Record it so every subsequent batch
                        # skips the doomed attempt instead of repeating it, then retry without the
                        # field — with room for the invisible thinking budget, since it can no
                        # longer be disabled.
                        failing = self.model(tier)
                        if failing not in self._no_thinking_config:
                            self._no_thinking_config.add(failing)
                            log.warning("%s rejects thinking_config — disabling it for this model", failing)
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
