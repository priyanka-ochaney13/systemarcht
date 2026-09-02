"""CloudFront routes"""
from fastapi import APIRouter, HTTPException
from app.models.cloudfront import CloudFrontRequest, CloudFrontResponse
from app.services.cloudfront.calculator import CloudFrontCalculator

router = APIRouter(prefix="/api/cloudfront", tags=["CloudFront"])
calculator = CloudFrontCalculator()


@router.post("/calculate", response_model=CloudFrontResponse)
def calculate_cloudfront_cost(request: CloudFrontRequest):
    """Calculate CloudFront costs"""
    try:
        return calculator.calculate(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.get("/regions")
def get_cloudfront_regions():
    """Get available CloudFront geographic price groups (not AWS regions)"""
    return {"regions": calculator.pricing.get_available_regions()}