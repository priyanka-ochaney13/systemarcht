"""Elastic Beanstalk routes"""
from fastapi import APIRouter, HTTPException, Query
from app.models.elastic_beanstalk import ElasticBeanstalkRequest, ElasticBeanstalkResponse
from app.services.elastic_beanstalk.calculator import ElasticBeanstalkCalculator

router = APIRouter(prefix="/api/elastic-beanstalk", tags=["Elastic Beanstalk"])
calculator = ElasticBeanstalkCalculator()


@router.post("/calculate", response_model=ElasticBeanstalkResponse)
def calculate_elastic_beanstalk_cost(request: ElasticBeanstalkRequest):
    """Calculate AWS Elastic Beanstalk deployment costs"""
    try:
        return calculator.calculate(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.get("/regions")
def get_elastic_beanstalk_regions():
    """Get available regions for Elastic Beanstalk"""
    regions = calculator.pricing.get_available_regions()
    region_mapping = {
        code: calculator.pricing.get_region_name(code) 
        for code in regions
    }
    return {
        "regions": sorted(regions),
        "region_mapping": region_mapping
    }


@router.get("/instance-types")
def get_instance_types(region: str = Query("us-east-1")):
    """Get available EC2 instance types with pricing for specified region"""
    instance_types = calculator.pricing.get_available_instance_types()
    
    # Add pricing for specified region
    result = []
    for inst_type, specs in instance_types.items():
        specs_copy = specs.copy()
        specs_copy["type"] = inst_type
        specs_copy["hourly_rate"] = calculator.pricing.get_hourly_rate(region, inst_type)
        specs_copy["region"] = region
        result.append(specs_copy)
    
    # Group by family
    by_family = {}
    for inst in result:
        family = inst.get("family", "Other")
        if family not in by_family:
            by_family[family] = []
        by_family[family].append(inst)
    
    return {
        "region": region,
        "instance_types": result,
        "by_family": by_family
    }


@router.get("/pricing-info")
def get_elastic_beanstalk_pricing():
    """Get Elastic Beanstalk pricing information"""
    return {
        "alb_hourly_rate": calculator.pricing.rates["alb_hourly"],
        "alb_lcu_hourly_rate": calculator.pricing.rates["alb_lcu_hourly"],
        "cross_zone_hourly_rate": calculator.pricing.rates["cross_zone_hourly"],
        "enhanced_monitoring_rate": calculator.pricing.rates["enhanced_monitoring"],
        "auto_scaling_policy_rate": calculator.pricing.rates["auto_scaling_policy"],
        "data_transfer_rate": calculator.pricing.rates["data_transfer"],
        "ebs_storage_pricing": calculator.pricing.EBS_STORAGE_PRICING,
        "free_tier": {
            "monthly_hours": calculator.pricing.FREE_TIER["monthly_hours"],
            "free_storage_gb": calculator.pricing.FREE_TIER["free_storage_gb"],
            "eligible_instance_type": calculator.pricing.FREE_TIER["eligible_instance_type"],
            "duration_months": calculator.pricing.FREE_TIER["duration_months"]
        },
        "regions": calculator.pricing.get_available_regions(),
    }
