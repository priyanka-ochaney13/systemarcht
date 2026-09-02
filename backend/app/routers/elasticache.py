"""ElastiCache routes"""
from fastapi import APIRouter, HTTPException
from app.models.elasticache import ElastiCacheRequest, ElastiCacheResponse
from app.services.elasticache.calculator import ElastiCacheCalculator

router = APIRouter(prefix="/api/elasticache", tags=["ElastiCache"])
calculator = ElastiCacheCalculator()


@router.post("/calculate", response_model=ElastiCacheResponse)
def calculate_elasticache_cost(request: ElastiCacheRequest):
    """Calculate ElastiCache costs"""
    try:
        return calculator.calculate(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.get("/regions")
def get_elasticache_regions():
    """Get available regions for ElastiCache"""
    return {"regions": sorted(calculator.pricing.get_available_regions())}