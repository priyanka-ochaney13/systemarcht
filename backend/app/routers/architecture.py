"""Architecture routes"""
from fastapi import APIRouter, HTTPException
from app.models.architecture import (
    ArchitectureRequest,
    ArchitectureCostResponse
)
from app.services.architecture.calculator import ArchitectureCalculator

router = APIRouter(prefix="/api/architecture", tags=["Architecture"])
calculator = ArchitectureCalculator()


@router.post("/calculate", response_model=ArchitectureCostResponse)
def calculate_architecture_cost(request: ArchitectureRequest):
    """Calculate total cost for a multi-service architecture
    
    Accepts a list of service nodes and their connections,
    returns total cost including data transfer between services.
    """
    try:
        return calculator.calculate(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.get("/supported-services")
def get_supported_services():
    """Get list of supported service types"""
    return {
        "services": calculator.supported_services,
        "description": "Service types that can be included in architecture calculations"
    }


@router.get("/transfer-regions")
def get_transfer_regions():
    """Get available regions for data transfer pricing"""
    from app.services.architecture.data_transfer_pricing import DataTransferPricing
    pricing = DataTransferPricing()
    return {"regions": pricing.get_available_regions()}
