"""Prompt construction for Module 1 architecture generation."""

from __future__ import annotations

import json
from ai.tools import extract_constraints, infer_scale_hints


SYSTEM_PROMPT = """You are SystemArcht AI assistant for AWS architecture design.
Generate only valid JSON. Do not include markdown code fences.
Use only these service types: api_gateway, lambda, ec2, rds, dynamodb, s3.
Keep output compact, factual, and implementation-oriented.
"""


def build_generation_prompt(user_prompt: str, retrieved_context: str) -> str:
    constraints = extract_constraints(user_prompt)
    scale_hints = infer_scale_hints(user_prompt)
    schema = {
        "architecture": {
            "name": "string",
            "description": "string",
            "services": [
                {
                    "id": "string",
                    "type": "api_gateway|lambda|ec2|rds|dynamodb|s3",
                    "name": "string",
                    "configuration": {"key": "value"},
                }
            ],
            "connections": [{"source": "service-id", "target": "service-id"}],
        },
        "reasoning": {"pattern": "string", "key_decisions": ["string"]},
        "assumptions": ["string"],
        "confidence": "number in range [0,1]",
    }

    return (
        f"User request:\n{user_prompt}\n\n"
        f"Retrieved knowledge:\n{retrieved_context}\n\n"
        f"Tool hints:\n"
        f"- constraints={json.dumps(constraints)}\n"
        f"- scale_hints={json.dumps(scale_hints)}\n\n"
        "Task:\n"
        "1) Propose a practical AWS architecture.\n"
        "2) Respect the service type whitelist.\n"
        "3) Create valid service IDs and valid connection references.\n"
        "4) Return strict JSON matching this schema:\n"
        f"{json.dumps(schema, indent=2)}\n"
    )
