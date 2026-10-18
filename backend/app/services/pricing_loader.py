"""Generic pricing data loader for all AWS services"""
import json
import os
from pathlib import Path
from typing import Dict, List, Optional
import logging
from pymongo.errors import PyMongoError
from app.core.base_calculator import PricingTier
from app.core.mongo import get_pricing_collection

logger = logging.getLogger(__name__)


class PricingLoader:
    """Singleton loader for pricing data across all services

    Data source is controlled by the PRICING_SOURCE environment variable:
      auto  (default) use MongoDB if it has data for this service, else the JSON file
      mongo           MongoDB only, fail if there is no data for this service
      file            JSON file only
    """
    _instances: Dict[str, 'PricingLoader'] = {}

    def __new__(cls, service_name: str):
        if service_name not in cls._instances:
            instance = super().__new__(cls)
            cls._instances[service_name] = instance
            instance._initialized = False
        return cls._instances[service_name]

    def __init__(self, service_name: str):
        if self._initialized:
            return

        self.service_name = service_name
        self.pricing_data = None
        self.index = {}
        self._initialized = True
        self._load_pricing_data()

    def _load_pricing_data(self):
        """Load pricing data for this service and build its index"""
        try:
            self.pricing_data = self._read_source()

            if not isinstance(self.pricing_data, dict):
                raise ValueError(f"Invalid pricing data format: expected dict, got {type(self.pricing_data).__name__}")

            logger.info(f"Building {self.service_name} pricing index...")
            self._build_index()
            logger.info(f"{self.service_name} pricing index built successfully")
        except Exception as e:
            logger.error(f"Failed to load pricing data for {self.service_name}: {e}")
            raise

    def _read_source(self) -> dict:
        """Read raw pricing data from MongoDB or the JSON file, per PRICING_SOURCE"""
        source = os.getenv("PRICING_SOURCE", "auto").lower()

        if source in ("auto", "mongo"):
            data = self._load_from_mongo()
            if data is not None:
                return data
            if source == "mongo":
                raise RuntimeError(
                    f"PRICING_SOURCE=mongo but no MongoDB pricing data found for {self.service_name}"
                )

        return self._load_from_file()

    def _mongo_filter(self) -> dict:
        """Extra MongoDB query for services that only need part of their data (override in subclasses)"""
        return {}

    def _load_from_mongo(self) -> Optional[dict]:
        """Rebuild the products/terms structure from MongoDB documents, or None if unavailable"""
        try:
            collection = get_pricing_collection()
            if collection is None:
                return None

            query = {"service": self.service_name, **self._mongo_filter()}
            products: Dict[str, dict] = {}
            on_demand: Dict[str, dict] = {}

            for doc in collection.find(query).sort("order", 1).batch_size(1000):
                sku = doc["sku"]
                products[sku] = doc["product"]

                terms = {}
                for term in doc["terms"]:
                    dimensions = {
                        dim.get("rateCode", str(i)): dim
                        for i, dim in enumerate(term.get("priceDimensions", []))
                    }
                    term_key = f"{sku}.{term.get('offerTermCode', len(terms))}"
                    terms[term_key] = {**term, "priceDimensions": dimensions}
                on_demand[sku] = terms

            if not products:
                return None

            logger.info(f"Loaded {self.service_name} pricing from MongoDB ({len(products)} products)")
            return {"products": products, "terms": {"OnDemand": on_demand}}
        except PyMongoError as e:
            logger.warning(f"MongoDB unavailable for {self.service_name}: {e}")
            return None

    def _load_from_file(self) -> dict:
        """Load the pricing JSON file for this service"""
        pricing_file = Path(__file__).parent.parent.parent / "pricing_data" / f"{self.service_name}.json"

        if not pricing_file.exists():
            logger.error(f"Pricing file not found: {pricing_file}")
            raise FileNotFoundError(f"Pricing file not found: {pricing_file}")

        try:
            logger.info(f"Loading {self.service_name} pricing data from {pricing_file}")
            with open(pricing_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from {pricing_file}: {e}")
            raise ValueError(f"Invalid JSON in pricing file: {e}")

    def _build_index(self):
        """Build pricing index - to be implemented by service-specific logic"""
        pass

    def _extract_tiers(self, sku: str, terms: dict) -> List[PricingTier]:
        """Extract pricing tiers from terms"""
        if sku not in terms:
            return []

        tiers = []
        sku_terms = terms[sku]

        for term_data in sku_terms.values():
            price_dimensions = term_data.get("priceDimensions", {})

            for dimension in price_dimensions.values():
                begin_range = dimension.get("beginRange", "0")
                end_range = dimension.get("endRange", "Inf")
                price_per_unit = dimension.get("pricePerUnit", {}).get("USD", "0")
                unit = dimension.get("unit", "")

                begin = int(begin_range) if begin_range != "0" else 0
                end = float('inf') if end_range == "Inf" else int(end_range)
                price = float(price_per_unit)

                tiers.append(PricingTier(begin, end, price, unit))

        tiers.sort(key=lambda t: t.begin_range)
        return tiers

    def get_available_regions(self) -> List[str]:
        """Get list of available regions"""
        return list(self.index.keys())