"""Qwen integration for Module 1 architecture generation."""

from __future__ import annotations

import json
import os
from urllib import request, error

from ai.prompts import SYSTEM_PROMPT, build_generation_prompt
from ai.retrieval import format_retrieved_context
from ai.schemas import ArchitectureGenerationResponse


class QwenClient:
    def __init__(self) -> None:
        self.base_url = os.getenv("QWEN_BASE_URL", "http://localhost:11434/v1").rstrip("/")
        self.model = os.getenv("QWEN_MODEL", "qwen3:8b")
        self.api_key = os.getenv("QWEN_API_KEY")
        self.timeout_seconds = float(os.getenv("QWEN_TIMEOUT_SECONDS", "60"))

    def chat_completion(self, system_prompt: str, user_prompt: str) -> str:
        endpoint = f"{self.base_url}/chat/completions"
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.2,
        }

        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        req = request.Request(
            url=endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST",
        )

        try:
            with request.urlopen(req, timeout=self.timeout_seconds) as response:
                raw = response.read().decode("utf-8")
        except error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"Qwen API HTTP {exc.code}: {body}") from exc
        except error.URLError as exc:
            raise RuntimeError(f"Qwen API unreachable at {endpoint}: {exc.reason}") from exc

        try:
            parsed = json.loads(raw)
            return parsed["choices"][0]["message"]["content"]
        except (KeyError, IndexError, json.JSONDecodeError) as exc:
            raise RuntimeError(f"Unexpected Qwen API response: {raw}") from exc


def _extract_json_payload(text: str) -> dict:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1 or start >= end:
            raise ValueError("Model did not return JSON content.")
        candidate = text[start : end + 1]
        try:
            return json.loads(candidate)
        except json.JSONDecodeError as exc:
            raise ValueError(f"Model returned invalid JSON payload: {candidate}") from exc


def generate_architecture(prompt: str) -> ArchitectureGenerationResponse:
    if not prompt or len(prompt.strip()) < 5:
        raise ValueError("Prompt must be at least 5 characters.")

    retrieved_context = format_retrieved_context(prompt, top_k=3)
    user_prompt = build_generation_prompt(prompt, retrieved_context)
    client = QwenClient()
    raw_response = client.chat_completion(SYSTEM_PROMPT, user_prompt)
    payload = _extract_json_payload(raw_response)
    return ArchitectureGenerationResponse.model_validate(payload)
