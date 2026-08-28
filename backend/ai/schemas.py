"""Canonical input/output schemas for architecture generation."""

from typing import Dict, List, Literal
from pydantic import BaseModel, Field


ServiceType = Literal["api_gateway", "lambda", "ec2", "rds", "dynamodb", "s3"]


class ArchitectureGenerationRequest(BaseModel):
    task: Literal["generate_architecture"] = "generate_architecture"
    prompt: str = Field(..., min_length=5)


class GeneratedService(BaseModel):
    id: str
    type: ServiceType
    name: str
    configuration: Dict[str, str | int | float | bool] = Field(default_factory=dict)


class GeneratedConnection(BaseModel):
    source: str
    target: str


class GeneratedArchitecture(BaseModel):
    name: str
    description: str
    services: List[GeneratedService] = Field(min_length=1)
    connections: List[GeneratedConnection] = Field(default_factory=list)


class GeneratedReasoning(BaseModel):
    pattern: str
    key_decisions: List[str] = Field(min_length=1)


class ArchitectureGenerationResponse(BaseModel):
    architecture: GeneratedArchitecture
    reasoning: GeneratedReasoning
    assumptions: List[str] = Field(default_factory=list)
    confidence: float = Field(..., ge=0.0, le=1.0)
