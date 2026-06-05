import { getLLMProviderId } from "@/lib/llm/env";
import { createMockLLMClient } from "@/lib/llm/mockLLMClient";
import { createOpenAILLMClient } from "@/lib/llm/openaiLLMClient";
import type { LLMClient } from "@/lib/llm/types";

/**
 * Central factory — mock by default; OpenAI when LLM_PROVIDER=openai and key is set.
 */
export function createDefaultLLMClient(): LLMClient {
  const provider = getLLMProviderId();

  switch (provider) {
    case "mock":
      return createMockLLMClient();

    case "openai":
      return createOpenAILLMClient();

    case "workers_ai":
      throw new Error(
        "[pm-copilot] Workers AI provider is not wired yet. Implement lib/llm/workersAiLLMClient.ts and register it inside createDefaultLLMClient.",
      );

    default:
      return createMockLLMClient();
  }
}
