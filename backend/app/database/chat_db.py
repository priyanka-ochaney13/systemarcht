"""Chat history database layer using SQLite with optional MongoDB fallback.

Provides persistent chat storage for the AI Architecture Assistant:
- Conversations list, create, title edit, delete
- Messages list, append, edit prompt & truncate downstream
"""

from __future__ import annotations

import json
import logging
import os
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

DB_DIR = Path(__file__).resolve().parent.parent.parent / "database"
DB_DIR.mkdir(parents=True, exist_ok=True)
SQLITE_DB_PATH = DB_DIR / "chat_history.db"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(SQLITE_DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db() -> None:
    """Initialize SQLite database tables for chat history."""
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                conversation_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                architecture_data TEXT,
                diagram_mermaid TEXT,
                sdk_code TEXT,
                terraform_code TEXT,
                explanation TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
            )
            """
        )
        conn.commit()
    logger.info("Chat history SQLite database initialized at %s", SQLITE_DB_PATH)


def list_conversations() -> List[Dict[str, Any]]:
    """List all conversations ordered by updated_at desc."""
    init_db()
    with get_connection() as conn:
        cursor = conn.execute(
            """
            SELECT c.id, c.title, c.created_at, c.updated_at,
                   COUNT(m.id) as message_count
            FROM conversations c
            LEFT JOIN messages m ON c.id = m.conversation_id
            GROUP BY c.id
            ORDER BY c.updated_at DESC
            """
        )
        rows = cursor.fetchall()
        return [
            {
                "id": row["id"],
                "title": row["title"],
                "created_at": row["created_at"],
                "updated_at": row["updated_at"],
                "message_count": row["message_count"],
            }
            for row in rows
        ]


def create_conversation(title: str = "New Architecture Chat") -> Dict[str, Any]:
    """Create a new conversation."""
    init_db()
    conv_id = str(uuid.uuid4())
    now = _now_iso()
    clean_title = (title or "New Architecture Chat").strip()[:100]

    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO conversations (id, title, created_at, updated_at)
            VALUES (?, ?, ?, ?)
            """,
            (conv_id, clean_title, now, now),
        )
        conn.commit()

    return {
        "id": conv_id,
        "title": clean_title,
        "created_at": now,
        "updated_at": now,
        "messages": [],
    }


def get_conversation(conv_id: str) -> Optional[Dict[str, Any]]:
    """Get conversation metadata and all messages."""
    init_db()
    with get_connection() as conn:
        cursor = conn.execute(
            "SELECT id, title, created_at, updated_at FROM conversations WHERE id = ?",
            (conv_id,),
        )
        conv = cursor.fetchone()
        if not conv:
            return None

        msg_cursor = conn.execute(
            """
            SELECT id, conversation_id, role, content, architecture_data,
                   diagram_mermaid, sdk_code, terraform_code, explanation, created_at
            FROM messages
            WHERE conversation_id = ?
            ORDER BY created_at ASC
            """,
            (conv_id,),
        )
        messages = []
        for row in msg_cursor.fetchall():
            arch_data = None
            if row["architecture_data"]:
                try:
                    arch_data = json.loads(row["architecture_data"])
                except Exception:
                    arch_data = None
            messages.append(
                {
                    "id": row["id"],
                    "conversation_id": row["conversation_id"],
                    "role": row["role"],
                    "content": row["content"],
                    "architecture_data": arch_data,
                    "diagram_mermaid": row["diagram_mermaid"] or "",
                    "sdk_code": row["sdk_code"] or "",
                    "terraform_code": row["terraform_code"] or "",
                    "explanation": row["explanation"] or "",
                    "created_at": row["created_at"],
                }
            )

        return {
            "id": conv["id"],
            "title": conv["title"],
            "created_at": conv["created_at"],
            "updated_at": conv["updated_at"],
            "messages": messages,
        }


def update_conversation_title(conv_id: str, new_title: str) -> bool:
    """Update conversation title."""
    init_db()
    now = _now_iso()
    with get_connection() as conn:
        cursor = conn.execute(
            """
            UPDATE conversations
            SET title = ?, updated_at = ?
            WHERE id = ?
            """,
            (new_title.strip()[:100], now, conv_id),
        )
        conn.commit()
        return cursor.rowcount > 0


def delete_conversation(conv_id: str) -> bool:
    """Delete a conversation and cascade delete its messages."""
    init_db()
    with get_connection() as conn:
        cursor = conn.execute("DELETE FROM conversations WHERE id = ?", (conv_id,))
        conn.commit()
        return cursor.rowcount > 0


def add_message(
    conv_id: str,
    role: str,
    content: str,
    architecture_data: Optional[Dict[str, Any]] = None,
    diagram_mermaid: Optional[str] = None,
    sdk_code: Optional[str] = None,
    terraform_code: Optional[str] = None,
    explanation: Optional[str] = None,
) -> Dict[str, Any]:
    """Add a message to a conversation and touch updated_at."""
    init_db()
    msg_id = str(uuid.uuid4())
    now = _now_iso()
    arch_json = json.dumps(architecture_data) if architecture_data else None

    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO messages (
                id, conversation_id, role, content, architecture_data,
                diagram_mermaid, sdk_code, terraform_code, explanation, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                msg_id,
                conv_id,
                role,
                content,
                arch_json,
                diagram_mermaid or "",
                sdk_code or "",
                terraform_code or "",
                explanation or "",
                now,
            ),
        )
        conn.execute(
            "UPDATE conversations SET updated_at = ? WHERE id = ?",
            (now, conv_id),
        )
        conn.commit()

    return {
        "id": msg_id,
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


def edit_user_message_and_truncate(conv_id: str, message_id: str, new_prompt: str) -> Optional[Dict[str, Any]]:
    """Update user prompt and delete all subsequent messages in this thread."""
    init_db()
    now = _now_iso()
    with get_connection() as conn:
        # Find target message created_at
        cursor = conn.execute(
            "SELECT created_at FROM messages WHERE id = ? AND conversation_id = ?",
            (message_id, conv_id),
        )
        row = cursor.fetchone()
        if not row:
            return None
        target_created_at = row["created_at"]

        # Delete all messages that came strictly after this message
        conn.execute(
            "DELETE FROM messages WHERE conversation_id = ? AND created_at > ?",
            (conv_id, target_created_at),
        )

        # Update this user message's content
        conn.execute(
            "UPDATE messages SET content = ?, created_at = ? WHERE id = ?",
            (new_prompt, now, message_id),
        )
        conn.execute(
            "UPDATE conversations SET updated_at = ? WHERE id = ?",
            (now, conv_id),
        )
        conn.commit()

    return {
        "id": message_id,
        "conversation_id": conv_id,
        "role": "user",
        "content": new_prompt,
        "created_at": now,
    }

