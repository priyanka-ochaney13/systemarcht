"""AI architecture generation routes."""

from fastapi import APIRouter, HTTPException
from pydantic import ValidationError

from ai.qwen import generate_architecture
from ai.schemas import ArchitectureGenerationRequest, ArchitectureGenerationResponse

router = APIRouter(prefix="/api/ai", tags=["AI Architecture"])


@router.post("/architecture/generate", response_model=ArchitectureGenerationResponse)
def generate_architecture_route(
    request: ArchitectureGenerationRequest,
) -> ArchitectureGenerationResponse:
    try:
        return generate_architecture(request.prompt)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except ValidationError as exc:
        raise HTTPException(status_code=502, detail=f"Model output schema invalid: {exc}") from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
