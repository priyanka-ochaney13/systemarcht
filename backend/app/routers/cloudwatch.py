"""CloudWatch routes"""
from fastapi import APIRouter, HTTPException
from app.models.cloudwatch import CloudWatchRequest, CloudWatchResponse
from app.services.cloudwatch.calculator import CloudWatchCalculator

router = APIRouter(prefix="/api/cloudwatch", tags=["CloudWatch"])
calculator = CloudWatchCalculator()


@router.post("/calculate", response_model=CloudWatchResponse)
def calculate_cloudwatch_cost(request: CloudWatchRequest):
    """Calculate CloudWatch costs"""
    try:
        return calculator.calculate(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.get("/regions")
def get_cloudwatch_regions():
    """Get available regions for CloudWatch"""
    return {"regions": sorted(calculator.pricing.get_available_regions())}