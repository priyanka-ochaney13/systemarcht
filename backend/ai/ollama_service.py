"""Small Ollama HTTP client used only by the Module 1 chat route."""

from __future__ import annotations

import json
import os
from urllib import error, request


class OllamaError(RuntimeError):
    pass


def _env_file_value(name: str) -> str | None:
    env_path = os.getenv("ENV_FILE", ".env")
    try:
        handle = open(env_path, encoding="utf-8")
    except OSError:
        return None
    with handle:
        for line in handle:
            key, separator, value = line.strip().partition("=")
            if separator and key == name:
                return value.strip().strip('"').strip("'")
    return None


class OllamaService:
    def __init__(self) -> None:
        self.base_url = (
            os.getenv("OLLAMA_BASE_URL") or _env_file_value("OLLAMA_BASE_URL") or ""
        ).rstrip("/")
        self.model = os.getenv("OLLAMA_MODEL") or _env_file_value("OLLAMA_MODEL") or "qwen3:1.7b"
        timeout = os.getenv("OLLAMA_TIMEOUT_SECONDS") or _env_file_value("OLLAMA_TIMEOUT_SECONDS") or "180"
        context_size = os.getenv("OLLAMA_NUM_CTX") or _env_file_value("OLLAMA_NUM_CTX") or "2048"
        predict_tokens = os.getenv("OLLAMA_NUM_PREDICT") or _env_file_value("OLLAMA_NUM_PREDICT") or "256"
        self.timeout_seconds = float(timeout)
        self.context_size = int(context_size)
        self.predict_tokens = int(predict_tokens)

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        if not self.base_url:
            raise OllamaError("OLLAMA_BASE_URL is not configured.")
        endpoint = f"{self.base_url}/api/generate"
        payload = {
            "model": self.model,
            "system": system_prompt,
            "prompt": user_prompt,
            "stream": False,
            "think": False,
            "keep_alive": "10m",
            "options": {
                "temperature": 0.2,
                "num_ctx": self.context_size,
                "num_predict": self.predict_tokens,
            },
        }
        req = request.Request(
            endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with request.urlopen(req, timeout=self.timeout_seconds) as response:
                raw = response.read().decode("utf-8")
        except error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise OllamaError(f"Ollama returned HTTP {exc.code}: {detail}") from exc
        except (error.URLError, TimeoutError, OSError) as exc:
            raise OllamaError(f"Ollama is unreachable at {endpoint}: {exc}") from exc
        try:
            generated = json.loads(raw).get("response")
        except json.JSONDecodeError as exc:
            raise OllamaError("Ollama returned invalid JSON.") from exc
        if not isinstance(generated, str) or not generated.strip():
            raise OllamaError("Ollama returned an empty response.")
        return generated.strip()
