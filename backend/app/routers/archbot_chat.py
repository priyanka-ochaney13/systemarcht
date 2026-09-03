"""ArchBot conversational chat routes (LLM explanation layer).

This router never computes AWS costs itself. It hands the LLM provider the
deterministic cost_result already produced by /api/architecture/calculate
and instructs it (via ai.chat_prompts.CHAT_SYSTEM_PROMPT) to treat those
numbers as authoritative. The existing /api/architecture/calculate endpoint
and ArchitectureCalculator are untouched by this file.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ai.chat_prompts import CHAT_SYSTEM_PROMPT, build_chat_user_prompt
from ai.chat_schemas import ChatRequest, ChatResponse
from ai.llm_provider import get_llm_provider

router = APIRouter(prefix="/api/ai/chat", tags=["ArchBot Chat"])


@router.post("/architecture", response_model=ChatResponse)
def chat_about_architecture(request: ChatRequest) -> ChatResponse:
    """Answer a free-text question about the user's architecture/cost result.

    The deterministic cost calculator remains the only source of numerical
    truth - this endpoint only reasons about numbers already computed
    elsewhere and passed in via `cost_result`.
    """
    architecture_snapshot = (
        request.architecture_snapshot.model_dump() if request.architecture_snapshot else None
    )
    cost_result = request.cost_result.model_dump() if request.cost_result else None
    history = [turn.model_dump() for turn in request.history]

    user_prompt = build_chat_user_prompt(
        user_message=request.message,
        architecture_snapshot=architecture_snapshot,
        cost_result=cost_result,
        history=history,
    )

    provider_name = None
    try:
        provider = get_llm_provider(provider_name)
        reply = provider.chat(CHAT_SYSTEM_PROMPT, user_prompt)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return ChatResponse(reply=reply, provider="groq")