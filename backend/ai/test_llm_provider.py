"""Tests for the provider-agnostic LLM interface (ArchBot's Groq layer)."""

import os
import unittest

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