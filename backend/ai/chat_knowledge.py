"""Markdown knowledge loader and lightweight lexical retrieval for AI chat."""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

TOKEN_PATTERN = re.compile(r"[a-z0-9]+")
KNOWLEDGE_DIR = Path(__file__).resolve().parent / "knowledge" / "documents"


@dataclass(frozen=True)
class KnowledgeChunk:
    document: str
    content: str
    score: int = 0


def _tokens(text: str) -> set[str]:
    return {token for token in TOKEN_PATTERN.findall(text.lower()) if len(token) > 2}


def _load_chunks() -> list[KnowledgeChunk]:
    chunks = []
    for path in sorted(KNOWLEDGE_DIR.glob("*.md")):
        content = path.read_text(encoding="utf-8").strip()
        if content:
            chunks.append(KnowledgeChunk(document=path.name, content=content))
    return chunks


KNOWLEDGE_CHUNKS = _load_chunks()


def retrieve(query: str, top_k: int = 3) -> list[KnowledgeChunk]:
    if top_k < 1:
        raise ValueError("top_k must be at least 1")

    query_tokens = _tokens(query)
    scored = []
    for chunk in KNOWLEDGE_CHUNKS:
        score = len(query_tokens & _tokens(chunk.content))
        if score:
            scored.append(KnowledgeChunk(chunk.document, chunk.content, score))

    scored.sort(key=lambda chunk: chunk.score, reverse=True)
    selected = scored[:top_k]
    selected_names = {chunk.document for chunk in selected}
    for chunk in KNOWLEDGE_CHUNKS:
        if len(selected) >= top_k:
            break
        if chunk.document not in selected_names:
            selected.append(chunk)
    return selected
