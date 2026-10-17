"""Deterministic Module 4 validation for generated architectures."""

from __future__ import annotations

import json
import logging
from typing import Any, Literal, Mapping

from pydantic import BaseModel, ConfigDict, Field, ValidationError

from ai.schemas import Architecture, ServiceType

logger = logging.getLogger(__name__)
SUPPORTED_SERVICE_TYPES = set(ServiceType.__args__)
CONNECTION_TYPES = {"request", "storage", "data", "trigger"}

# Relationships represented by the current structured SystemArcht scope.
ALLOWED_CONNECTIONS = {
    ("api_gateway", "lambda"),
    ("api_gateway", "ec2"),
    ("api_gateway", "rds"),
    ("api_gateway", "dynamodb"),
    ("lambda", "lambda"),
    ("lambda", "s3"),
    ("lambda", "dynamodb"),
    ("lambda", "rds"),
    ("s3", "lambda"),
    ("ec2", "rds"),
    ("ec2", "dynamodb"),
    ("ec2", "s3"),
}


class ValidationIssue(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: Literal[
        "INVALID_SCHEMA",
        "INVALID_SERVICE",
        "UNSUPPORTED_SERVICE",
        "DUPLICATE_SERVICE_ID",
        "INVALID_CONNECTION",
        "UNKNOWN_CONNECTION_SOURCE",
        "UNKNOWN_CONNECTION_TARGET",
        "UNSUPPORTED_CONNECTION",
        "INVALID_CONFIGURATION",
    ]
    message: str = Field(min_length=1)


class ArchitectureValidationResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    valid: bool
    errors: list[ValidationIssue] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


def _issue(issue_type: str, message: str) -> ValidationIssue:
    return ValidationIssue(type=issue_type, message=message)  # type: ignore[arg-type]


def _unsupported_types(value: Mapping[str, Any]) -> list[str]:
    services = value.get("services", [])
    if not isinstance(services, list):
        return []
    return [
        service.get("type")
        for service in services
        if isinstance(service, dict)
        and isinstance(service.get("type"), str)
        and service["type"] not in SUPPORTED_SERVICE_TYPES
    ]


def _specific_schema_issue(value: Mapping[str, Any]) -> ValidationIssue | None:
    services = value.get("services")
    connections = value.get("connections", [])
    if not isinstance(services, list):
        return None
    service_ids = [
        service.get("id")
        for service in services
        if isinstance(service, dict) and isinstance(service.get("id"), str)
    ]
    if len(service_ids) != len(set(service_ids)):
        duplicate = next(service_id for service_id in service_ids if service_ids.count(service_id) > 1)
        return _issue("DUPLICATE_SERVICE_ID", f"Service ID '{duplicate}' is duplicated.")
    if isinstance(connections, list):
        known_ids = set(service_ids)
        for connection in connections:
            if not isinstance(connection, dict):
                continue
            if connection.get("source") not in known_ids:
                return _issue("UNKNOWN_CONNECTION_SOURCE", f"Connection source '{connection.get('source')}' does not exist.")
            if connection.get("target") not in known_ids:
                return _issue("UNKNOWN_CONNECTION_TARGET", f"Connection target '{connection.get('target')}' does not exist.")
    return None


def _validate_services(architecture: Architecture) -> list[ValidationIssue]:
    errors: list[ValidationIssue] = []
    seen: set[str] = set()
    for service in architecture.services:
        if service.id in seen:
            errors.append(_issue("DUPLICATE_SERVICE_ID", f"Service ID '{service.id}' is duplicated."))
        seen.add(service.id)
        if service.type not in SUPPORTED_SERVICE_TYPES:
            errors.append(_issue("UNSUPPORTED_SERVICE", f"Service type '{service.type}' is not supported by SystemArcht."))
        if not isinstance(service.configuration, BaseModel):
            errors.append(_issue("INVALID_CONFIGURATION", f"Configuration for service '{service.id}' is invalid."))
    return errors


def _validate_connections(architecture: Architecture) -> list[ValidationIssue]:
    errors: list[ValidationIssue] = []
    services = {service.id: service for service in architecture.services}
    for connection in architecture.connections:
        source = services.get(connection.source)
        target = services.get(connection.target)
        if source is None:
            errors.append(_issue("UNKNOWN_CONNECTION_SOURCE", f"Connection source '{connection.source}' does not exist."))
        if target is None:
            errors.append(_issue("UNKNOWN_CONNECTION_TARGET", f"Connection target '{connection.target}' does not exist."))
        if connection.type not in CONNECTION_TYPES:
            errors.append(_issue("INVALID_CONNECTION", f"Connection type '{connection.type}' is invalid."))
        if source and target and (source.type, target.type) not in ALLOWED_CONNECTIONS:
            errors.append(_issue(
                "UNSUPPORTED_CONNECTION",
                f"Connection from '{source.type}' to '{target.type}' is not supported by SystemArcht.",
            ))
    return errors


class ArchitectureValidator:
    """Validate architecture JSON without calling an LLM or external service."""

    def validate(self, value: Architecture | Mapping[str, Any] | str) -> ArchitectureValidationResult:
        logger.info("Architecture validation started")
        if isinstance(value, str):
            try:
                value = json.loads(value)
            except json.JSONDecodeError:
                logger.warning("Architecture validation failed: invalid JSON")
                return ArchitectureValidationResult(
                    valid=False,
                    errors=[_issue("INVALID_SCHEMA", "Architecture input is not valid JSON.")],
                )
        if isinstance(value, Architecture):
            architecture = value
            raw_value: Mapping[str, Any] = architecture.model_dump()
        elif isinstance(value, Mapping):
            raw_value = value
            try:
                architecture = Architecture.model_validate(value)
            except ValidationError as exc:
                unsupported = _unsupported_types(value)
                specific_issue = _specific_schema_issue(value)
                issue = (
                    _issue("UNSUPPORTED_SERVICE", f"Service type '{unsupported[0]}' is not supported by SystemArcht.")
                    if unsupported
                    else specific_issue
                    or _issue("INVALID_SCHEMA", f"Architecture does not match the schema: {exc}")
                )
                message = issue.message
                logger.warning("Architecture validation failed: %s", message)
                return ArchitectureValidationResult(valid=False, errors=[issue])
        else:
            return ArchitectureValidationResult(
                valid=False,
                errors=[_issue("INVALID_SCHEMA", "Architecture input must be a JSON object.")],
            )

        logger.info("Validating architecture with %d services and %d connections", len(architecture.services), len(architecture.connections))
        errors = _validate_services(architecture)
        errors.extend(_validate_connections(architecture))
        result = ArchitectureValidationResult(valid=not errors, errors=errors)
        logger.info("Architecture validation %s with %d errors", "succeeded" if result.valid else "failed", len(errors))
        return result


architecture_validator = ArchitectureValidator()


def validate_architecture(value: Architecture | Mapping[str, Any] | str) -> ArchitectureValidationResult:
    return architecture_validator.validate(value)
