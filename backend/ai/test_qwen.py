"""Module 1 tests for retrieval and parsing behavior."""

import json
import os
import unittest

from pydantic import ValidationError

from ai.qwen import _extract_json_payload, generate_architecture
from ai.prompts import ARCHITECTURE_GENERATION_SYSTEM_PROMPT, build_generation_prompt
from ai.retrieval import retrieve_relevant_documents
from ai.schemas import ArchitectureGenerationResponse, architecture_json_schema
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

    def test_generation_prompt_contains_required_structured_sections(self) -> None:
        prompt = build_generation_prompt("Build a photo-sharing app.", "Use S3 for image storage.")
        self.assertIn("USER REQUIREMENT", prompt)
        self.assertIn("RETRIEVED KNOWLEDGE", prompt)
        self.assertIn("ARCHITECTURE JSON SCHEMA", prompt)
        self.assertIn('"$defs"', prompt)
        self.assertIn("Every service must have a unique ID", ARCHITECTURE_GENERATION_SYSTEM_PROMPT)


class ParsingTests(unittest.TestCase):
    def test_extract_json_payload_from_wrapped_response(self) -> None:
        payload = {"architecture": {"name": "x", "description": "y", "services": [{"id": "api-1", "type": "api_gateway", "name": "API", "configuration": {}}], "connections": []}, "reasoning": {"pattern": "event", "key_decisions": ["Use API Gateway"]}, "assumptions": [], "confidence": 0.9}
        wrapped = f"Here is the answer:\n{json.dumps(payload)}\nThanks"
        parsed = _extract_json_payload(wrapped)
        self.assertEqual(parsed["confidence"], 0.9)

    def test_structured_response_rejects_dangling_connections(self) -> None:
        payload = {
            "architecture": {
                "name": "Image Processing",
                "description": "Serverless",
                "services": [{"id": "images", "type": "s3", "name": "Images"}],
                "connections": [{"source": "images", "target": "processor", "type": "trigger"}],
            },
        }
        with self.assertRaises(ValidationError):
            ArchitectureGenerationResponse.model_validate(payload)

    def test_structured_response_rejects_duplicate_service_ids(self) -> None:
        payload = {
            "architecture": {
                "name": "Duplicate Services",
                "description": "Invalid architecture",
                "services": [
                    {"id": "service-1", "type": "s3", "name": "Images"},
                    {"id": "service-1", "type": "lambda", "name": "Processor"},
                ],
            },
        }
        with self.assertRaises(ValidationError):
            ArchitectureGenerationResponse.model_validate(payload)

    def test_architecture_json_schema_comes_from_pydantic_models(self) -> None:
        schema = architecture_json_schema()
        self.assertEqual(schema["title"], "Architecture")
        self.assertIn("$defs", schema)
        self.assertEqual(
            set(schema["required"]),
            {"name", "description", "services"},
        )
        self.assertEqual(
            set(schema["$defs"]["Service"]["required"]),
            {"id", "type", "name"},
        )
        self.assertEqual(
            set(schema["$defs"]["Connection"]["required"]),
            {"source", "target", "type"},
        )


@unittest.skipUnless(os.getenv("RUN_QWEN_INTEGRATION") == "1", "Set RUN_QWEN_INTEGRATION=1")
class IntegrationTests(unittest.TestCase):
    def test_generate_architecture_with_live_qwen(self) -> None:
        result = generate_architecture("Design a photo sharing app for 100000 users.")
        self.assertGreaterEqual(len(result.architecture.services), 1)


if __name__ == "__main__":
    unittest.main()
