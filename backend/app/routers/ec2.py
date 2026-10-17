"""EC2 routes"""
from fastapi import APIRouter, HTTPException
from app.models.ec2 import EC2Request, EC2Response
from app.services.ec2.calculator import EC2Calculator

router = APIRouter(prefix="/api/ec2", tags=["EC2"])
calculator = EC2Calculator()


@router.post("/calculate", response_model=EC2Response)
def calculate_ec2_cost(request: EC2Request):
    """Calculate EC2 costs"""
    try:
        return calculator.calculate(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.get("/regions")
def get_ec2_regions():
    """Get available regions for EC2"""
    return {"regions": sorted(calculator.pricing.get_available_regions())}


@router.get("/instance-types")
def get_ec2_instance_types(region: str):
    """Get available instance types in a region"""
    return {"region": region, "instance_types": calculator.pricing.get_instance_types(region)}