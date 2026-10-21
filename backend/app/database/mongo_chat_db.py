"""MongoDB persistence for authenticated AI Architect conversations."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from app.core.mongo import get_user_profiles_collection


CHAT_COLLECTION = "ai_architect_conversations"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _collection():
    collection = get_user_profiles_collection()
    if collection is None:
        raise RuntimeError(
            "MongoDB user storage is not configured. Set MONGODB_USER_URI and MONGODB_USER_DB."
        )
    return collection.database[CHAT_COLLECTION]


def _message(document: Dict[str, Any]) -> Dict[str, Any]:
    result = dict(document)
    result.pop("_id", None)
    for key in ("created_at", "updated_at"):
        if isinstance(result.get(key), datetime):
            result[key] = result[key].isoformat()
    return result


def _conversation(document: Dict[str, Any]) -> Dict[str, Any]:
    result = {
        "id": document["id"],
        "title": document["title"],
        "created_at": document["created_at"].isoformat(),
        "updated_at": document["updated_at"].isoformat(),
        "messages": [_message(item) for item in document.get("messages", [])],
    }
    return result


def list_conversations(user_id: str) -> List[Dict[str, Any]]:
    documents = _collection().find(
        {"user_id": user_id},
        {"messages": 0},
    ).sort("updated_at", -1)
    return [
        {
            "id": item["id"],
            "title": item["title"],
            "created_at": item["created_at"].isoformat(),
            "updated_at": item["updated_at"].isoformat(),
            "message_count": item.get("message_count", 0),
        }
        for item in documents
    ]


def create_conversation(user_id: str, title: str = "New Architecture Chat") -> Dict[str, Any]:
    now = _now()
    conversation = {
        "id": str(uuid4()),
        "user_id": user_id,
        "title": (title or "New Architecture Chat").strip()[:100],
        "created_at": now,
        "updated_at": now,
        "message_count": 0,
        "messages": [],
    }
    _collection().insert_one(conversation)
    return _conversation(conversation)


def get_conversation(user_id: str, conv_id: str) -> Optional[Dict[str, Any]]:
    document = _collection().find_one({"user_id": user_id, "id": conv_id})
    return _conversation(document) if document else None


def update_conversation_title(user_id: str, conv_id: str, new_title: str) -> bool:
    result = _collection().update_one(
        {"user_id": user_id, "id": conv_id},
        {"$set": {"title": new_title.strip()[:100], "updated_at": _now()}},
    )
    return result.matched_count > 0


def delete_conversation(user_id: str, conv_id: str) -> bool:
    result = _collection().delete_one({"user_id": user_id, "id": conv_id})
    return result.deleted_count > 0


def add_message(
    user_id: str,
    conv_id: str,
    role: str,
    content: str,
    architecture_data: Optional[Dict[str, Any]] = None,
    diagram_mermaid: Optional[str] = None,
    sdk_code: Optional[str] = None,
    terraform_code: Optional[str] = None,
    explanation: Optional[str] = None,
) -> Dict[str, Any]:
    now = _now()
    message = {
        "id": str(uuid4()),
        "conversation_id": conv_id,
        "role": role,
        "content": content,
        "architecture_data": architecture_data,
        "diagram_mermaid": diagram_mermaid or "",
        "sdk_code": sdk_code or "",
        "terraform_code": terraform_code or "",
        "explanation": explanation or "",
        "created_at": now,
    }
    result = _collection().update_one(
        {"user_id": user_id, "id": conv_id},
        {
            "$push": {"messages": message},
            "$set": {"updated_at": now},
            "$inc": {"message_count": 1},
        },
    )
    if result.matched_count == 0:
        raise KeyError("Conversation not found")
    return _message(message)


def edit_user_message_and_truncate(
    user_id: str, conv_id: str, message_id: str, new_prompt: str
) -> Optional[Dict[str, Any]]:
    conversation = get_conversation(user_id, conv_id)
    if not conversation:
        return None
    messages = conversation["messages"]
    index = next(
        (
            position
            for position, message in enumerate(messages)
            if message["id"] == message_id and message["role"] == "user"
        ),
        None,
    )
    if index is None:
        return None
    updated = dict(messages[index])
    updated["content"] = new_prompt
    updated["created_at"] = _now().isoformat()
    messages = messages[: index + 1]
    messages[index] = updated
    _collection().update_one(
        {"user_id": user_id, "id": conv_id},
        {
            "$set": {
                "messages": messages,
                "message_count": len(messages),
                "updated_at": _now(),
            }
        },
    )
    return updated
