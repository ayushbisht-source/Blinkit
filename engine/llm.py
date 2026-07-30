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
from typing import Any

from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

log = logging.getLogger(__name__)

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
        log.info("LLM provider: %s", self.provider)

    def _discover_gemini_model(self) -> str:
        """Ask the account's own model list for something that still exists.

        Only reached once the configured name and the "-latest" alias have both 404'd — i.e. the
        account's usable model names have moved somewhere this code has no way to predict.
        """
        if self._gemini_sdk != "new":
            raise LLMError(
                "Configured Gemini model is unavailable and the legacy SDK has no model-listing "
                "API here. Set GEMINI_MODEL_FAST/GEMINI_MODEL_STRONG to a current model name from "
                "https://ai.google.dev/gemini-api/docs/models"
            )

        candidates = []
        for m in self._client.models.list():
            name = m.name.split("/")[-1]
            actions = getattr(m, "supported_actions", None) or []
            if actions and "generateContent" not in actions:
                continue
            if "flash" in name and not any(x in name for x in ("tts", "embedding", "vision", "image")):
                candidates.append(name)

        if not candidates:
            raise LLMError(
                "No usable Gemini text model found on this API key. Check the key at "
                "https://aistudio.google.com/apikey and pick a model name from "
                "https://ai.google.dev/gemini-api/docs/models to set as GEMINI_MODEL_FAST."
            )

        # "-latest" aliases first (Google's own answer to name churn), otherwise whatever the
        # account's list returns — it is generally ordered with current models first.
        candidates.sort(key=lambda n: "latest" not in n)
        chosen = candidates[0]
        log.warning("Configured Gemini model unavailable; discovered '%s' from account instead", chosen)
        return chosen

    def _gemini_model_for(self, tier: str) -> str:
        if tier in self._resolved_model:
            return self._resolved_model[tier]
        configured = GEMINI_MODEL_STRONG if tier == "strong" else GEMINI_MODEL_FAST
        self._resolved_model[tier] = configured
        return configured

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
        retry=retry_if_exception_type((LLMError, ConnectionError, TimeoutError)),
        wait=wait_exponential(multiplier=2, min=2, max=30),
        stop=stop_after_attempt(4),
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
            try:
                resp = self._client.models.generate_content(
                    model=self.model(tier),
                    contents=user,
                    config={
                        "system_instruction": system,
                        "response_mime_type": "application/json",
                        "max_output_tokens": max_tokens,
                    },
                )
            except Exception as exc:  # noqa: BLE001
                # Only "this model no longer exists" triggers discovery — a quota or content
                # error on a model that IS valid should surface as itself, not be masked by a
                # silent swap to a different model.
                if "NOT_FOUND" not in str(exc) and "404" not in str(exc):
                    raise
                self._resolved_model[tier] = self._discover_gemini_model()
                resp = self._client.models.generate_content(
                    model=self.model(tier),
                    contents=user,
                    config={
                        "system_instruction": system,
                        "response_mime_type": "application/json",
                        "max_output_tokens": max_tokens,
                    },
                )
            return _extract_json(resp.text)

        model = self._genai.GenerativeModel(
            self.model(tier),
            system_instruction=system,
            generation_config={"response_mime_type": "application/json"},
        )
        resp = model.generate_content(user)
        return _extract_json(resp.text)
