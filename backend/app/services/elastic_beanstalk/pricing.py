"""Elastic Beanstalk pricing module - loads from pricing_data/elastic_beanstalk.json"""
from app.services.pricing_loader import PricingLoader
from app.core.base_calculator import PricingTier
from typing import Dict, Optional, List, Tuple
import logging

logger = logging.getLogger(__name__)


class ElasticBeanstalkPricing(PricingLoader):
    """Elastic Beanstalk pricing loader - extends PricingLoader for AWS catalog format parsing"""
    
    def __new__(cls):
        """Use singleton pattern from PricingLoader"""
        return super().__new__(cls, "elastic_beanstalk")
    
    def __init__(self):
        """Initialize Elastic Beanstalk pricing from AWS catalog JSON"""
        # Initialize attributes BEFORE calling super().__init__() because super().__init__() calls _build_index()
        # Extract pricing rates dict for backward compatibility
        self.rates = {
            "alb_hourly": 0.0225,  # Will be updated from JSON
            "alb_lcu_hourly": 0.008,  # Will be updated from JSON
            "cross_zone_hourly": 0.006,
            "enhanced_monitoring": 0.50,
            "auto_scaling_policy": 0.0,
            "data_transfer": 0.09,
        }
        
        # EBS storage pricing per GB/month
        self.ebs_storage_pricing = {
            "gp3": 0.10,
            "io2": 0.125,
            "standard": 0.05,
        }
        
        # Free tier configuration
        self.free_tier = {
            "eligible_instance_type": "t2.micro",
            "monthly_hours": 950,
            "free_storage_gb": 30,
            "free_data_transfer_gb": 1,
        }
        
        # Instance types will be populated during index building
        self.instance_types = {}
        
        # Call parent __init__ which will call _build_index()
        super().__init__("elastic_beanstalk")
    
    def _build_index(self):
        """Build Elastic Beanstalk pricing index from AWS catalog
        
        Index structure:
        {
            "region_code": {
                "instances": {
                    "instance_type": {
                        "vcpu": int,
                        "memory_gb": float,
                        "family": str,
                        "price": float
                    }
                },
                "alb_hourly": float,
                "alb_lcu": float,
                "storage": {
                    "gp3": float,
                    "io2": float,
                    ...
                },
                "data_transfer_out": float,
            }
        }
        """
        products = self.pricing_data.get("products", {})
        terms = self.pricing_data.get("terms", {}).get("OnDemand", {})
        
        region_map = {}
        instance_types_global = {}  # Track all instance types globally
        
        for sku, product in products.items():
            attrs = product.get("attributes", {})
            region = attrs.get("regionCode")
            product_family = product.get("productFamily", "")
            
            if not region:
                continue
            
            # Initialize region dict if needed
            if region not in region_map:
                region_map[region] = {
                    "instances": {},
                    "alb_hourly": 0.0,
                    "alb_lcu": 0.0,
                    "storage": {},
                    "data_transfer_out": 0.0,
                }
            
            # Extract price from terms - custom extraction for our JSON format
            price = self._extract_price(sku, terms)
            
            # Parse by product family
            if product_family == "Compute":
                # EC2 instances
                instance_type = attrs.get("instanceType")
                if instance_type:
                    vcpu = int(attrs.get("vcpu", "0"))
                    memory = attrs.get("memory", "0GB")
                    memory_gb = float(memory.replace("GB", "")) if "GB" in memory else 0.0
                    family = instance_type.split(".")[0]  # e.g., "t2" from "t2.micro"
                    
                    region_map[region]["instances"][instance_type] = {
                        "vcpu": vcpu,
                        "memory_gb": memory_gb,
                        "family": family,
                        "price": price,
                    }
                    
                    # Track globally for instance type info
                    if instance_type not in instance_types_global:
                        instance_types_global[instance_type] = {
                            "vcpu": vcpu,
                            "memory_gb": memory_gb,
                            "family": family,
                        }
            
            elif product_family == "Load Balancing":
                # ALB pricing
                usagetype = attrs.get("usagetype", "")
                if "Load-Balancer-Hours" in usagetype:
                    region_map[region]["alb_hourly"] = price
                elif "LCU" in usagetype:
                    region_map[region]["alb_lcu"] = price
            
            elif product_family == "Storage":
                # EBS storage pricing
                storage_type = attrs.get("storageType", "gp3")
                region_map[region]["storage"][storage_type] = price
            
            elif product_family == "Data Transfer":
                # Data transfer out pricing
                if "out" in attrs.get("usagetype", "").lower():
                    region_map[region]["data_transfer_out"] = price
        
        self.index = region_map
        self.instance_types = instance_types_global
        
        # Update rates from first US region found
        if "us-east-1" in region_map:
            self.rates["alb_hourly"] = region_map["us-east-1"]["alb_hourly"]
            self.rates["alb_lcu_hourly"] = region_map["us-east-1"]["alb_lcu"]
            self.rates["data_transfer"] = region_map["us-east-1"]["data_transfer_out"]
        
        # Update storage pricing from first region
        if region_map:
            first_region = list(region_map.values())[0]
            if first_region["storage"]:
                self.ebs_storage_pricing.update(first_region["storage"])
    
    def _extract_price(self, sku: str, terms: dict) -> float:
        """Extract price from terms - handles our JSON format"""
        if sku not in terms:
            return 0.0
        
        sku_terms = terms[sku]
        for term_data in sku_terms.values():
            price_dimensions = term_data.get("priceDimensions", {})
            for dimension in price_dimensions.values():
                # Try our custom format first ("price" key)
                if "price" in dimension:
                    return float(dimension.get("price", 0))
                # Fall back to AWS standard format
                price_per_unit = dimension.get("pricePerUnit", {}).get("USD", "0")
                return float(price_per_unit)
        
        return 0.0
    
    def get_available_regions(self) -> List[str]:
        """Get list of available regions"""
        return list(self.index.keys()) if self.index else []
    
    def get_region_name(self, region_code: str) -> str:
        """Get display name for region"""
        region_names = {
            "us-east-1": "US East (N. Virginia)",
            "us-east-2": "US East (Ohio)",
            "us-west-1": "US West (N. California)",
            "us-west-2": "US West (Oregon)",
            "ap-south-1": "Asia Pacific (Mumbai)",
            "ap-southeast-1": "Asia Pacific (Singapore)",
            "ap-southeast-2": "Asia Pacific (Sydney)",
            "eu-west-1": "EU (Ireland)",
            "eu-central-1": "EU (Frankfurt)",
            "ca-central-1": "Canada (Central)",
            "ap-northeast-1": "Asia Pacific (Tokyo)",
        }
        return region_names.get(region_code, region_code)
    
    def get_available_instance_types(self) -> Dict[str, dict]:
        """Get all available instance types with specs"""
        return self.instance_types.copy()
    
    def get_instance_type_specs(self, instance_type: str) -> Optional[dict]:
        """Get specs for specific instance type"""
        return self.instance_types.get(instance_type)
    
    def get_hourly_rate(self, region: str, instance_type: str) -> float:
        """Get hourly rate for instance type in region"""
        region_data = self.index.get(region, {})
        instance_data = region_data.get("instances", {}).get(instance_type)
        
        if instance_data:
            return instance_data.get("price", 0.0)
        
        return 0.0
    
    def calculate_ec2_cost(
        self,
        region: str,
        instance_type: str,
        instance_count: int,
        include_free_tier: bool = False
    ) -> Tuple[float, int, int]:
        """
        Calculate EC2 instance cost
        
        Returns: (cost, total_hours, billable_hours)
        """
        hourly_rate = self.get_hourly_rate(region, instance_type)
        total_monthly_hours = 730  # Average hours per month
        
        # Calculate instance-hours
        total_instance_hours = instance_count * total_monthly_hours
        
        # Apply free tier if eligible
        billable_hours = total_instance_hours
        if include_free_tier and instance_type == self.free_tier.get("eligible_instance_type", "t2.micro") and instance_count == 1:
            # Free tier provides 950 hours/month on t2.micro
            free_hours = self.free_tier.get("monthly_hours", 950)
            billable_hours = max(0, total_instance_hours - free_hours)
        
        cost = billable_hours * hourly_rate
        return cost, total_instance_hours, billable_hours
    
    def calculate_alb_cost(
        self,
        enabled: bool,
        cross_zone_enabled: bool = False,
        estimated_lcu: float = 2.0
    ) -> float:
        """Calculate Application Load Balancer cost"""
        if not enabled:
            return 0.0
        
        monthly_hours = 730
        
        # ALB hourly charge
        alb_cost = self.rates["alb_hourly"] * monthly_hours
        
        # LCU charges (default: 2 LCU)
        lcu_cost = estimated_lcu * self.rates["alb_lcu_hourly"] * monthly_hours
        
        # Cross-zone charge if enabled
        cross_zone_cost = 0.0
        if cross_zone_enabled:
            cross_zone_cost = self.rates["cross_zone_hourly"] * monthly_hours
        
        return alb_cost + lcu_cost + cross_zone_cost
    
    def calculate_storage_cost(
        self,
        storage_gb: int,
        volume_type: str = "gp3",
        include_free_tier: bool = False
    ) -> Tuple[float, int]:
        """
        Calculate EBS storage cost
        
        Returns: (cost, billable_storage_gb)
        """
        rate_per_gb = self.ebs_storage_pricing.get(volume_type, 0.10)
        
        # Apply free tier if eligible
        billable_storage = storage_gb
        if include_free_tier:
            free_storage = self.free_tier.get("free_storage_gb", 30)
            billable_storage = max(0, storage_gb - free_storage)
        
        cost = billable_storage * rate_per_gb
        return cost, billable_storage
    
    def calculate_monitoring_cost(
        self,
        enable_enhanced_monitoring: bool,
        instance_count: int
    ) -> float:
        """Calculate enhanced monitoring cost"""
        if not enable_enhanced_monitoring:
            return 0.0
        return instance_count * self.rates["enhanced_monitoring"]
    
    def calculate_auto_scaling_cost(self, enable_auto_scaling: bool) -> float:
        """Calculate auto-scaling policy cost (typically 1 policy)"""
        if not enable_auto_scaling:
            return 0.0
        # Assume 1 scaling policy per deployment
        return self.rates["auto_scaling_policy"]
    
    def calculate_data_transfer_cost(self, data_transfer_gb: int) -> Tuple[float, int]:
        """
        Calculate data transfer cost
        
        Returns: (cost, billable_gb)
        """
        # First 1 GB is free
        billable_gb = max(0, data_transfer_gb - 1)
        cost = billable_gb * self.rates["data_transfer"]
        return cost, billable_gb
    
    def check_free_tier_eligibility(
        self,
        instance_type: str,
        instance_count: int,
        enable_auto_scaling: bool,
        enable_load_balancer: bool
    ) -> bool:
        """Check if deployment qualifies for free tier"""
        eligible_type = self.free_tier.get("eligible_instance_type", "t2.micro")
        return (
            instance_type == eligible_type
            and instance_count == 1
            and not enable_auto_scaling
            and not enable_load_balancer
        )
