"""DynamoDB pricing service"""
from app.services.pricing_loader import PricingLoader
from app.core.base_calculator import PricingTier
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

class DynamoDBPricing(PricingLoader):
    """DynamoDB specific pricing loader"""
    
    def __new__(cls):
        return super().__new__(cls, "dynamodb")
    
    def __init__(self):
        super().__init__("dynamodb")
    
    def _build_index(self):
        """Build DynamoDB specific pricing index"""
        if not self.pricing_data:
            logger.warning("Pricing data is empty, skipping index build")
            return
            
        products = self.pricing_data.get("products", {})
        if not isinstance(products, dict):
            logger.warning(f"Invalid products format: expected dict, got {type(products).__name__}")
            return
            
        terms = self.pricing_data.get("terms", {}).get("OnDemand", {})
        if not isinstance(terms, dict):
            logger.warning(f"Invalid terms format: expected dict, got {type(terms).__name__}")
            return
        
        match_counts = {"on_demand_read": 0, "on_demand_write": 0, "provisioned_read": 0,
                       "provisioned_write": 0, "storage": 0, "backup": 0, "pitr": 0, "restore": 0}
        
        for sku, product in products.items():
            if not isinstance(product, dict):
                logger.debug(f"Skipping invalid product entry for SKU {sku}")
                continue
                
            attrs = product.get("attributes", {})
            region = attrs.get("regionCode")
            
            if not region:
                continue
            
            # Initialize region in index
            if region not in self.index:
                self.index[region] = {
                    "on_demand_read": None,
                    "on_demand_write": None,
                    "provisioned_read": None,
                    "provisioned_write": None,
                    "storage": None,
                    "backup_storage": None,
                    "pitr": None,
                    "restore": None
                }
            
            usagetype = attrs.get("usagetype", "")
            
            # NOTE: productFamily is empty in this pricing JSON — all matching is
            # done purely on usagetype suffixes. IA-prefixed variants are skipped
            # throughout since the calculator targets standard-class capacity only.

            # On-Demand reads: ends with ReadRequestUnits, not IA
            if usagetype.endswith("ReadRequestUnits") and "-IA-" not in usagetype and not usagetype.startswith("IA-"):
                try:
                    self.index[region]["on_demand_read"] = self._extract_tiers(sku, terms)
                    match_counts["on_demand_read"] += 1
                except Exception as e:
                    logger.debug(f"Failed to extract on_demand_read tiers for region {region}: {e}")

            # On-Demand writes: ends with WriteRequestUnits, not IA or Repl
            elif usagetype.endswith("WriteRequestUnits") and "-IA-" not in usagetype and not usagetype.startswith("IA-") and "Repl" not in usagetype:
                try:
                    self.index[region]["on_demand_write"] = self._extract_tiers(sku, terms)
                    match_counts["on_demand_write"] += 1
                except Exception as e:
                    logger.debug(f"Failed to extract on_demand_write tiers for region {region}: {e}")

            # Provisioned reads: ends with ReadCapacityUnit-Hrs, not IA
            elif usagetype.endswith("ReadCapacityUnit-Hrs") and "IA" not in usagetype:
                try:
                    self.index[region]["provisioned_read"] = self._extract_tiers(sku, terms)
                    match_counts["provisioned_read"] += 1
                except Exception as e:
                    logger.debug(f"Failed to extract provisioned_read tiers for region {region}: {e}")

            # Provisioned writes: ends with WriteCapacityUnit-Hrs, not IA or Repl
            elif usagetype.endswith("WriteCapacityUnit-Hrs") and "IA" not in usagetype and "Repl" not in usagetype:
                try:
                    self.index[region]["provisioned_write"] = self._extract_tiers(sku, terms)
                    match_counts["provisioned_write"] += 1
                except Exception as e:
                    logger.debug(f"Failed to extract provisioned_write tiers for region {region}: {e}")

            # Standard storage: ends with TimedStorage-ByteHrs, not IA or PITR
            elif usagetype.endswith("TimedStorage-ByteHrs") and "IA" not in usagetype and "PITR" not in usagetype:
                try:
                    self.index[region]["storage"] = self._extract_tiers(sku, terms)
                    match_counts["storage"] += 1
                except Exception as e:
                    logger.debug(f"Failed to extract storage tiers for region {region}: {e}")

            # PITR storage: ends with TimedPITRStorage-ByteHrs
            elif usagetype.endswith("TimedPITRStorage-ByteHrs"):
                try:
                    self.index[region]["pitr"] = self._extract_tiers(sku, terms)
                    match_counts["pitr"] += 1
                except Exception as e:
                    logger.debug(f"Failed to extract pitr tiers for region {region}: {e}")

            # On-demand backup storage: ends with TimedBackupStorage-ByteHrs
            elif usagetype.endswith("TimedBackupStorage-ByteHrs"):
                try:
                    self.index[region]["backup_storage"] = self._extract_tiers(sku, terms)
                    match_counts["backup"] += 1
                except Exception as e:
                    logger.debug(f"Failed to extract backup_storage tiers for region {region}: {e}")

            # Restore: ends with RestoreDataSize-Bytes
            elif usagetype.endswith("RestoreDataSize-Bytes"):
                try:
                    self.index[region]["restore"] = self._extract_tiers(sku, terms)
                    match_counts["restore"] += 1
                except Exception as e:
                    logger.debug(f"Failed to extract restore tiers for region {region}: {e}")
        
        logger.info(f"Pricing index built with matches: {match_counts}. Regions indexed: {len(self.index)}")

    def get_available_regions(self) -> List[str]:
        """Get list of available regions"""
        return list(self.index.keys())

    def validate_region(self, region: str) -> bool:
        """Check if region is available"""
        return region in self.index

    def get_on_demand_price(self, region: str, type: str) -> Optional[List[PricingTier]]:
        if region not in self.index: return None
        return self.index[region].get(f"on_demand_{type}")

    def get_provisioned_price(self, region: str, type: str) -> Optional[List[PricingTier]]:
        if region not in self.index: return None
        return self.index[region].get(f"provisioned_{type}")

    def get_storage_price(self, region: str) -> Optional[List[PricingTier]]:
        if region not in self.index: return None
        return self.index[region].get("storage")
        
    def get_backup_price(self, region: str, type: str) -> Optional[List[PricingTier]]:
        if region not in self.index: return None
        if type == "pitr":
             return self.index[region].get("pitr")
        elif type == "storage":
             return self.index[region].get("backup_storage")
        elif type == "restore":
             return self.index[region].get("restore")
        return None