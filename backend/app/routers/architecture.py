"""Architecture routes"""
import json
import os
from typing import List
from fastapi import APIRouter, HTTPException
from app.models.architecture import (
    ArchitectureRequest,
    ArchitectureCostResponse
)
from app.services.architecture.calculator import ArchitectureCalculator

router = APIRouter(prefix="/api/architecture", tags=["Architecture"])
calculator = ArchitectureCalculator()

DATA_FILE = "data/architectures.json"

def _get_architectures():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, "r") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def _save_architecture(architecture: ArchitectureRequest):
    architectures = _get_architectures()
    architecture_dict = architecture.dict()
    updated = False
    for i, a in enumerate(architectures):
        if a.get("name") == architecture.name:
            architectures[i] = architecture_dict
            updated = True
            break
    if not updated:
        architectures.append(architecture_dict)
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, "w") as f:
        json.dump(architectures, f, indent=2)
    return architecture

@router.get("", response_model=List[ArchitectureRequest])
def list_architectures():
    """List saved architectures"""
    return _get_architectures()

@router.post("", response_model=ArchitectureRequest)
def save_architecture(architecture: ArchitectureRequest):
    """Save an architecture"""
    try:
        return _save_architecture(architecture)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
