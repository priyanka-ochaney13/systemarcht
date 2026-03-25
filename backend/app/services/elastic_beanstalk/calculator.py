"""Elastic Beanstalk calculator"""
from typing import List
from app.core.base_calculator import BaseCalculator
from app.services.elastic_beanstalk.pricing import ElasticBeanstalkPricing
from app.models.elastic_beanstalk import (
    ElasticBeanstalkRequest,
    ElasticBeanstalkCostBreakdown,
    ElasticBeanstalkResponse,
    ElasticBeanstalkUsageDetails,
    ElasticBeanstalkEC2Usage,
    ElasticBeanstalkALBUsage,
    ElasticBeanstalkStorageUsage,
    ElasticBeanstalkMonitoringUsage,
    ElasticBeanstalkDataTransferUsage,
    ElasticBeanstalkAutoScalingUsage,
)


class ElasticBeanstalkCalculator(BaseCalculator):
    """Elastic Beanstalk cost calculator"""
    
    def __init__(self):
        super().__init__("elastic_beanstalk")
        self.pricing = ElasticBeanstalkPricing()
    
    def calculate(self, request: ElasticBeanstalkRequest) -> ElasticBeanstalkResponse:
        """Main calculation method"""
        
        # Extract parameters
        region = request.region
        environment_type = request.environment_type
        instance_type = request.instance_type
        instance_count = request.instance_count
        enable_load_balancer = request.enable_load_balancer
        cross_zone_enabled = request.cross_zone_enabled
        enable_auto_scaling = request.enable_auto_scaling
        min_instances = request.min_instances
        max_instances = request.max_instances
        storage_gb = request.storage_gb
        volume_type = request.volume_type
        enable_enhanced_monitoring = request.enable_enhanced_monitoring
        data_transfer_gb = request.data_transfer_gb
        include_free_tier = request.include_free_tier
        
        # Validate environment type constraints
        if environment_type == "single":
            instance_count = 1
            enable_load_balancer = False
        
        # Check free tier eligibility
        free_tier_eligible = self.pricing.check_free_tier_eligibility(
            instance_type,
            instance_count,
            enable_auto_scaling,
            enable_load_balancer
        )
        
        free_tier_applied = include_free_tier and free_tier_eligible
        
        # ===== Calculate EC2 Costs =====
        ec2_cost, total_instance_hours, billable_instance_hours = self.pricing.calculate_ec2_cost(
            region,
            instance_type,
            instance_count,
            include_free_tier=free_tier_applied
        )
        
        hourly_rate = self.pricing.get_hourly_rate(region, instance_type)
        
        ec2_usage = ElasticBeanstalkEC2Usage(
            instance_type=instance_type,
            instance_count=instance_count,
            hourly_rate_per_instance=hourly_rate,
            total_monthly_hours=total_instance_hours,
            billable_instance_hours=billable_instance_hours,
            rate_per_hour=hourly_rate
        )
        
        # ===== Calculate ALB Costs =====
        alb_cost = 0.0
        lcu_cost = 0.0
        cross_zone_cost = 0.0
        
        alb_usage = ElasticBeanstalkALBUsage(enabled=enable_load_balancer)
        
        if enable_load_balancer:
            # Estimate LCU based on instance count (rough estimate: 2 LCU per 2-3 instances)
            estimated_lcu = max(2.0, instance_count / 2)
            
            monthly_hours = 730
            alb_cost = self.pricing.rates["alb_hourly"] * monthly_hours
            lcu_cost = estimated_lcu * self.pricing.rates["alb_lcu_hourly"] * monthly_hours
            
            if cross_zone_enabled:
                cross_zone_cost = self.pricing.rates["cross_zone_hourly"] * monthly_hours
            
            total_alb_cost = alb_cost + lcu_cost + cross_zone_cost
            
            alb_usage = ElasticBeanstalkALBUsage(
                enabled=True,
                hourly_rate=self.pricing.rates["alb_hourly"],
                estimated_lcu=estimated_lcu,
                lcu_hourly_rate=self.pricing.rates["alb_lcu_hourly"],
                cross_zone_enabled=cross_zone_enabled,
                cross_zone_hourly_rate=self.pricing.rates["cross_zone_hourly"]
            )
        else:
            total_alb_cost = 0.0
        
        # ===== Calculate Storage Costs =====
        storage_cost, billable_storage = self.pricing.calculate_storage_cost(
            storage_gb,
            volume_type,
            include_free_tier=free_tier_applied
        )
        
        storage_rate = self.pricing.ebs_storage_pricing.get(volume_type, 0.10)
        storage_usage = ElasticBeanstalkStorageUsage(
            volume_type=volume_type,
            storage_gb=storage_gb,
            rate_per_gb_month=storage_rate,
            billable_storage_gb=billable_storage
        )
        
        # ===== Calculate Monitoring Costs =====
        monitoring_cost = self.pricing.calculate_monitoring_cost(
            enable_enhanced_monitoring,
            instance_count
        )
        
        monitoring_usage = None
        if enable_enhanced_monitoring:
            monitoring_usage = ElasticBeanstalkMonitoringUsage(
                enhanced_monitoring_enabled=True,
                instance_count=instance_count,
                rate_per_instance_month=self.pricing.rates["enhanced_monitoring"]
            )
        
        # ===== Calculate Data Transfer Costs =====
        transfer_cost, billable_transfer = self.pricing.calculate_data_transfer_cost(
            data_transfer_gb
        )
        
        transfer_usage = ElasticBeanstalkDataTransferUsage(
            data_transfer_gb=data_transfer_gb,
            free_tier_gb=1,
            billable_data_transfer_gb=billable_transfer,
            rate_per_gb=self.pricing.rates["data_transfer"]
        )
        
        # ===== Calculate Auto-Scaling Costs =====
        auto_scaling_cost = self.pricing.calculate_auto_scaling_cost(enable_auto_scaling)
        
        auto_scaling_usage = None
        if enable_auto_scaling:
            auto_scaling_usage = ElasticBeanstalkAutoScalingUsage(
                enabled=True,
                num_policies=1,
                rate_per_policy_month=self.pricing.rates["auto_scaling_policy"]
            )
        
        # ===== Calculate Free Tier Savings =====
        free_tier_savings = 0.0
        if free_tier_applied:
            # Savings come from EC2 hours reduction
            free_tier_monthly_hours = self.pricing.free_tier.get("monthly_hours", 950)
            free_tier_ec2_rate = hourly_rate * free_tier_monthly_hours
            
            free_tier_savings = free_tier_ec2_rate
        
        # ===== Build Cost Breakdown =====
        breakdown = ElasticBeanstalkCostBreakdown(
            total_cost=round(ec2_cost + total_alb_cost + storage_cost + 
                           monitoring_cost + transfer_cost + auto_scaling_cost, 2),
            ec2_instances_cost=round(ec2_cost, 2),
            load_balancer_cost=round(total_alb_cost, 2),
            ebs_storage_cost=round(storage_cost, 2),
            enhanced_monitoring_cost=round(monitoring_cost, 2),
            data_transfer_cost=round(transfer_cost, 2),
            auto_scaling_cost=round(auto_scaling_cost, 2)
        )
        
        # ===== Build Usage Details =====
        usage = ElasticBeanstalkUsageDetails(
            ec2=ec2_usage,
            alb=alb_usage if enable_load_balancer else None,
            storage=storage_usage,
            monitoring=monitoring_usage,
            data_transfer=transfer_usage,
            auto_scaling=auto_scaling_usage
        )
        
        # ===== Build Configuration Summary =====
        configuration = {
            "region": region,
            "environment_type": environment_type,
            "instance_type": instance_type,
            "instance_count": instance_count,
            "hourly_rate_per_instance": hourly_rate,
            "alb_enabled": enable_load_balancer,
            "auto_scaling_enabled": enable_auto_scaling,
            "enhanced_monitoring_enabled": enable_enhanced_monitoring,
            "storage_gb": storage_gb,
            "volume_type": volume_type,
            "data_transfer_gb": data_transfer_gb,
        }
        
        # ===== Build Notes/Warnings =====
        notes: List[str] = []
        
        if environment_type == "single":
            notes.append("⚠️ Single instance is not recommended for production. Use load-balanced for high availability.")
        
        if instance_count > 1 and not enable_load_balancer:
            notes.append("⚠️ Load balancer recommended when running 2+ instances for traffic distribution.")
        
        if enable_auto_scaling and not enable_load_balancer:
            notes.append("⚠️ Auto-scaling works best with a load balancer.")
        
        if storage_gb > 500:
            notes.append("💡 Consider EBS-optimized instances for better performance with large volumes.")
        
        if free_tier_applied:
            notes.append(f"✓ Free tier active (12 months only) - Saves ${free_tier_savings:.2f}/month")
        
        # ===== Build Response =====
        response = ElasticBeanstalkResponse(
            service="elastic_beanstalk",
            region=region,
            region_display_name=self.pricing.get_region_name(region),
            environment_type=environment_type,
            breakdown=breakdown,
            usage=usage,
            configuration=configuration,
            free_tier_eligible=free_tier_eligible,
            free_tier_applied=free_tier_applied,
            free_tier_savings=round(free_tier_savings, 2),
            notes=notes
        )
        
        return response
