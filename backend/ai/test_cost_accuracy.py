"""Tests for cost estimates and recommendations staying within their inputs."""

import unittest
from types import SimpleNamespace
from unittest.mock import Mock

from ai.chat_prompts import CHAT_SYSTEM_PROMPT
from app.core.base_calculator import PricingTier
from app.models.architecture import ServiceConnection, ServiceNode
from app.models.cloudfront import CloudFrontRequest
from app.services.architecture.calculator import ArchitectureCalculator
from app.services.cloudfront.calculator import CloudFrontCalculator
from app.utils.constants import CLOUDFRONT_FALLBACK_PRICING, CLOUDFRONT_FREE_TIER


class CostAccuracyTests(unittest.TestCase):
    def test_cloudfront_invalidation_cost_uses_account_free_allowance(self) -> None:
        calculator = object.__new__(CloudFrontCalculator)
        calculator.service_name = "cloudfront"
        calculator._free_tier = CLOUDFRONT_FREE_TIER
        calculator._fallback = CLOUDFRONT_FALLBACK_PRICING
        calculator.pricing = Mock()
        calculator.pricing.get_data_transfer_pricing.return_value = []
        calculator.pricing.get_https_requests_pricing.return_value = []
        calculator.pricing.get_http_requests_pricing.return_value = []
        calculator.pricing.get_invalidations_pricing.return_value = [
            PricingTier(0, 1000, 0.0, "path"),
            PricingTier(1000, float("inf"), 0.005, "path"),
        ]

        for paths, expected_cost in ((999, 0), (1000, 0), (2655, 8.28)):
            with self.subTest(paths=paths):
                result = calculator.calculate(
                    CloudFrontRequest(region="IN", invalidation_paths=paths)
                )
                self.assertEqual(result.breakdown.invalidation_cost, expected_cost)

    def test_cloudfront_origin_connection_is_not_charged_across_regions(self) -> None:
        calculator = object.__new__(ArchitectureCalculator)
        calculator._transfer_pricing = Mock()
        cloudfront = ServiceNode(
            id="cdn",
            service_type="cloudfront",
            name="CDN",
            config={"region": "GLOBAL"},
        )
        bucket = ServiceNode(
            id="bucket",
            service_type="s3",
            name="Assets",
            config={"region": "ap-south-1"},
        )
        connection = ServiceConnection(
            id="origin",
            source_id="cdn",
            target_id="bucket",
            requests_per_month=1000,
        )

        detail = calculator._calculate_connection_cost(
            connection, cloudfront, bucket
        )

        self.assertGreater(detail.data_transfer_gb, 0)
        self.assertEqual(detail.transfer_type, "cloudfront_origin_free")
        self.assertEqual(detail.rate_per_gb, 0)
        self.assertEqual(detail.cost, 0)
        calculator._transfer_pricing.get_transfer_rate.assert_not_called()

    def test_direct_s3_egress_remains_billable(self) -> None:
        calculator = object.__new__(ArchitectureCalculator)
        s3_calculator = Mock()
        s3_calculator.calculate.return_value = SimpleNamespace(
            breakdown=SimpleNamespace(
                total_cost=6.5,
                storage_cost=2.0,
                request_cost=0.0,
                transfer_cost=4.5,
            )
        )
        calculator._calculators = {"s3": s3_calculator}
        node = ServiceNode(
            id="bucket",
            service_type="s3",
            name="Assets",
            config={
                "region": "ap-south-1",
                "storage_gb": 100,
                "outbound_transfer_gb": 50,
            },
        )

        calculator._calculate_node_cost(node, include_free_tier=True)

        s3_request = s3_calculator.calculate.call_args.args[0]
        self.assertEqual(s3_request.outbound_transfer_gb, 50)

    def test_archbot_does_not_promise_uncomputed_savings(self) -> None:
        self.assertIn("not a guaranteed amount", CHAT_SYSTEM_PROMPT)
        self.assertIn("AWS-to-CloudFront origin transfer is free", CHAT_SYSTEM_PROMPT)
        self.assertIn("batching multiple distinct invalidation paths", CHAT_SYSTEM_PROMPT)
        self.assertIn("at most three actionable recommendations", CHAT_SYSTEM_PROMPT)


if __name__ == "__main__":
    unittest.main()
