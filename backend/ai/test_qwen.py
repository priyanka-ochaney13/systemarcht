"""Module 1 tests for retrieval and parsing behavior."""

import json
import os
import unittest

from ai.qwen import _extract_json_payload, generate_architecture
from ai.retrieval import retrieve_relevant_documents
from ai.tools import extract_constraints, infer_scale_hints


class RetrievalTests(unittest.TestCase):
    def test_retrieval_returns_service_relevant_docs(self) -> None:
        docs = retrieve_relevant_documents(
            "Design a bursty photo upload architecture with S3 and Lambda", top_k=2
        )
        self.assertEqual(len(docs), 2)
        joined = " ".join(doc.content.lower() for doc in docs)
        self.assertTrue("s3" in joined or "lambda" in joined)


class ToolHintTests(unittest.TestCase):
    def test_constraint_extraction(self) -> None:
        constraints = extract_constraints(
            "Need architecture under $5000 per month in ap-south-1 region."
        )
        self.assertEqual(constraints["budget_usd"], "5000")
        self.assertEqual(constraints["region"], "ap-south-1")

    def test_scale_hint_extraction(self) -> None:
        hints = infer_scale_hints("Plan for 100,000 users with burst traffic")
        self.assertIn("traffic_profile=bursty", hints)
        self.assertIn("scale=high", hints)


class ParsingTests(unittest.TestCase):
    def test_extract_json_payload_from_wrapped_response(self) -> None:
        payload = {"architecture": {"name": "x", "description": "y", "services": [{"id": "api-1", "type": "api_gateway", "name": "API", "configuration": {}}], "connections": []}, "reasoning": {"pattern": "event", "key_decisions": ["Use API Gateway"]}, "assumptions": [], "confidence": 0.9}
        wrapped = f"Here is the answer:\n{json.dumps(payload)}\nThanks"
        parsed = _extract_json_payload(wrapped)
        self.assertEqual(parsed["confidence"], 0.9)


@unittest.skipUnless(os.getenv("RUN_QWEN_INTEGRATION") == "1", "Set RUN_QWEN_INTEGRATION=1")
class IntegrationTests(unittest.TestCase):
    def test_generate_architecture_with_live_qwen(self) -> None:
        result = generate_architecture("Design a photo sharing app for 100000 users.")
        self.assertGreaterEqual(len(result.architecture.services), 1)


if __name__ == "__main__":
    unittest.main()
