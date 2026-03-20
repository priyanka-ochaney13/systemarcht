"""API Gateway pricing service"""
from app.services.pricing_loader import PricingLoader

class APIGatewayPricing(PricingLoader):
    """API Gateway specific pricing loader"""
    
    def __new__(cls):
        return super().__new__(cls, "api_gateway")
    
    def __init__(self):
        super().__init__("api_gateway")
    
    def _build_index(self):
        """Build API Gateway specific index"""
        products = self.pricing_data.get("products", {})
        terms = self.pricing_data.get("terms", {}).get("OnDemand", {})
        
        for sku, product in products.items():
            attrs = product.get("attributes", {})
            region = attrs.get("regionCode")
            operation = attrs.get("operation")
            cache_size = attrs.get("cacheMemorySizeGb")
            usagetype = attrs.get("usagetype", "")
            
            if not region or not operation:
                continue
            
            tiers = self._extract_tiers(sku, terms)
            if not tiers:
                continue
            
            if region not in self.index:
                self.index[region] = {}
            
            # WebSocket has same operation but different usagetypes for messages vs minutes
            if operation == "ApiGatewayWebSocket":
                if "ApiGatewayMessage" in usagetype:
                    op_key = "ApiGatewayMessage"
                elif "ApiGatewayMinute" in usagetype:
                    op_key = "ApiGatewayMinute"
                else:
                    op_key = operation
            else:
                op_key = operation
            
            if op_key not in self.index[region]:
                self.index[region][op_key] = {}
            
            key = cache_size if cache_size else "default"
            self.index[region][op_key][key] = tiers
    
    def get_pricing(self, region: str, operation: str, cache_size: str = None):
        """Get pricing tiers for API Gateway"""
        key = cache_size if cache_size else "default"
        return self.index.get(region, {}).get(operation, {}).get(key)