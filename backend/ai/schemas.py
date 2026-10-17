"""Canonical input/output schemas for structured architecture generation."""

import json
from typing import Any, Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


ServiceType = Literal["api_gateway", "lambda", "ec2", "rds", "dynamodb", "s3"]


class ArchitectureGenerationRequest(BaseModel):
    task: Literal["generate_architecture"] = "generate_architecture"
    prompt: str = Field(..., min_length=5)


class ArchitectureRequest(BaseModel):
    """Request contract for the isolated Module 2 architecture endpoint."""

    model_config = ConfigDict(extra="forbid")

    message: str = Field(min_length=5, max_length=4000)

    @field_validator("message")
    @classmethod
    def validate_message(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("must not be blank")
        return value


class ArchitectureValidationRequest(BaseModel):
    """Request wrapper for the standalone Module 4 validation endpoint."""

    model_config = ConfigDict(extra="forbid")

    architecture: Any


class ArchitectureDiagramResponse(BaseModel):
    """Mermaid representation returned after successful validation."""

    model_config = ConfigDict(extra="forbid")

    mermaid: str
    valid: Literal[True] = True


class Configuration(BaseModel):
    """Extensible service-specific settings without a fixed AWS property schema."""

    model_config = ConfigDict(extra="allow")


class Service(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1)
    type: ServiceType
    name: str = Field(min_length=1)
    configuration: Configuration = Field(default_factory=Configuration)

    @field_validator("id", "name")
    @classmethod
    def validate_non_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("must not be blank")
        return value


class Connection(BaseModel):
    model_config = ConfigDict(extra="forbid")

    source: str = Field(min_length=1)
    target: str = Field(min_length=1)
    type: str = Field(min_length=1)

    @field_validator("source", "target", "type")
    @classmethod
    def validate_non_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("must not be blank")
        return value


class Architecture(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1)
    description: str = Field(min_length=1)
    services: list[Service] = Field(min_length=1)
    connections: list[Connection] = Field(default_factory=list)
    configuration: Configuration = Field(default_factory=Configuration)

    @field_validator("name", "description")
    @classmethod
    def validate_non_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("must not be blank")
        return value

    @model_validator(mode="after")
    def validate_graph(self) -> "Architecture":
        service_ids = [service.id for service in self.services]
        if len(service_ids) != len(set(service_ids)):
            raise ValueError("Service IDs must be unique.")

        known_ids = set(service_ids)
        if any(
            connection.source not in known_ids or connection.target not in known_ids
            for connection in self.connections
        ):
            raise ValueError("Connections must reference existing service IDs.")
        return self


# Backward-compatible names for the Module 2 generation endpoint.
GeneratedService = Service
GeneratedConnection = Connection
GeneratedArchitecture = Architecture


def architecture_json_schema() -> dict[str, Any]:
    """Return the JSON Schema generated from the canonical Architecture model."""
    return Architecture.model_json_schema()


def architecture_json_schema_text() -> str:
    """Return the canonical Architecture JSON Schema formatted for an LLM prompt."""
    return json.dumps(architecture_json_schema(), indent=2, sort_keys=True)


class ArchitectureGenerationResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    architecture: Architecture
