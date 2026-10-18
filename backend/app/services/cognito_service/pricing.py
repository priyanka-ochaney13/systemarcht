"""Cognito pricing loaded from the AWS catalog JSON or MongoDB."""
import re
from typing import List, Tuple

from app.core.base_calculator import PricingTier
from app.services.pricing_loader import PricingLoader


class CognitoPricing(PricingLoader):
    """Load Cognito catalog rates and calculate feature costs."""

    REGION_NAMES = {
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
    def __new__(cls):
        return super().__new__(cls, "cognito")

    def __init__(self):
        if getattr(self, "_initialized", False):
            return
        self.free_tier = {"mau": 0}
        super().__init__("cognito")

    @staticmethod
    def _parse_quantity(value: str) -> int:
        """Parse catalog tier quantities such as 50k and 1M."""
        match = re.fullmatch(r"([\d.]+)\s*([kKmM]?)", value.strip())
        if not match:
            raise ValueError(f"Unsupported Cognito MAU tier quantity: {value!r}")

        quantity = float(match.group(1))
        suffix = match.group(2).lower()
        if suffix == "k":
            quantity *= 1_000
        elif suffix == "m":
            quantity *= 1_000_000
        return int(quantity)

    @classmethod
    def _mau_tier_range(cls, attributes: dict) -> Tuple[int, float]:
        """Read tier boundaries from the catalog product attributes."""
        tier_description = attributes.get("tieredUsageType")
        if tier_description:
            open_ended = re.fullmatch(r"([\d.]+[kKmM]?)\+", tier_description.strip())
            if open_ended:
                return cls._parse_quantity(open_ended.group(1)), float("inf")
            match = re.fullmatch(r"([\d.]+[kKmM]?)-([\d.]+[kKmM]?\+?)", tier_description.strip())
            if not match:
                raise ValueError(f"Unsupported Cognito MAU tier: {tier_description!r}")
            begin = cls._parse_quantity(match.group(1))
            upper = match.group(2).rstrip("+")
            end = float("inf") if match.group(2).endswith("+") else cls._parse_quantity(upper)
            return begin, end

        group = attributes.get("group", "")
        description = attributes.get("groupDescription", "")
        if "MAU" in group and "Free Tier" in group:
            match = re.search(r"First\s+([\d,]+)", description)
            if match:
                return 0, int(match.group(1).replace(",", ""))
        raise ValueError(f"Missing Cognito MAU tier boundaries in {attributes!r}")

    def _build_index(self):
        products = self.pricing_data.get("products", {})
        terms = self.pricing_data.get("terms", {}).get("OnDemand", {})
        region_map = {}
        free_tiers = set()

        for sku, product in products.items():
            attributes = product.get("attributes", {})
            region = attributes.get("regionCode")
            if not region:
                continue

            region_pricing = region_map.setdefault(region, {
                "mau_tiers": [],
                "sms_mfa": None,
                "totp_mfa": None,
                "advanced_security": None,
                "admin_api": None,
                "user_api": None,
                "sign_up": None,
            })

            price, unit = self._extract_price(sku, terms)
            group = attributes.get("group", "")
            tier = PricingTier(0, float("inf"), price, unit)

            if "Cognito User Pool MAU" in group:
                begin, end = self._mau_tier_range(attributes)
                region_pricing["mau_tiers"].append(
                    PricingTier(begin, end, price, unit)
                )
                if "Free Tier" in group:
                    free_tiers.add(int(end))
            elif "MFA SMS" in group:
                region_pricing["sms_mfa"] = tier
            elif "MFA TOTP" in group:
                region_pricing["totp_mfa"] = tier
            elif "Advanced Security" in group:
                region_pricing["advanced_security"] = tier
            elif "Admin API" in group:
                region_pricing["admin_api"] = tier
            elif "User API" in group:
                region_pricing["user_api"] = tier
            elif "Sign-ups" in group:
                region_pricing["sign_up"] = tier

        if len(free_tiers) > 1:
            raise ValueError(f"Inconsistent Cognito MAU free tiers in catalog: {sorted(free_tiers)}")
        if free_tiers:
            self.free_tier["mau"] = free_tiers.pop()

        for region_pricing in region_map.values():
            region_pricing["mau_tiers"].sort(key=lambda item: item.begin_range)

        self.index = region_map

    @staticmethod
    def _extract_price(sku: str, terms: dict) -> Tuple[float, str]:
        sku_terms = terms.get(sku, {})
        for term_data in sku_terms.values():
            dimensions = term_data.get("priceDimensions", {})
            values = dimensions.values() if isinstance(dimensions, dict) else dimensions
            for dimension in values:
                if "price" in dimension:
                    price = float(dimension["price"])
                else:
                    price = float(dimension.get("pricePerUnit", {}).get("USD", "0"))
                return price, dimension.get("unit", "")
        return 0.0, ""

    @property
    def rates(self) -> dict:
        """Return the legacy default-region rate shape, sourced from the catalog."""
        return self.get_rates_for_region("us-east-1")

    def get_rates_for_region(self, region: str) -> dict:
        pricing = self._get_region_pricing(region)
        paid_mau_tiers = [
            tier for tier in pricing["mau_tiers"]
            if tier.price_per_unit > 0
        ]
        return {
            "mau_rate": paid_mau_tiers[0].price_per_unit if paid_mau_tiers else 0.0,
            "mau_tiers": [
                {
                    "begin": tier.begin_range,
                    "end": None if tier.end_range == float("inf") else tier.end_range,
                    "rate": tier.price_per_unit,
                    "unit": tier.unit,
                }
                for tier in pricing["mau_tiers"]
            ],
            "sms_mfa_rate": pricing["sms_mfa"].price_per_unit if pricing["sms_mfa"] else None,
            "totp_mfa_rate": pricing["totp_mfa"].price_per_unit if pricing["totp_mfa"] else None,
            "advanced_security_rate": (
                pricing["advanced_security"].price_per_unit
                if pricing["advanced_security"] else None
            ),
            "custom_domain": None,
            "email_rate": None,
        }

    def get_available_regions(self) -> List[str]:
        return sorted(self.index)

    def get_region_name(self, region_code: str) -> str:
        return self.REGION_NAMES.get(region_code, region_code)

    def _get_region_pricing(self, region: str) -> dict:
        try:
            return self.index[region]
        except KeyError as exc:
            raise ValueError(f"No Cognito pricing is available for region {region!r}") from exc

    def calculate_mau_cost(self, mau: int, region: str = "us-east-1") -> Tuple[float, int]:
        pricing = self._get_region_pricing(region)
        cost = 0.0
        for tier in pricing["mau_tiers"]:
            if mau <= tier.begin_range:
                continue
            tier_end = min(mau, tier.end_range)
            cost += max(0, tier_end - tier.begin_range) * tier.price_per_unit
        return cost, max(0, mau - self.free_tier["mau"])

    def calculate_sms_mfa_cost(
        self,
        mau: int,
        mfa_percentage: float,
        region: str = "us-east-1",
    ) -> Tuple[float, int]:
        if mfa_percentage <= 0:
            return 0.0, 0
        pricing = self._get_region_pricing(region)
        sms_tier = pricing["sms_mfa"]
        if sms_tier is None:
            raise ValueError(f"SMS MFA pricing is missing for region {region!r}")
        sms_count = int(mau * (mfa_percentage / 100))
        return sms_count * sms_tier.price_per_unit, sms_count

    def calculate_totp_mfa_cost(
        self,
        mau: int,
        mfa_percentage: float,
        region: str = "us-east-1",
    ) -> Tuple[float, int]:
        pricing = self._get_region_pricing(region)
        totp_tier = pricing["totp_mfa"]
        if totp_tier is None:
            raise ValueError(f"TOTP MFA pricing is missing for region {region!r}")
        mfa_users = int(mau * (mfa_percentage / 100))
        return mfa_users * totp_tier.price_per_unit, mfa_users

    def calculate_advanced_security_cost(
        self,
        advanced_security_mau: int,
        region: str = "us-east-1",
    ) -> Tuple[float, int]:
        pricing = self._get_region_pricing(region)
        security_tier = pricing["advanced_security"]
        if security_tier is None:
            raise ValueError(f"Advanced Security pricing is missing for region {region!r}")
        return advanced_security_mau * security_tier.price_per_unit, advanced_security_mau

    @staticmethod
    def calculate_custom_domain_cost(enabled: bool) -> float:
        if enabled:
            raise ValueError(
                "Custom-domain pricing is not present in the Cognito pricing catalog."
            )
        return 0.0

    @staticmethod
    def calculate_email_customization_cost(monthly_emails: int) -> float:
        raise ValueError(
            "Email-customization pricing is not present in the Cognito pricing catalog."
        )
