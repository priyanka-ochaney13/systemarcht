"""Simple lexical retrieval for Module 1 knowledge base."""

from __future__ import annotations

import re
from typing import List
from ai.knowledge_base import KNOWLEDGE_BASE, KnowledgeDocument

TOKEN_PATTERN = re.compile(r"[a-z0-9_]+")


def _tokenize(text: str) -> set[str]:
    return {token for token in TOKEN_PATTERN.findall(text.lower()) if len(token) > 2}


def retrieve_relevant_documents(query: str, top_k: int = 3) -> List[KnowledgeDocument]:
    if top_k < 1:
        raise ValueError("top_k must be at least 1")

    query_tokens = _tokenize(query)
    if not query_tokens:
        return KNOWLEDGE_BASE[:top_k]

    scored: list[tuple[int, KnowledgeDocument]] = []
    for doc in KNOWLEDGE_BASE:
        content_tokens = _tokenize(f"{doc.title} {doc.content}")
        tag_tokens = set(tag.lower() for tag in doc.tags)
        score = len(query_tokens & content_tokens) + 2 * len(query_tokens & tag_tokens)
        if score > 0:
            scored.append((score, doc))

    scored.sort(key=lambda x: x[0], reverse=True)
    ranked = [doc for _, doc in scored]

    if len(ranked) < top_k:
        existing_ids = {doc.doc_id for doc in ranked}
        for doc in KNOWLEDGE_BASE:
            if doc.doc_id not in existing_ids:
                ranked.append(doc)
            if len(ranked) == top_k:
                break

    return ranked[:top_k]


def format_retrieved_context(query: str, top_k: int = 3) -> str:
    docs = retrieve_relevant_documents(query=query, top_k=top_k)
    lines = []
    for index, doc in enumerate(docs, start=1):
        lines.append(f"{index}. {doc.title} [{doc.doc_id}]")
        lines.append(f"   {doc.content}")
    return "\n".join(lines)
