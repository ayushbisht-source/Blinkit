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
GEMINI_MODEL_FAST = os.getenv("GEMINI_MODEL_FAST", "gemini-2.5-flash")
GEMINI_MODEL_STRONG = os.getenv("GEMINI_MODEL_STRONG", "gemini-2.5-flash")


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

        log.info("LLM provider: %s", self.provider)

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
        return GEMINI_MODEL_STRONG if strong else GEMINI_MODEL_FAST

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
