"""Architecture calculator - orchestrates multi-service cost calculation"""
from typing import Dict, Any, List
from app.models.architecture import (
    ArchitectureRequest,
    ArchitectureCostResponse,
    ArchitectureBreakdown,
    ServiceCostDetail,
    ConnectionCostDetail,
    ServiceNode,
    ServiceConnection
)
from app.models.lambda_function import LambdaRequest
from app.models.api_gateway import APIGatewayRequest
from app.models.s3 import S3Request
from app.models.dynamodb import DynamoDBRequest
from app.models.elb import ELBRequest
from app.services.lambda_service.calculator import LambdaCalculator
from app.services.api_gateway.calculator import APIGatewayCalculator
from app.services.architecture.data_transfer_pricing import DataTransferPricing
from app.core.base_calculator import BaseCalculator
import logging

logger = logging.getLogger(__name__)


class ArchitectureCalculator:
    """Calculates total cost for a multi-service architecture"""
    
    def __init__(self):
        # Registry of service calculators
        from app.services.s3.calculator import S3Calculator
        from app.services.dynamodb.calculator import DynamoDBCalculator
        from app.services.elb.calculator import ELBCalculator
        
        self._calculators: Dict[str, BaseCalculator] = {
            "lambda": LambdaCalculator(),
            "api_gateway": APIGatewayCalculator(),
            "s3": S3Calculator(),
            "dynamodb": DynamoDBCalculator(),
            "elb": ELBCalculator(),
        }
        
        # Data transfer pricing
        self._transfer_pricing = DataTransferPricing()
    
    def calculate(self, request: ArchitectureRequest) -> ArchitectureCostResponse:
        """Calculate total architecture cost
        
        Args:
            request: Architecture request with nodes and connections
            
        Returns:
            Complete cost response with breakdowns
        """
        warnings = []
        
        # Build node lookup for connections
        node_lookup: Dict[str, ServiceNode] = {node.id: node for node in request.nodes}
        
        # Step 1: Calculate cost for each service node
        service_details = []
        total_services_cost = 0.0
        
        for node in request.nodes:
            try:
                detail = self._calculate_node_cost(node, request.include_free_tier)
                service_details.append(detail)
                total_services_cost += detail.cost
            except Exception as e:
                logger.error(f"Error calculating cost for node {node.id}: {e}")
                warnings.append(f"Failed to calculate cost for {node.name}: {str(e)}")
        
        # Step 2: Calculate data transfer costs for each connection
        connection_details = []
        total_transfer_cost = 0.0
        
        for conn in request.connections:
            try:
                source_node = node_lookup.get(conn.source_id)
                target_node = node_lookup.get(conn.target_id)
                
                if not source_node:
                    warnings.append(f"Connection {conn.id}: source node '{conn.source_id}' not found")
                    continue
                if not target_node:
                    warnings.append(f"Connection {conn.id}: target node '{conn.target_id}' not found")
                    continue
                
                detail = self._calculate_connection_cost(conn, source_node, target_node)
                connection_details.append(detail)
                total_transfer_cost += detail.cost
                
            except Exception as e:
                logger.error(f"Error calculating transfer cost for connection {conn.id}: {e}")
                warnings.append(f"Failed to calculate transfer for connection {conn.id}: {str(e)}")
        
        # Step 3: Build response
        total_cost = total_services_cost + total_transfer_cost
        
        breakdown = ArchitectureBreakdown(
            total_cost=round(total_cost, 2),
            services_cost=round(total_services_cost, 2),
            data_transfer_cost=round(total_transfer_cost, 2)
        )
        
        return ArchitectureCostResponse(
            architecture_name=request.name,
            total_cost=round(total_cost, 2),
            breakdown=breakdown,
            service_details=service_details,
            connection_details=connection_details,
            free_tier_applied=request.include_free_tier,
            warnings=warnings
        )
    
    def _calculate_node_cost(self, node: ServiceNode, include_free_tier: bool) -> ServiceCostDetail:
        """Calculate cost for a single service node"""
        calculator = self._calculators.get(node.service_type)
        
        if not calculator:
            raise ValueError(f"No calculator available for service type: {node.service_type}")
        
        # Build service-specific request from config
        config = node.config.copy()
        config["include_free_tier"] = include_free_tier
        
        # Convert config to appropriate request model and calculate
        if node.service_type == "lambda":
            service_request = LambdaRequest(**config)
            result = calculator.calculate(service_request)
            return ServiceCostDetail(
                node_id=node.id,
                name=node.name,
                service_type=node.service_type,
                region=config.get("region", "unknown"),
                cost=result.breakdown.total_cost,
                breakdown={
                    "requests_cost": result.breakdown.requests_cost,
                    "compute_cost": result.breakdown.compute_cost,
                    "storage_cost": result.breakdown.ephemeral_storage_cost,
                    "provisioned_cost": result.breakdown.provisioned_concurrency_cost
                }
            )
        
        elif node.service_type == "api_gateway":
            service_request = APIGatewayRequest(**config)
            region = config.get("region", "us-east-1")
            api_cost = 0.0
            cache_cost = 0.0
            details = {}
            
            if service_request.api_type == "HTTP":
                request_kb = service_request.request_size_kb or 1.0
                response_kb = service_request.response_size_kb or 1.0
                api_cost, details = calculator.calculate_http_api(
                    region, service_request.requests_per_month,
                    request_kb, response_kb
                )
            elif service_request.api_type == "REST":
                api_cost, details = calculator.calculate_rest_api(
                    region, service_request.requests_per_month
                )
                if service_request.enable_caching and service_request.cache_size_gb:
                    cache_cost, _ = calculator.calculate_cache(
                        region, service_request.cache_size_gb
                    )
            elif service_request.api_type == "WEBSOCKET":
                msg_kb = service_request.message_size_kb or 1.0
                conn_mins = service_request.connection_minutes or 0
                msg_cost, conn_cost, details = calculator.calculate_websocket(
                    region, service_request.requests_per_month,
                    msg_kb, conn_mins
                )
                api_cost = msg_cost + conn_cost
            
            total_cost = api_cost + cache_cost
            
            return ServiceCostDetail(
                node_id=node.id,
                name=node.name,
                service_type=node.service_type,
                region=region,
                cost=round(total_cost, 2),
                breakdown={
                    "api_cost": round(api_cost, 2),
                    "cache_cost": round(cache_cost, 2),
                    "details": details
                }
            )
        
        elif node.service_type == "s3":
            service_request = S3Request(**config)
            result = calculator.calculate(service_request)
            return ServiceCostDetail(
                node_id=node.id,
                name=node.name,
                service_type=node.service_type,
                region=config.get("region", "ap-south-1"),
                cost=result.breakdown.total_cost,
                breakdown={
                    "storage_cost": result.breakdown.storage_cost,
                    "request_cost": result.breakdown.request_cost,
                    "transfer_cost": result.breakdown.transfer_cost,
                }
            )
        
        elif node.service_type == "dynamodb":
            service_request = DynamoDBRequest(**config)
            result = calculator.calculate(service_request)
            return ServiceCostDetail(
                node_id=node.id,
                name=node.name,
                service_type=node.service_type,
                region=config.get("region", "us-east-1"),
                cost=result.breakdown.total_cost,
                breakdown={
                    "storage_cost": result.breakdown.storage_cost,
                    "on_demand_read_cost": result.breakdown.on_demand_read_cost,
                    "on_demand_write_cost": result.breakdown.on_demand_write_cost,
                    "provisioned_read_cost": result.breakdown.provisioned_read_cost,
                    "provisioned_write_cost": result.breakdown.provisioned_write_cost,
                    "pitr_cost": result.breakdown.pitr_cost,
                    "backup_cost": result.breakdown.backup_storage_cost,
                }
            )
        
        elif node.service_type == "elb":
            service_request = ELBRequest(**config)
            result = calculator.calculate(service_request)
            return ServiceCostDetail(
                node_id=node.id,
                name=node.name,
                service_type=node.service_type,
                region=config.get("region", "us-east-1"),
                cost=result.breakdown.total_cost,
                breakdown={
                    "hourly_cost": result.breakdown.hourly_cost,
                    "lcu_cost": result.breakdown.lcu_cost if hasattr(result.breakdown, 'lcu_cost') else 0,
                    "data_processing_cost": result.breakdown.data_processing_cost if hasattr(result.breakdown, 'data_processing_cost') else 0,
                }
            )
        
        else:
            raise ValueError(f"Unsupported service type: {node.service_type}")
    
    def _calculate_connection_cost(
        self, 
        conn: ServiceConnection, 
        source_node: ServiceNode, 
        target_node: ServiceNode
    ) -> ConnectionCostDetail:
        """Calculate data transfer cost for a connection"""
        
        # Get regions from node configs
        source_region = source_node.config.get("region", "us-east-1")
        target_region = target_node.config.get("region", "us-east-1")
        
        # Get requests per month - from connection or infer from source node
        requests_per_month = conn.requests_per_month
        if requests_per_month is None:
            # Try to infer from source node config
            requests_per_month = source_node.config.get("requests_per_month", 0)
        
        # Calculate data transfer in GB
        # Formula: requests × (request_size + response_size) / 1024 / 1024 (KB to GB)
        total_payload_kb = conn.avg_request_size_kb + conn.avg_response_size_kb
        data_transfer_gb = (requests_per_month * total_payload_kb) / 1024 / 1024
        
        # Get transfer rate based on regions
        transfer_type, rate_per_gb, _ = self._transfer_pricing.get_transfer_rate(
            source_region, 
            target_region
        )
        
        # Calculate cost
        cost = data_transfer_gb * rate_per_gb
        
        return ConnectionCostDetail(
            connection_id=conn.id,
            source_name=source_node.name,
            target_name=target_node.name,
            source_region=source_region,
            target_region=target_region,
            transfer_type=transfer_type,
            requests_per_month=requests_per_month,
            avg_request_size_kb=conn.avg_request_size_kb,
            avg_response_size_kb=conn.avg_response_size_kb,
            data_transfer_gb=round(data_transfer_gb, 4),
            rate_per_gb=rate_per_gb,
            cost=round(cost, 2)
        )
    
    @property
    def supported_services(self) -> List[str]:
        """Get list of supported service types"""
        return list(self._calculators.keys())
