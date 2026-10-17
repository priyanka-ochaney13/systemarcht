"""Deterministic Mermaid generation for validated architectures."""

from __future__ import annotations

import re
from typing import Iterable

from ai.architecture_validator import ArchitectureValidationResult, validate_architecture
from ai.schemas import Architecture

_SAFE_ID = re.compile(r"[^A-Za-z0-9_]")


class MermaidGenerationError(ValueError):
    """Raised when an architecture has not passed Module 4 validation."""

    def __init__(self, result: ArchitectureValidationResult) -> None:
        self.result = result
        super().__init__("Architecture must pass validation before diagram generation.")


def _mermaid_id(service_id: str, used_ids: set[str]) -> str:
    candidate = _SAFE_ID.sub("_", service_id)
    if not candidate or candidate[0].isdigit():
        candidate = f"service_{candidate}"
    base = candidate
    suffix = 2
    while candidate in used_ids:
        candidate = f"{base}_{suffix}"
        suffix += 1
    used_ids.add(candidate)
    return candidate


def _escape_label(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', "&quot;").replace("\r", " ").replace("\n", " ")


def _lines(items: Iterable[str]) -> str:
    return "\n".join(items)


def generate_mermaid(architecture: Architecture) -> str:
    """Generate a Mermaid flowchart from an architecture that passed Module 4."""
    validation = validate_architecture(architecture)
    if not validation.valid:
        raise MermaidGenerationError(validation)

    used_ids: set[str] = set()
    mermaid_ids = {
        service.id: _mermaid_id(service.id, used_ids)
        for service in architecture.services
    }
    lines = ["flowchart TD"]
    for service in architecture.services:
        label = _escape_label(f"{service.type} - {service.name}")
        lines.append(f'{mermaid_ids[service.id]}["{label}"]')
    for connection in architecture.connections:
        source = mermaid_ids[connection.source]
        target = mermaid_ids[connection.target]
        label = _escape_label(connection.type)
        lines.append(f"{source} -->|{label}| {target}" if label else f"{source} --> {target}")
    return _lines(lines)
