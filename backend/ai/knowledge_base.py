"""Small JSON-backed RAG knowledge base for Module 1."""

from dataclasses import dataclass
import json
from pathlib import Path
from typing import List


@dataclass(frozen=True)
class KnowledgeDocument:
    doc_id: str
    title: str
    content: str
    tags: List[str]


def _load_knowledge_documents(file_name: str) -> List[KnowledgeDocument]:
    file_path = Path(__file__).resolve().parent / "rag" / "knowledge_base" / file_name
    with file_path.open("r", encoding="utf-8") as handle:
        raw_docs = json.load(handle)

    docs: List[KnowledgeDocument] = []
    for raw_doc in raw_docs:
        docs.append(
            KnowledgeDocument(
                doc_id=raw_doc["doc_id"],
                title=raw_doc["title"],
                content=raw_doc["content"],
                tags=raw_doc["tags"],
            )
        )
    return docs


KNOWLEDGE_BASE: List[KnowledgeDocument] = (
    _load_knowledge_documents("systemarcht_knowledge.json")
    + _load_knowledge_documents("architecture_scenarios.json")
)
