"""DynamoDB API router"""
from fastapi import APIRouter, HTTPException
import logging

from app.models.dynamodb import DynamoDBRequest, DynamoDBResponse
from app.services.dynamodb.calculator import DynamoDBCalculator

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/dynamodb",
    tags=["dynamodb"],
    responses={404: {"description": "Not found"}},
)

calculator = DynamoDBCalculator()


@router.post("/calculate", response_model=DynamoDBResponse)
async def calculate_dynamodb_cost(request: DynamoDBRequest):
    """Calculate DynamoDB costs"""
    try:
        return calculator.calculate(request)
    except ValueError as e:
        logger.warning(f"Invalid request: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error calculating DynamoDB costs: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/regions")
async def get_dynamodb_regions():
    """Get available DynamoDB regions"""
    return sorted(calculator.pricing.get_available_regions())