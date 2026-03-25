"""AWS Elastic Beanstalk specific models"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal, List
from app.models.base import BaseCalculateRequest, BaseCostBreakdown, BaseCalculateResponse


class ElasticBeanstalkRequest(BaseCalculateRequest):
    """Elastic Beanstalk deployment calculation request"""
    
    # Environment configuration
    environment_type: Literal["single", "load_balanced"] = Field(
        default="single",
        description="Environment type: single instance or load balanced"
    )
    
    instance_type: str = Field(
        default="t3.small",
        description="EC2 instance type (e.g., t3.small, m5.large, c5.large)"
    )
    
    instance_count: int = Field(
        default=1,
        ge=1,
        le=100,
        description="Number of EC2 instances (1-100)"
    )
    
    # Load Balancer configuration
    enable_load_balancer: bool = Field(
        default=False,
        description="Enable Application Load Balancer"
    )
    
    cross_zone_enabled: bool = Field(
        default=False,
        description="Enable cross-zone load balancing (requires ALB)"
    )
    
    # Auto-scaling configuration
    enable_auto_scaling: bool = Field(
        default=False,
        description="Enable auto-scaling based on CPU utilization"
    )
    
    min_instances: int = Field(
        default=1,
        ge=1,
        le=100,
        description="Minimum instances for auto-scaling"
    )
    
    max_instances: int = Field(
        default=10,
        ge=1,
        le=100,
        description="Maximum instances for auto-scaling"
    )
    
    target_cpu_utilization: int = Field(
        default=70,
        ge=10,
        le=100,
        description="Target CPU utilization percentage for scaling (10-100)"
    )
    
    # Storage configuration
    storage_gb: int = Field(
        default=30,
        ge=1,
        le=16000,
        description="Root volume size in GB (1-16000)"
    )
    
    volume_type: Literal["gp3", "io2", "standard"] = Field(
        default="gp3",
        description="EBS volume type: gp3 (general purpose), io2 (provisioned IOPS), standard (magnetic)"
    )
    
    # Monitoring configuration
    enable_enhanced_monitoring: bool = Field(
        default=False,
        description="Enable enhanced CloudWatch monitoring"
    )
    
    # Data transfer
    data_transfer_gb: int = Field(
        default=10,
        ge=0,
        le=1000000,
        description="Monthly outbound data transfer in GB"
    )
    
    # Free tier
    include_free_tier: bool = Field(
        default=False,
        description="Apply 12-month AWS free tier discounts"
    )
    
    @field_validator('instance_count')
    @classmethod
    def validate_instance_count(cls, v: int, info) -> int:
        # If single instance, force to 1
        if hasattr(info, 'data'):
            env_type = info.data.get('environment_type', 'single')
            if env_type == 'single' and v != 1:
                raise ValueError("Single instance environment must have exactly 1 instance")
            if env_type == 'load_balanced' and v < 2:
                raise ValueError("Load balanced environment requires at least 2 instances")
        return v
    
    @field_validator('max_instances')
    @classmethod
    def validate_max_instances(cls, v: int, info) -> int:
        if hasattr(info, 'data'):
            min_inst = info.data.get('min_instances', 1)
            if v < min_inst:
                raise ValueError(f"Max instances ({v}) must be >= min instances ({min_inst})")
        return v
    
    @field_validator('cross_zone_enabled')
    @classmethod
    def validate_cross_zone(cls, v: bool, info) -> bool:
        if v and hasattr(info, 'data'):
            if not info.data.get('enable_load_balancer', False):
                raise ValueError("Cross-zone load balancing requires load balancer to be enabled")
        return v


class ElasticBeanstalkEC2Usage(BaseModel):
    """EC2 instance usage breakdown"""
    instance_type: str = Field(..., description="Instance type")
    instance_count: int = Field(..., description="Number of instances")
    hourly_rate_per_instance: float = Field(..., description="Hourly rate per instance")
    total_monthly_hours: int = Field(..., description="Total hours in month (730)")
    billable_instance_hours: int = Field(..., description="Hours after free tier")
    rate_per_hour: float = Field(..., description="Price per instance-hour")


class ElasticBeanstalkALBUsage(BaseModel):
    """Application Load Balancer usage breakdown"""
    enabled: bool = Field(..., description="ALB is enabled")
    hourly_rate: float = Field(default=0.0, description="Hourly ALB charge")
    estimated_lcu: float = Field(default=0.0, description="Estimated LCU usage")
    lcu_hourly_rate: float = Field(default=0.0, description="LCU hourly rate")
    cross_zone_enabled: bool = Field(default=False, description="Cross-zone load balancing")
    cross_zone_hourly_rate: float = Field(default=0.0, description="Cross-zone hourly rate")


class ElasticBeanstalkStorageUsage(BaseModel):
    """EBS storage usage breakdown"""
    volume_type: str = Field(..., description="Volume type (gp3, io2, standard)")
    storage_gb: int = Field(..., description="Storage size in GB")
    rate_per_gb_month: float = Field(..., description="Price per GB per month")
    billable_storage_gb: int = Field(..., description="Billable storage after free tier")


class ElasticBeanstalkMonitoringUsage(BaseModel):
    """Monitoring usage breakdown"""
    enhanced_monitoring_enabled: bool = Field(..., description="Enhanced monitoring enabled")
    instance_count: int = Field(..., description="Number of monitored instances")
    rate_per_instance_month: float = Field(..., description="Price per instance per month")


class ElasticBeanstalkDataTransferUsage(BaseModel):
    """Data transfer usage breakdown"""
    data_transfer_gb: int = Field(..., description="Outbound data transfer in GB")
    free_tier_gb: int = Field(default=1, description="Free tier allowance in GB")
    billable_data_transfer_gb: int = Field(..., description="Billable data transfer after free tier")
    rate_per_gb: float = Field(..., description="Price per GB")


class ElasticBeanstalkAutoScalingUsage(BaseModel):
    """Auto-scaling usage breakdown"""
    enabled: bool = Field(..., description="Auto-scaling is enabled")
    num_policies: int = Field(default=0, description="Number of scaling policies")
    rate_per_policy_month: float = Field(default=0.0, description="Price per policy per month")


class ElasticBeanstalkUsageDetails(BaseModel):
    """Complete usage details"""
    ec2: ElasticBeanstalkEC2Usage
    alb: Optional[ElasticBeanstalkALBUsage] = None
    storage: ElasticBeanstalkStorageUsage
    monitoring: Optional[ElasticBeanstalkMonitoringUsage] = None
    data_transfer: ElasticBeanstalkDataTransferUsage
    auto_scaling: Optional[ElasticBeanstalkAutoScalingUsage] = None


class ElasticBeanstalkCostBreakdown(BaseCostBreakdown):
    """Elastic Beanstalk cost breakdown by component"""
    ec2_instances_cost: float = Field(default=0.0, description="Cost for EC2 instances")
    load_balancer_cost: float = Field(default=0.0, description="Cost for load balancer")
    ebs_storage_cost: float = Field(default=0.0, description="Cost for EBS storage")
    enhanced_monitoring_cost: float = Field(default=0.0, description="Cost for enhanced monitoring")
    data_transfer_cost: float = Field(default=0.0, description="Cost for data transfer")
    auto_scaling_cost: float = Field(default=0.0, description="Cost for auto-scaling policies")


class ElasticBeanstalkResponse(BaseCalculateResponse):
    """Elastic Beanstalk calculation response"""
    region: str = Field(..., description="AWS region")
    region_display_name: str = Field(..., description="Display name of region")
    environment_type: str = Field(..., description="Environment type (single/load_balanced)")
    breakdown: ElasticBeanstalkCostBreakdown
    usage: ElasticBeanstalkUsageDetails
    configuration: dict = Field(..., description="Current configuration summary")
    free_tier_eligible: bool = Field(..., description="Whether deployment qualifies for free tier")
    free_tier_applied: bool = Field(..., description="Whether free tier was applied")
    free_tier_savings: float = Field(default=0.0, description="Total savings from free tier")
    notes: List[str] = Field(default_factory=list, description="Additional notes or warnings")
