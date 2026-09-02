"""SQS routes"""
from fastapi import APIRouter, HTTPException
from app.models.sqs import SQSRequest, SQSResponse
from app.services.sqs.calculator import SQSCalculator

router = APIRouter(prefix="/api/sqs", tags=["SQS"])
calculator = SQSCalculator()


@router.post("/calculate", response_model=SQSResponse)
def calculate_sqs_cost(request: SQSRequest):
    """Calculate SQS costs"""
    try:
        return calculator.calculate(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.get("/regions")
def get_sqs_regions():
    """Get available regions for SQS"""
    return {"regions": sorted(calculator.pricing.get_available_regions())}