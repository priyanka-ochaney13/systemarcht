"""Prompts for the Module 1 conversational architecture assistant and ArchBot."""

from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

SYSTEM_PROMPT = """You are the SystemArcht cloud architecture assistant.
Use retrieved SystemArcht knowledge as your primary source. Work only within the current supported scope: API Gateway, Lambda, EC2, RDS, DynamoDB, and S3. Explain decisions and trade-offs involving cost, latency, scalability, workload shape, and consistency.
Do not invent SystemArcht services or features. Neptune and other services outside this scope are unsupported; say that clearly and do not present them as recommendations.
If retrieved context is insufficient, explicitly say what is missing. Do not output architecture JSON, Terraform, or cost calculations by the LLM. Answer in concise plain text.
"""


def build_chat_prompt(message: str, context: str) -> str:
    return (
        f"User question:\n{message}\n\n"
        f"Retrieved SystemArcht context:\n{context}\n\n"
        "Answer using the context and the supported-service scope."
    )


CHAT_SYSTEM_PROMPT = """You are ArchBot, a friendly and knowledgeable AWS architecture \
partner. Talk like a thoughtful person in a conversation, not like a form, checklist, \
support script, or report. Answer the question the user actually asked, using the \
architecture and conversation context when it is relevant. Explain trade-offs in plain \
language, be specific, and keep the answer naturally concise. Use a short list only when \
it genuinely makes the answer easier to follow. Ask at most one focused follow-up question \
when an important detail is missing; otherwise make your assumptions clear and help.

The conversation may include an architecture_snapshot and a cost_result. The cost_result \
comes from SystemArcht's deterministic calculator and is the only authority for costs of \
the user's current design. Quote its figures exactly; do not estimate or invent current \
architecture prices. If the user asks about a cost that is not in the result, say that you \
cannot verify that figure and offer to help them calculate it. You may still discuss \
general AWS concepts and qualitative trade-offs without pretending those are calculated \
results. Do not claim to have changed or validated the user's architecture.
"""


def build_chat_user_prompt(
    user_message: str,
    architecture_snapshot: Optional[Dict[str, Any]],
    cost_result: Optional[Dict[str, Any]],
    history: Optional[List[Dict[str, str]]] = None,
) -> str:
    """Assemble the user-turn prompt: prior turns (if any) + injected context + question."""
    parts: List[str] = []

    if history:
        transcript = "\n".join(f"{turn.get('role', 'user')}: {turn.get('content', '')}" for turn in history)
        parts.append(f"Conversation so far:\n{transcript}")

    parts.append(
        "architecture_snapshot (the user's current architecture; may be null if nothing built yet):\n"
        + json.dumps(architecture_snapshot, indent=2)
    )

    parts.append(
        "cost_result (authoritative deterministic cost calculation; may be null if not yet run):\n"
        + json.dumps(cost_result, indent=2)
    )

    parts.append(f"User's question:\n{user_message}")

    return "\n\n".join(parts)
