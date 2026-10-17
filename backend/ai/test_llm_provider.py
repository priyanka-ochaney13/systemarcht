"""Tests for the provider-agnostic LLM interface (ArchBot's Groq layer)."""

import os
import unittest
from unittest.mock import MagicMock, patch

from ai.llm_provider import GroqProvider, get_llm_provider


class ProviderFactoryTests(unittest.TestCase):
    def test_unknown_provider_raises(self) -> None:
        with self.assertRaises(ValueError):
            get_llm_provider("not-a-real-provider")

    def test_missing_api_key_raises(self) -> None:
        original = os.environ.pop("GROQ_API_KEY", None)
        try:
            with self.assertRaises(RuntimeError):
                GroqProvider()
        finally:
            if original is not None:
                os.environ["GROQ_API_KEY"] = original

    @patch.dict(
        "os.environ",
        {
            "GROQ_API_KEY": "test-key",
            "GROQ_MODEL": "openai/gpt-oss-120b",
            "GROQ_TIMEOUT_SECONDS": "30",
            "LLM_PROVIDER": "groq",
        },
        clear=True,
    )
    @patch("ai.llm_provider.Groq")
    def test_uses_configured_groq_model_and_timeout(self, groq_client) -> None:
        provider = GroqProvider()

        self.assertEqual(provider.model, "openai/gpt-oss-120b")
        self.assertEqual(provider.timeout_seconds, 30)
        groq_client.assert_called_once_with(api_key="test-key", timeout=30)

    @patch.dict("os.environ", {"GROQ_API_KEY": "test-key"}, clear=True)
    @patch("ai.llm_provider.Groq")
    def test_defaults_to_supported_groq_model(self, groq_client) -> None:
        provider = GroqProvider()

        self.assertEqual(provider.model, "openai/gpt-oss-120b")
        groq_client.assert_called_once_with(api_key="test-key", timeout=30)

    @patch.dict("os.environ", {"GROQ_API_KEY": "test-key"}, clear=True)
    @patch("ai.llm_provider.Groq")
    def test_chat_sends_selected_model_and_prompts(self, groq_client) -> None:
        completion = MagicMock()
        completion.choices = [
            MagicMock(message=MagicMock(content="Hello from ArchBot."))
        ]
        client = groq_client.return_value
        client.chat.completions.create.return_value = completion
        provider = GroqProvider()

        reply = provider.chat("system", "user")

        self.assertEqual(reply, "Hello from ArchBot.")
        client.chat.completions.create.assert_called_once_with(
            model="openai/gpt-oss-120b",
            messages=[
                {"role": "system", "content": "system"},
                {"role": "user", "content": "user"},
            ],
            temperature=0.65,
        )

    @patch.dict("os.environ", {"GROQ_API_KEY": "test-key"}, clear=True)
    @patch("ai.llm_provider.Groq")
    def test_model_not_found_error_is_actionable_and_safe(self, groq_client) -> None:
        error = RuntimeError("raw provider response with internal details")
        error.status_code = 404
        error.body = {"error": {"code": "model_not_found"}}
        groq_client.return_value.chat.completions.create.side_effect = error
        provider = GroqProvider()

        with self.assertRaisesRegex(RuntimeError, "GROQ_MODEL=openai/gpt-oss-120b"):
            provider.chat("system", "user")


@unittest.skipUnless(os.getenv("RUN_GROQ_INTEGRATION") == "1", "Set RUN_GROQ_INTEGRATION=1")
class IntegrationTests(unittest.TestCase):
    def test_chat_with_live_groq(self) -> None:
        provider = get_llm_provider("groq")
        reply = provider.chat(
            system_prompt="You are a terse test assistant. Reply with exactly one word.",
            user_prompt="Reply with the word: pong",
        )
        self.assertIsInstance(reply, str)
        self.assertGreater(len(reply.strip()), 0)


if __name__ == "__main__":
    unittest.main()