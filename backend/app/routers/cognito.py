"""Cognito routes"""
from fastapi import APIRouter, HTTPException
from app.models.cognito import CognitoRequest, CognitoResponse
from app.services.cognito_service.calculator import CognitoCalculator

router = APIRouter(prefix="/api/cognito", tags=["Cognito"])
calculator = CognitoCalculator()


@router.post("/calculate", response_model=CognitoResponse)
def calculate_cognito_cost(request: CognitoRequest):
    """Calculate AWS Cognito costs"""
    try:
        return calculator.calculate(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.get("/regions")
def get_cognito_regions():
    """Get available regions for Cognito"""
    regions = calculator.pricing.get_available_regions()
    region_mapping = {
        code: calculator.pricing.get_region_name(code) 
        for code in regions
    }
    return {
        "regions": sorted(regions),
        "region_mapping": region_mapping
    }


@router.get("/pricing")
def get_cognito_pricing():
    """Get Cognito pricing information"""
    return {
        "rates": calculator.pricing.rates,
        "free_tier": calculator.pricing.free_tier,
        "regions": calculator.pricing.get_available_regions(),
    }
