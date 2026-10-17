"""Qwen integration for structured architecture generation."""

from __future__ import annotations

import json

from ai.ollama_service import OllamaService
from ai.prompts import ARCHITECTURE_GENERATION_SYSTEM_PROMPT, build_generation_prompt
from ai.retrieval import format_retrieved_context
from ai.schemas import ArchitectureGenerationResponse


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
    raw_response = OllamaService().generate(
        ARCHITECTURE_GENERATION_SYSTEM_PROMPT,
        user_prompt,
    )
    payload = _extract_json_payload(raw_response)
    return ArchitectureGenerationResponse.model_validate(payload)
