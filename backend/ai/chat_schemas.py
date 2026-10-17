"""Request/response schemas for the ArchBot conversational chat endpoint.

Reuses the existing, canonical ArchitectureRequest / ArchitectureCostResponse
models from app.models.architecture so this layer never defines a second,
divergent shape for the architecture or its cost result.
"""

from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field

from app.models.architecture import ArchitectureRequest, ArchitectureCostResponse


class ChatHistoryTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    """A single ArchBot conversational turn."""

    message: str = Field(..., min_length=1, description="The user's free-text question")
    architecture_snapshot: Optional[ArchitectureRequest] = Field(
        default=None,
        description="Current architecture (nodes/connections) from the Playground, if any",
    )
    cost_result: Optional[ArchitectureCostResponse] = Field(
        default=None,
        description="The last deterministic /api/architecture/calculate result, if any. "
        "Treated as authoritative ground truth for any dollar figure.",
    )
    history: List[ChatHistoryTurn] = Field(
        default_factory=list,
        description="Optional prior turns in this conversation, oldest first",
    )


class ChatResponse(BaseModel):
    reply: str = Field(..., description="Free-text response from the LLM")
    provider: str = Field(..., description="Which LLM provider generated this reply, e.g. 'groq'")