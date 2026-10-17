"""Tests for Module 2 structured architecture generation."""

import json
import unittest
from unittest.mock import patch

from ai.architecture_service import ArchitectureGenerationError, generate_architecture


VALID_ARCHITECTURE = {
    "name": "Image Processing System",
    "description": "Serverless image processing architecture",
    "services": [
        {"id": "images", "type": "s3", "name": "Image Storage", "configuration": {}},
        {"id": "processor", "type": "lambda", "name": "Image Processor", "configuration": {}},
    ],
    "connections": [
        {"source": "images", "target": "processor", "type": "trigger"},
    ],
    "configuration": {},
}


class ArchitectureGenerationServiceTests(unittest.TestCase):
    @patch("ai.architecture_service.OllamaService.generate")
    def test_returns_validated_architecture(self, generate) -> None:
        generate.return_value = json.dumps(VALID_ARCHITECTURE)

        result = generate_architecture("Design an image processing system.")

        self.assertEqual(result.name, "Image Processing System")
        self.assertEqual(result.services[0].type, "s3")
        generate.assert_called_once()

    @patch("ai.architecture_service.OllamaService.generate", return_value="not json")
    def test_rejects_invalid_json(self, _generate) -> None:
        with self.assertRaises(ArchitectureGenerationError):
            generate_architecture("Design an image processing system.")

    @patch(
        "ai.architecture_service.OllamaService.generate",
        return_value='{"name": "Missing services", "description": "Invalid"}',
    )
    def test_rejects_invalid_architecture_schema(self, _generate) -> None:
        with self.assertRaises(ArchitectureGenerationError):
            generate_architecture("Design an image processing system.")


if __name__ == "__main__":
    unittest.main()
