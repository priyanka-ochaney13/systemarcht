"""FastAPI Router for the dedicated AI Architecture Assistant.

Features:
- Full conversation history (ChatGPT-like persistence via SQLite/MongoDB)
- Session management: New chat, rename, delete chat
- Edit user prompt & re-generate architecture
- AI generation of AWS architectures, Mermaid visual diagrams, SDK code, Terraform IaC, and explanations
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.database.chat_db import (
    add_message,
    create_conversation,
    delete_conversation,
    edit_user_message_and_truncate,
    get_conversation,
    list_conversations,
    update_conversation_title,
)
from app.services.architecture.ai_generator import generate_aws_architecture

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai-architect", tags=["AI Architecture Assistant"])


class CreateConversationRequest(BaseModel):
    title: Optional[str] = "New Architecture Chat"


class UpdateTitleRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=120)


class SendMessageRequest(BaseModel):
    message: str = Field(..., min_length=2, max_length=5000)


class EditMessageRequest(BaseModel):
    message: str = Field(..., min_length=2, max_length=5000)


@router.get("/conversations")
def get_conversations() -> List[Dict[str, Any]]:
    """Get all saved chat sessions ordered by last updated."""
    try:
        return list_conversations()
    except Exception as exc:
        logger.exception("Failed to list conversations: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/conversations", status_code=status.HTTP_201_CREATED)
def new_conversation(req: Optional[CreateConversationRequest] = None) -> Dict[str, Any]:
    """Start a fresh chat session."""
    title = req.title if req and req.title else "New Architecture Chat"
    try:
        return create_conversation(title=title)
    except Exception as exc:
        logger.exception("Failed to create conversation: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/conversations/{conv_id}")
def get_conversation_details(conv_id: str) -> Dict[str, Any]:
    """Get a specific conversation and all of its messages."""
    conv = get_conversation(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


@router.patch("/conversations/{conv_id}")
def rename_conversation(conv_id: str, req: UpdateTitleRequest) -> Dict[str, Any]:
    """Rename a conversation title."""
    success = update_conversation_title(conv_id, req.title)
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"id": conv_id, "title": req.title}


@router.delete("/conversations/{conv_id}")
def remove_conversation(conv_id: str) -> Dict[str, Any]:
    """Delete a conversation and all its messages."""
    success = delete_conversation(conv_id)
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"deleted": True, "id": conv_id}


@router.post("/conversations/{conv_id}/messages")
def send_message(conv_id: str, req: SendMessageRequest) -> Dict[str, Any]:
    """Send user message, synthesize AWS architecture, and store assistant reply."""
    conv = get_conversation(conv_id)
    if not conv:
        # Create conversation automatically if it doesn't exist yet
        conv = create_conversation(title=req.message[:40] + ("..." if len(req.message) > 40 else ""))
        conv_id = conv["id"]

    # 1. Record user message
    user_msg = add_message(
        conv_id=conv_id,
        role="user",
        content=req.message.strip(),
    )

    # 2. Update title if this is the first turn
    if len(conv.get("messages", [])) == 0:
        auto_title = req.message.strip().split("\n")[0][:45]
        update_conversation_title(conv_id, auto_title)

    # 3. Generate AWS Architecture via API / synthesizer
    try:
        arch_data = generate_aws_architecture(req.message.strip())
    except Exception as exc:
        logger.exception("Architecture generation failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Generation failed: {exc}") from exc

    # 4. Record assistant message
    asst_msg = add_message(
        conv_id=conv_id,
        role="assistant",
        content=arch_data.get("summary", "Generated Architecture"),
        architecture_data=arch_data,
        diagram_mermaid=arch_data.get("mermaid"),
        sdk_code=arch_data.get("sdk_code"),
        terraform_code=arch_data.get("terraform_code"),
        explanation=arch_data.get("explanation"),
    )

    return {
        "conversation_id": conv_id,
        "user_message": user_msg,
        "assistant_message": asst_msg,
    }


@router.put("/conversations/{conv_id}/messages/{message_id}")
def edit_prompt_and_regenerate(
    conv_id: str, message_id: str, req: EditMessageRequest
) -> Dict[str, Any]:
    """Edit a user prompt, prune subsequent messages, and regenerate response."""
    conv = get_conversation(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    updated_user_msg = edit_user_message_and_truncate(
        conv_id=conv_id, message_id=message_id, new_prompt=req.message.strip()
    )
    if not updated_user_msg:
        raise HTTPException(status_code=404, detail="Message not found")

    try:
        arch_data = generate_aws_architecture(req.message.strip())
    except Exception as exc:
        logger.exception("Re-generation failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Re-generation failed: {exc}") from exc

    asst_msg = add_message(
        conv_id=conv_id,
        role="assistant",
        content=arch_data.get("summary", "Generated Architecture"),
        architecture_data=arch_data,
        diagram_mermaid=arch_data.get("mermaid"),
        sdk_code=arch_data.get("sdk_code"),
        terraform_code=arch_data.get("terraform_code"),
        explanation=arch_data.get("explanation"),
    )

    return {
        "conversation_id": conv_id,
        "user_message": updated_user_msg,
        "assistant_message": asst_msg,
    }

