"""Focused tests for the isolated Module 1 chat pipeline."""

import unittest
from unittest.mock import patch

from ai.chat_knowledge import retrieve
from ai.chat_prompts import SYSTEM_PROMPT, build_chat_prompt
from ai.ollama_service import OllamaService


class ChatRetrievalTests(unittest.TestCase):
    def test_required_queries_retrieve_expected_knowledge(self) -> None:
        cases = {
            "Which AWS service should I use for object storage?": "S3",
            "Design a photo sharing architecture using the services supported by SystemArcht.": "photo sharing",
            "When should I use Lambda instead of EC2?": "Lambda",
            "How can I prevent overbooking in a booking system?": "conditional writes",
        }
        for query, expected in cases.items():
            content = " ".join(chunk.content for chunk in retrieve(query))
            self.assertIn(expected.lower(), content.lower(), query)

    def test_prompt_sets_unsupported_service_boundary(self) -> None:
        prompt = build_chat_prompt("Design something using AWS Neptune.", "No Neptune guidance.")
        self.assertIn("Neptune", SYSTEM_PROMPT)
        self.assertIn("Neptune", prompt)


class OllamaConfigurationTests(unittest.TestCase):
    @patch.dict("os.environ", {"OLLAMA_BASE_URL": "http://example:11434"}, clear=True)
    def test_defaults_target_qwen_17b(self) -> None:
        service = OllamaService()
        self.assertEqual(service.model, "qwen3:1.7b")
        self.assertEqual(service.base_url, "http://example:11434")


if __name__ == "__main__":
    unittest.main()
