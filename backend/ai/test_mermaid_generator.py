"""Tests for deterministic Mermaid architecture generation."""

import unittest

from ai.mermaid_generator import MermaidGenerationError, generate_mermaid
from ai.schemas import Architecture


def make_architecture(services, connections):
    return Architecture(
        name="Test Architecture",
        description="Test description",
        services=services,
        connections=connections,
        configuration={},
    )


class MermaidGeneratorTests(unittest.TestCase):
    def test_api_lambda_dynamodb(self) -> None:
        architecture = make_architecture(
            [
                {"id": "api-1", "type": "api_gateway", "name": "API Gateway"},
                {"id": "lambda-1", "type": "lambda", "name": "Lambda"},
                {"id": "db-1", "type": "dynamodb", "name": "DynamoDB"},
            ],
            [
                {"source": "api-1", "target": "lambda-1", "type": "request"},
                {"source": "lambda-1", "target": "db-1", "type": "data"},
            ],
        )
        result = generate_mermaid(architecture)
        self.assertTrue(result.startswith("flowchart TD\n"))
        self.assertEqual(result.count(" -->|"), 2)
        self.assertEqual(result.count("[\""), 3)

    def test_s3_lambda(self) -> None:
        architecture = make_architecture(
            [
                {"id": "s3-1", "type": "s3", "name": "Images"},
                {"id": "lambda-1", "type": "lambda", "name": "Processor"},
            ],
            [{"source": "s3-1", "target": "lambda-1", "type": "trigger"}],
        )
        result = generate_mermaid(architecture)
        self.assertIn("s3_1", result)
        self.assertIn("lambda_1", result)
        self.assertEqual(result.count(" -->|"), 1)

    def test_multiple_connections(self) -> None:
        architecture = make_architecture(
            [
                {"id": "api", "type": "api_gateway", "name": "API"},
                {"id": "worker", "type": "lambda", "name": "Worker"},
                {"id": "db", "type": "dynamodb", "name": "Database"},
                {"id": "bucket", "type": "s3", "name": "Bucket"},
            ],
            [
                {"source": "api", "target": "worker", "type": "request"},
                {"source": "worker", "target": "db", "type": "data"},
                {"source": "worker", "target": "bucket", "type": "storage"},
            ],
        )
        self.assertEqual(generate_mermaid(architecture).count(" -->|"), 3)

    def test_special_characters_are_escaped(self) -> None:
        architecture = make_architecture(
            [
                {"id": "service-(one)", "type": "s3", "name": 'Images "raw"'},
                {"id": "service-two", "type": "lambda", "name": "Process (safe)"},
            ],
            [{"source": "service-(one)", "target": "service-two", "type": "storage"}],
        )
        result = generate_mermaid(architecture)
        self.assertIn("service__one_", result)
        self.assertIn("Images &quot;raw&quot;", result)
        self.assertIn("storage", result)

    def test_invalid_architecture_is_rejected(self) -> None:
        architecture = make_architecture(
            [{"id": "graph", "type": "rds", "name": "Database"}],
            [],
        )
        architecture.services[0].type = "Neptune"  # type: ignore[assignment]
        with self.assertRaises(MermaidGenerationError):
            generate_mermaid(architecture)


if __name__ == "__main__":
    unittest.main()
