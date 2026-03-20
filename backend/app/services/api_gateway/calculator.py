"""API Gateway calculator"""
import math
from typing import Dict, Any, Tuple
from app.core.base_calculator import BaseCalculator
from app.services.api_gateway.pricing import APIGatewayPricing
from app.utils.constants import (
    HTTP_API_REQUEST_CHUNK_KB,
    HTTP_API_RESPONSE_CHUNK_KB,
    WEBSOCKET_MESSAGE_CHUNK_KB,
    HOURS_PER_MONTH
)

class APIGatewayCalculator(BaseCalculator):
    """API Gateway cost calculator"""
    
    def __init__(self):
        super().__init__("api_gateway")
        self.pricing = APIGatewayPricing()
    
    def calculate(self, **kwargs) -> Dict[str, Any]:
        """Main calculation method"""
        pass
    
    def calculate_http_api(self, region: str, requests: int, 
                          request_kb: float, response_kb: float) -> Tuple[float, dict]:
        """Calculate HTTP API cost"""
        request_chunks = math.ceil(request_kb / HTTP_API_REQUEST_CHUNK_KB)
        response_chunks = math.ceil(response_kb / HTTP_API_RESPONSE_CHUNK_KB)
        billable_per_request = request_chunks + response_chunks
        total_billable = requests * billable_per_request
        
        pricing_tiers = self.pricing.get_pricing(region, "ApiGatewayHttpApi")
        if not pricing_tiers:
            raise ValueError(f"No HTTP API pricing for region {region}")
        
        cost = self.apply_tiered_pricing(total_billable, pricing_tiers)
        
        details = {
            "actual_requests": requests,
            "request_chunks": request_chunks,
            "response_chunks": response_chunks,
            "billable_requests": total_billable,
            "cost_usd": cost
        }
        
        return cost, details
    
    def calculate_rest_api(self, region: str, requests: int) -> Tuple[float, dict]:
        """Calculate REST API cost"""
        pricing_tiers = self.pricing.get_pricing(region, "ApiGatewayRequest")
        if not pricing_tiers:
            raise ValueError(f"No REST API pricing for region {region}")
        
        cost = self.apply_tiered_pricing(requests, pricing_tiers)
        
        return cost, {"total_requests": requests, "cost_usd": cost}
    
    def calculate_websocket(self, region: str, messages: int, 
                           message_kb: float, connection_minutes: int) -> Tuple[float, float, dict]:
        """Calculate WebSocket cost"""
        chunks_per_message = math.ceil(message_kb / WEBSOCKET_MESSAGE_CHUNK_KB)
        total_billable_messages = messages * chunks_per_message
        
        message_pricing = self.pricing.get_pricing(region, "ApiGatewayMessage")
        minute_pricing = self.pricing.get_pricing(region, "ApiGatewayMinute")
        
        if not message_pricing or not minute_pricing:
            raise ValueError(f"No WebSocket pricing for region {region}")
        
        message_cost = self.apply_tiered_pricing(total_billable_messages, message_pricing)
        connection_cost = self.apply_tiered_pricing(connection_minutes, minute_pricing)
        
        details = {
            "actual_messages": messages,
            "chunks_per_message": chunks_per_message,
            "billable_messages": total_billable_messages,
            "message_cost_usd": message_cost,
            "connection_minutes": connection_minutes,
            "connection_cost_usd": connection_cost
        }
        
        return message_cost, connection_cost, details
    
    def calculate_cache(self, region: str, cache_size_gb: str) -> Tuple[float, dict]:
        """Calculate cache cost"""
        cache_pricing = self.pricing.get_pricing(region, "RunInstances", cache_size_gb)
        if not cache_pricing:
            raise ValueError(f"No cache pricing for {cache_size_gb}GB in {region}")
        
        hourly_rate = cache_pricing[0].price_per_unit
        monthly_cost = hourly_rate * HOURS_PER_MONTH
        
        return monthly_cost, {
            "cache_size_gb": cache_size_gb,
            "hourly_rate": hourly_rate,
            "monthly_cost": monthly_cost
        }