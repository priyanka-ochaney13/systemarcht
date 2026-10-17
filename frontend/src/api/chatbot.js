import axios from 'axios';

// NEXT_PUBLIC_API_URL is the server root, e.g. http://localhost:8000
const SERVER = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Runs the deterministic architecture cost calculator.
 *
 * This remains the source of truth for all cost numbers.
 */
export const analyzeArchitectureCost = async (payload) => {
  const url = `${SERVER}/api/architecture/calculate`;
  console.log('[ArchBot] POST', url);

  const response = await axios.post(url, payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  return response.data;
};

/**
 * Sends a conversational question to the ArchBot LLM layer.
 *
 * The backend receives:
 * - the user's question
 * - the current architecture
 * - the already-calculated cost result
 * - previous conversation history
 *
 * The LLM explains/reasons about the supplied data.
 * It does NOT calculate authoritative costs itself.
 */
export const chatAboutArchitecture = async ({
  message,
  architectureSnapshot = null,
  costResult = null,
  history = [],
}) => {
  const url = `${SERVER}/api/ai/chat/architecture`;
  console.log('[ArchBot] POST', url);

  const response = await axios.post(
    url,
    {
      message,
      architecture_snapshot: architectureSnapshot,
      cost_result: costResult,
      history,
    },
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  return response.data;
};
