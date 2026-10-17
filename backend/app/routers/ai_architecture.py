"""AI architecture generation routes."""

from fastapi import APIRouter, HTTPException
from pydantic import ValidationError

from ai.architecture_service import ArchitectureGenerationError, generate_architecture
from ai.architecture_validator import ArchitectureValidationResult, validate_architecture
from ai.mermaid_generator import MermaidGenerationError, generate_mermaid
from ai.ollama_service import OllamaError
from ai.schemas import (
    Architecture,
    ArchitectureGenerationRequest,
    ArchitectureDiagramResponse,
    ArchitectureRequest,
    ArchitectureValidationRequest,
)

router = APIRouter(prefix="/api/ai", tags=["AI Architecture"])


@router.post("/architecture/diagram", response_model=ArchitectureDiagramResponse)
def generate_architecture_diagram(
    request: ArchitectureValidationRequest,
) -> ArchitectureDiagramResponse:
    """Generate Mermaid only after the submitted architecture passes validation."""
    validation = validate_architecture(request.architecture)
    if not validation.valid:
        raise HTTPException(status_code=422, detail=validation.model_dump())
    try:
        architecture = Architecture.model_validate(request.architecture)
        return ArchitectureDiagramResponse(mermaid=generate_mermaid(architecture))
    except (ValidationError, MermaidGenerationError) as exc:
        if isinstance(exc, MermaidGenerationError):
            raise HTTPException(status_code=422, detail=exc.result.model_dump()) from exc
        raise HTTPException(status_code=422, detail="Architecture does not match the schema.") from exc


@router.post("/architecture/validate", response_model=ArchitectureValidationResult)
def validate_architecture_endpoint(
    request: ArchitectureValidationRequest,
) -> ArchitectureValidationResult:
    """Validate architecture JSON without invoking the model."""
    return validate_architecture(request.architecture)


@router.post("/architecture", response_model=Architecture)
def generate_architecture_endpoint(request: ArchitectureRequest) -> Architecture:
    """Generate a validated architecture without coupling Module 2 to the UI."""
    try:
        return generate_architecture(request.message)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except ArchitectureGenerationError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except OllamaError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/architecture/generate", response_model=Architecture)
def generate_architecture_route(
    request: ArchitectureGenerationRequest,
) -> Architecture:
    try:
        return generate_architecture(request.prompt)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except ArchitectureGenerationError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except ValidationError as exc:
        raise HTTPException(status_code=502, detail=f"Model output schema invalid: {exc}") from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
