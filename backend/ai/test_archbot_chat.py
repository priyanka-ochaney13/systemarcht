"""Tests for ArchBot request handling without external API calls."""

import unittest
from unittest.mock import patch

from app.routers.archbot_chat import chat_about_architecture
from ai.chat_schemas import ChatRequest
from ai.chat_prompts import CHAT_SYSTEM_PROMPT


class ArchbotChatRouteTests(unittest.TestCase):
    @patch("app.routers.archbot_chat.get_llm_provider")
    def test_chat_without_an_architecture_is_accepted(self, get_provider) -> None:
        provider = get_provider.return_value
        provider.chat.return_value = "You can start by adding services to your canvas."

        request = ChatRequest(message="How do I get started?")
        response = chat_about_architecture(request)

        self.assertEqual(response.reply, provider.chat.return_value)
        self.assertEqual(response.provider, "groq")
        args, kwargs = provider.chat.call_args
        self.assertEqual(args[0], CHAT_SYSTEM_PROMPT)
        self.assertIn("How do I get started?", args[1])


if __name__ == "__main__":
    unittest.main()
