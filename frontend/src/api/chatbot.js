import { apiClient } from '@/api/client';

/**
 * Runs the deterministic architecture cost calculator.
 *
 * This remains the source of truth for all cost numbers.
 */
export const analyzeArchitectureCost = async (payload) => {
  const response = await apiClient.post('/architecture/calculate', payload);
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
  const response = await apiClient.post('/ai/chat/architecture', {
    message,
    architecture_snapshot: architectureSnapshot,
    cost_result: costResult,
    history,
  });
  return response.data;
};
