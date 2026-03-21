"""Lambda routes"""
from fastapi import APIRouter, HTTPException
from app.models.lambda_function import (
    LambdaRequest,
    LambdaResponse,
    VALID_MEMORY_SIZES,
    VALID_STORAGE_SIZES
)
from app.services.lambda_service.calculator import LambdaCalculator
from app.utils.constants import (
    LAMBDA_FREE_TIER_REQUESTS,
    LAMBDA_FREE_TIER_GB_SECONDS,
    LAMBDA_STORAGE_FREE_MB,
    LAMBDA_LIMITS,
    LAMBDA_ARCHITECTURES
)

router = APIRouter(prefix="/api/lambda", tags=["Lambda"])
calculator = LambdaCalculator()


@router.post("/calculate", response_model=LambdaResponse)
def calculate_lambda_cost(request: LambdaRequest):
    """Calculate AWS Lambda costs"""
    try:
        return calculator.calculate(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.get("/regions")
def get_lambda_regions():
    """Get available regions for Lambda"""
    return {"regions": sorted(calculator.pricing.get_available_regions())}


@router.get("/memory-options")
def get_memory_options():
    """Get valid memory configurations"""
    return {
        "memory_sizes_mb": VALID_MEMORY_SIZES,
        "min": min(VALID_MEMORY_SIZES),
        "max": max(VALID_MEMORY_SIZES)
    }


@router.get("/storage-options")
def get_storage_options():
    """Get valid ephemeral storage configurations"""
    return {
        "storage_sizes_mb": VALID_STORAGE_SIZES,
        "min": min(VALID_STORAGE_SIZES),
        "max": max(VALID_STORAGE_SIZES),
        "free_mb": LAMBDA_STORAGE_FREE_MB
    }


@router.get("/pricing-info")
def get_pricing_info():
    """Get Lambda pricing information"""
    return {
        "free_tier": {
            "requests_per_month": LAMBDA_FREE_TIER_REQUESTS,
            "gb_seconds_per_month": LAMBDA_FREE_TIER_GB_SECONDS,
            "note": "Free tier is shared across all Lambda functions in your account"
        },
        "architectures": LAMBDA_ARCHITECTURES,
        "limits": LAMBDA_LIMITS
    }