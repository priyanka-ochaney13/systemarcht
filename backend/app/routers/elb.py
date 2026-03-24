"""ELB routes"""
from fastapi import APIRouter, HTTPException
from app.models.elb import ELBRequest, ELBResponse
from app.services.elb.calculator import ELBCalculator
from app.utils.constants import ELB_FALLBACK_PRICING, ELB_LB_TYPES

router = APIRouter(prefix="/api/elb", tags=["Elastic Load Balancing"])
calculator = ELBCalculator()


@router.post("/calculate", response_model=ELBResponse)
def calculate_elb_cost(request: ELBRequest):
    """Calculate AWS Elastic Load Balancing costs"""
    try:
        return calculator.calculate(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.get("/regions")
def get_elb_regions():
    """Get available regions for ELB"""
    return sorted(calculator.pricing.get_available_regions())


@router.get("/lb-types")
def get_lb_types():
    """Get supported load balancer types and their features"""
    return ELB_LB_TYPES


@router.get("/pricing-info")
def get_pricing_info():
    """Get ELB fallback pricing information (us-east-1 rates)"""
    return {
        "fallback_pricing": ELB_FALLBACK_PRICING,
        "note": "Actual prices vary by region. Use /calculate for region-specific pricing.",
    }