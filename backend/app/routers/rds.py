"""RDS routes"""
from fastapi import APIRouter, HTTPException
from app.models.rds import RDSRequest, RDSResponse
from app.services.rds.calculator import RDSCalculator

router = APIRouter(prefix="/api/rds", tags=["RDS"])
calculator = RDSCalculator()


@router.post("/calculate", response_model=RDSResponse)
def calculate_rds_cost(request: RDSRequest):
    """Calculate RDS costs"""
    try:
        return calculator.calculate(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.get("/regions")
def get_rds_regions():
    """Get available regions for RDS"""
    return {"regions": sorted(calculator.pricing.get_available_regions())}


@router.get("/instance-types")
def get_rds_instance_types(region: str, engine: str = "MySQL", deployment: str = "Single-AZ"):
    """Get available instance classes for an engine and deployment in a region"""
    return {
        "region": region,
        "instance_types": calculator.pricing.get_instance_types(region, engine, deployment),
    }