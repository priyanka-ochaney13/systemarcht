"""Tests for deterministic Module 4 architecture validation."""

import unittest

from ai.architecture_validator import validate_architecture


BASE_ARCHITECTURE = {
    "name": "Image Processing",
    "description": "Serverless image processing",
    "services": [
        {"id": "images", "type": "s3", "name": "Image Storage", "configuration": {}},
        {"id": "processor", "type": "lambda", "name": "Processor", "configuration": {}},
    ],
    "connections": [
        {"source": "images", "target": "processor", "type": "trigger"},
    ],
    "configuration": {},
}


def architecture_with(**updates):
    architecture = {
        **BASE_ARCHITECTURE,
        "services": [*BASE_ARCHITECTURE["services"]],
        "connections": [*BASE_ARCHITECTURE["connections"]],
    }
    architecture.update(updates)
    return architecture


class ArchitectureValidatorTests(unittest.TestCase):
    def test_valid_architecture(self) -> None:
        result = validate_architecture(BASE_ARCHITECTURE)
        self.assertTrue(result.valid)
        self.assertEqual(result.errors, [])

    def test_unsupported_service(self) -> None:
        result = validate_architecture(architecture_with(
            services=[{"id": "db", "type": "Neptune", "name": "Graph", "configuration": {}}],
            connections=[],
        ))
        self.assertFalse(result.valid)
        self.assertEqual(result.errors[0].type, "UNSUPPORTED_SERVICE")

    def test_unknown_connection_source(self) -> None:
        result = validate_architecture(architecture_with(
            connections=[{"source": "unknown", "target": "processor", "type": "request"}],
        ))
        self.assertFalse(result.valid)
        self.assertEqual(result.errors[0].type, "UNKNOWN_CONNECTION_SOURCE")

    def test_unknown_connection_target(self) -> None:
        result = validate_architecture(architecture_with(
            connections=[{"source": "images", "target": "unknown", "type": "request"}],
        ))
        self.assertFalse(result.valid)
        self.assertEqual(result.errors[0].type, "UNKNOWN_CONNECTION_TARGET")

    def test_duplicate_service_ids(self) -> None:
        result = validate_architecture(architecture_with(
            services=[
                {"id": "same", "type": "s3", "name": "Images", "configuration": {}},
                {"id": "same", "type": "lambda", "name": "Processor", "configuration": {}},
            ],
            connections=[],
        ))
        self.assertFalse(result.valid)
        self.assertEqual(result.errors[0].type, "DUPLICATE_SERVICE_ID")

    def test_invalid_schema(self) -> None:
        invalid = architecture_with(
            services=[{"type": "s3", "name": "Images", "configuration": {}}],
            connections=[],
        )
        result = validate_architecture(invalid)
        self.assertFalse(result.valid)
        self.assertEqual(result.errors[0].type, "INVALID_SCHEMA")

    def test_unsupported_connection(self) -> None:
        result = validate_architecture(architecture_with(
            services=[
                {"id": "images", "type": "s3", "name": "Images", "configuration": {}},
                {"id": "db", "type": "dynamodb", "name": "Database", "configuration": {}},
            ],
            connections=[{"source": "images", "target": "db", "type": "data"}],
        ))
        self.assertFalse(result.valid)
        self.assertEqual(result.errors[0].type, "UNSUPPORTED_CONNECTION")

    def test_invalid_json(self) -> None:
        result = validate_architecture("not json")
        self.assertFalse(result.valid)
        self.assertEqual(result.errors[0].type, "INVALID_SCHEMA")


if __name__ == "__main__":
    unittest.main()
