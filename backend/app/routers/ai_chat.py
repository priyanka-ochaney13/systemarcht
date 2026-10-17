"""Isolated Module 1 AI assistant endpoint."""

from __future__ import annotations

import logging
import time

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ai.chat_knowledge import retrieve
from ai.chat_prompts import SYSTEM_PROMPT, build_chat_prompt
from ai.ollama_service import OllamaError, OllamaService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/ai", tags=["AI Chat"])


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)


class ChatSource(BaseModel):
    document: str
    content: str


class ChatResponse(BaseModel):
    response: str
    sources: list[ChatSource]


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    started = time.perf_counter()
    chunks = retrieve(request.message)
    context = "\n\n".join(
        f"[{chunk.document}]\n{chunk.content}" for chunk in chunks
    )
    prompt = build_chat_prompt(request.message, context)
    logger.info("AI query: %s", request.message)
    logger.info("AI retrieved chunks: %s", [chunk.document for chunk in chunks])
    logger.info("AI prompt sent to Ollama: %s", prompt)

    try:
        response = OllamaService().generate(SYSTEM_PROMPT, prompt)
    except OllamaError as exc:
        logger.error("AI Ollama failure: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    logger.info("AI response: %s", response)
    logger.info("AI response latency_ms: %.2f", (time.perf_counter() - started) * 1000)
    return ChatResponse(
        response=response,
        sources=[ChatSource(document=chunk.document, content=chunk.content) for chunk in chunks],
    )
