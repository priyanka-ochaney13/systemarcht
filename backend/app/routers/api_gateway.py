"""API Gateway routes"""
from fastapi import APIRouter, HTTPException
from app.models.api_gateway import APIGatewayRequest, APIGatewayResponse, APIGatewayCostBreakdown
from app.services.api_gateway.calculator import APIGatewayCalculator

router = APIRouter(prefix="/api/api-gateway", tags=["API Gateway"])
calculator = APIGatewayCalculator()

@router.post("/calculate", response_model=APIGatewayResponse)
def calculate_api_gateway_cost(request: APIGatewayRequest):
    """Calculate API Gateway costs"""
    try:
        api_cost = 0.0
        cache_cost = 0.0
        connection_cost = 0.0
        details = {}
        
        if request.api_type == "HTTP":
            if not request.request_size_kb or not request.response_size_kb:
                raise HTTPException(400, "HTTP API requires request and response sizes")
            
            api_cost, http_details = calculator.calculate_http_api(
                request.region, request.requests_per_month,
                request.request_size_kb, request.response_size_kb
            )
            details["http_api"] = http_details
        
        elif request.api_type == "REST":
            api_cost, rest_details = calculator.calculate_rest_api(
                request.region, request.requests_per_month
            )
            details["rest_api"] = rest_details
            
            if request.enable_caching and request.cache_size_gb:
                cache_cost, cache_details = calculator.calculate_cache(
                    request.region, request.cache_size_gb
                )
                details["cache"] = cache_details
        
        elif request.api_type == "WEBSOCKET":
            if not request.message_size_kb or not request.connection_minutes:
                raise HTTPException(400, "WebSocket requires message size and connection minutes")
            
            msg_cost, conn_cost, ws_details = calculator.calculate_websocket(
                request.region, request.requests_per_month,
                request.message_size_kb, request.connection_minutes
            )
            api_cost = msg_cost
            connection_cost = conn_cost
            details["websocket"] = ws_details
        
        total = api_cost + cache_cost + connection_cost
        
        breakdown = APIGatewayCostBreakdown(
            total_cost=total,
            api_requests_cost=api_cost,
            cache_cost=cache_cost,
            websocket_connection_cost=connection_cost
        )
        
        return APIGatewayResponse(
            service="api_gateway",
            breakdown=breakdown,
            details=details
        )
    
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"Internal error: {str(e)}")

@router.get("/regions")
def get_api_gateway_regions():
    """Get available regions for API Gateway"""
    return {"regions": sorted(calculator.pricing.get_available_regions())}