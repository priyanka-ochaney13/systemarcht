"""Provider-agnostic LLM interface for ArchBot's conversational layer.

This module defines a minimal contract (`LLMProvider`) so that ArchBot can
later call an LLM for explanation/reasoning without hardcoding Groq into the
router or prompt-building code. Only `GroqProvider` is implemented for now;
a `QwenProvider` (thin adapter over the existing `ai.qwen.QwenClient`) can be
added later behind the same interface without touching any caller.

IMPORTANT: this is a reasoning/explanation layer only. It must never be used
to compute or invent authoritative cost numbers - those always come from
`app.services.architecture.calculator.ArchitectureCalculator`. Callers are
expected to inject already-computed cost data into the user_prompt and
instruct the model not to contradict it.
"""

from __future__ import annotations

import os
import logging
from typing import Protocol

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

logger = logging.getLogger(__name__)


class LLMProvider(Protocol):
    """Contract every LLM provider (Groq now, Qwen later) must implement."""

    def chat(self, system_prompt: str, user_prompt: str) -> str:
        """Send a system + user prompt and return the model's text reply."""
        ...


class GroqProvider:
    """LLMProvider implementation backed by the Groq API."""

    def __init__(self) -> None:
        self.api_key = os.getenv("GROQ_API_KEY")
        self.model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
        self.timeout_seconds = float(os.getenv("GROQ_TIMEOUT_SECONDS", "30"))

        if not self.api_key:
            raise RuntimeError(
                "GROQ_API_KEY is not set. Add it to your environment or .env file."
            )

        self._client = Groq(api_key=self.api_key, timeout=self.timeout_seconds)

    def chat(self, system_prompt: str, user_prompt: str) -> str:
        try:
            response = self._client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.65,
            )
        except Exception as exc:  # Groq SDK errors need a safe, actionable client message.
            logger.exception("Groq chat completion failed")
            status_code = getattr(exc, "status_code", None)
            body = getattr(exc, "body", None)
            error = body.get("error", body) if isinstance(body, dict) else {}
            error_code = error.get("code") if isinstance(error, dict) else None

            if status_code == 404 or error_code == "model_not_found":
                message = (
                    "The configured Groq model is unavailable. Set "
                    "GROQ_MODEL=openai/gpt-oss-120b in backend/.env and restart "
                    "the backend."
                )
            elif status_code == 401:
                message = "Groq rejected the API key. Check the backend's GROQ_API_KEY setting."
            elif status_code == 429:
                message = "Groq rate limit reached. Please wait a moment and try again."
            else:
                message = (
                    "Groq could not complete the request. Check the backend logs "
                    "for details, then try again."
                )

            raise RuntimeError(message) from exc

        choice = response.choices[0] if response.choices else None
        content = choice.message.content if choice and choice.message else None
        if not content:
            raise RuntimeError(f"Unexpected Groq API response: {response}")
        return content


def get_llm_provider(provider_name: str | None = None) -> LLMProvider:
    """Factory for the active LLM provider.

    Reads LLM_PROVIDER from the environment when `provider_name` is not
    given. Only "groq" is implemented today; this exists so a future "qwen"
    branch can be added later without changing any caller.
    """
    name = (provider_name or os.getenv("LLM_PROVIDER", "groq")).lower()

    if name == "groq":
        return GroqProvider()

    raise ValueError(f"Unknown LLM provider: {name!r}")