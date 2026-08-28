"""Deterministic prompt-enrichment tools for Module 1."""

from __future__ import annotations

import re
from typing import Dict, List

REGION_PATTERN = re.compile(r"\b[a-z]{2}-[a-z]+-\d\b")
BUDGET_PATTERN = re.compile(r"(?:\$|usd\s*)(\d[\d,]*(?:\.\d+)?)", re.IGNORECASE)
NUMBER_PATTERN = re.compile(r"\b\d[\d,]*\b")


def extract_constraints(prompt: str) -> Dict[str, str]:
    constraints: Dict[str, str] = {}

    budget_match = BUDGET_PATTERN.search(prompt)
    if budget_match:
        constraints["budget_usd"] = budget_match.group(1).replace(",", "")

    region_match = REGION_PATTERN.search(prompt.lower())
    if region_match:
        constraints["region"] = region_match.group(0)

    return constraints


def infer_scale_hints(prompt: str) -> List[str]:
    hints: List[str] = []
    normalized = prompt.lower()

    if "burst" in normalized or "spike" in normalized:
        hints.append("traffic_profile=bursty")
    if "constant" in normalized or "steady" in normalized:
        hints.append("traffic_profile=constant")
    if "real-time" in normalized or "realtime" in normalized:
        hints.append("latency_requirement=low")

    numbers = [int(raw.replace(",", "")) for raw in NUMBER_PATTERN.findall(normalized)]
    if numbers:
        max_value = max(numbers)
        if max_value >= 1_000_000:
            hints.append("scale=very_high")
        elif max_value >= 100_000:
            hints.append("scale=high")
        elif max_value >= 10_000:
            hints.append("scale=medium")
        else:
            hints.append("scale=low")

    return hints
