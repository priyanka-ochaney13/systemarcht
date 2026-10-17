"""Module 2 structured architecture generation service."""

from __future__ import annotations

import json
import logging
import time

from pydantic import ValidationError

from ai.chat_knowledge import retrieve
from ai.architecture_validator import validate_architecture
from ai.ollama_service import OllamaError, OllamaService
from ai.prompts import (
    ARCHITECTURE_GENERATION_SYSTEM_PROMPT,
    build_generation_prompt,
)
from ai.schemas import Architecture

logger = logging.getLogger(__name__)


class ArchitectureGenerationError(RuntimeError):
    """Controlled failure raised when structured generation cannot complete."""


def _parse_json_response(raw_response: str) -> dict:
    try:
        payload = json.loads(raw_response)
    except json.JSONDecodeError as exc:
        logger.warning("Module 2 JSON parsing failed: invalid JSON")
        raise ArchitectureGenerationError(
            "Model response was not valid JSON."
        ) from exc
    if not isinstance(payload, dict):
        logger.warning("Module 2 JSON parsing failed: response was not an object")
        raise ArchitectureGenerationError("Model response must be a JSON object.")
    return payload


def generate_architecture(prompt: str) -> Architecture:
    """Retrieve context, generate JSON with Ollama, and validate an Architecture."""
    if not prompt or len(prompt.strip()) < 5:
        raise ValueError("Prompt must be at least 5 characters.")

    started = time.perf_counter()
    logger.info("Module 2 user request: %s", prompt)

    chunks = retrieve(prompt)
    context = "\n\n".join(
        f"[{chunk.document}]\n{chunk.content}" for chunk in chunks
    )
    logger.info("Module 2 retrieved context: %s", [chunk.document for chunk in chunks])
    generation_prompt = build_generation_prompt(prompt, context)

    try:
        raw_response = OllamaService().generate(
            ARCHITECTURE_GENERATION_SYSTEM_PROMPT,
            generation_prompt,
        )
    except OllamaError:
        logger.exception("Module 2 Ollama generation failed")
        logger.info(
            "Module 2 generation latency_ms: %.2f",
            (time.perf_counter() - started) * 1000,
        )
        raise

    logger.info("Module 2 model response: %s", raw_response)
    try:
        payload = _parse_json_response(raw_response)
    except ArchitectureGenerationError:
        logger.info(
            "Module 2 generation latency_ms: %.2f",
            (time.perf_counter() - started) * 1000,
        )
        raise
    logger.info("Module 2 JSON parsing succeeded")

    try:
        architecture = Architecture.model_validate(payload)
    except ValidationError as exc:
        logger.warning("Module 2 architecture validation failed: %s", exc)
        logger.info(
            "Module 2 generation latency_ms: %.2f",
            (time.perf_counter() - started) * 1000,
        )
        raise ArchitectureGenerationError(
            "Model JSON did not match the Architecture schema."
        ) from exc

    validation = validate_architecture(architecture)
    if not validation.valid:
        logger.warning("Module 2 architecture gate rejected generated output: %s", validation.errors)
        raise ArchitectureGenerationError(
            "Generated architecture failed validation: "
            + "; ".join(error.message for error in validation.errors)
        )

    logger.info("Module 2 architecture validation succeeded")
    logger.info(
        "Module 2 generation latency_ms: %.2f",
        (time.perf_counter() - started) * 1000,
    )
    return architecture
