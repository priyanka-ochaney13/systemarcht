"""S3 routes"""
from fastapi import APIRouter, HTTPException
from app.models.s3 import S3Request, S3Response
from app.services.s3.calculator import S3Calculator

router = APIRouter(prefix="/api/s3", tags=["S3"])
calculator = S3Calculator()


@router.post("/calculate", response_model=S3Response)
def calculate_s3_cost(request: S3Request):
    """Calculate AWS S3 costs
    
    Supports:
    - Storage costs (standard, intelligent tiering, glacier, deep archive)
    - Request costs (PUT, GET, DELETE)
    - Data transfer costs (outbound and intra-region)
    """
    try:
        return calculator.calculate(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.get("/regions")
def get_s3_regions():
    """Get available regions for S3"""
    return {"regions": sorted(calculator.pricing.get_available_regions())}


@router.get("/storage-classes")
def get_storage_classes():
    """Get available S3 storage classes"""
    return {
        "storage_classes": [
            "standard",
            "intelligent_tiering",
            "glacier",
            "deep_archive"
        ],
        "descriptions": {
            "standard": "S3 Standard - General purpose storage",
            "intelligent_tiering": "S3 Intelligent-Tiering - Automatic cost optimization",
            "glacier": "S3 Glacier - Archive storage with retrieval fees",
            "deep_archive": "S3 Glacier Deep Archive - Long-term archive storage"
        }
    }


@router.get("/pricing-info")
def get_pricing_info():
    """Get S3 pricing information"""
    return {
        "storage_classes": {
            "standard": "First 50TB/month: $0.023/GB",
            "intelligent_tiering": "Monitored storage: $0.0125/GB",
            "glacier": "Archival storage: $0.004/GB",
            "deep_archive": "Deep archive: $0.00099/GB"
        },
        "requests": {
            "put": "$0.005 per 1,000 requests",
            "get": "$0.0004 per 1,000 requests",
            "delete": "$0.0004 per 1,000 requests"
        },
        "data_transfer": {
            "outbound": "First 1GB/month free, then $0.09/GB",
            "intra_region": "$0.01/GB"
        },
        "note": "Pricing varies by region. These are typical US region prices."
    }
