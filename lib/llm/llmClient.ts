import { createMockLLMClient } from "@/lib/llm/mockLLMClient";
import type { LLMClient } from "@/lib/llm/types";

function normalizeEnv(value?: string): string | undefined {
  if (!value) return undefined;
  return value.trim().replace(/^["']+|["']+$/g, "");
}

/**
 * Central factory — extend with {@link ../openaiLLMClient} or Workers AI adapters.
 *
 * `@default` Uses deterministic mock semantics when unset or `"mock"`.
 */
export function createDefaultLLMClient(): LLMClient {
  const provider = normalizeEnv(process.env.LLM_PROVIDER) ?? "mock";

  switch (provider.toLowerCase()) {
    case "mock":
      return createMockLLMClient();

    case "openai":
      throw new Error(
        "[pm-copilot] LLM_PROVIDER=openai is not wired yet. Keep mock mode or implement lib/llm/openaiLLMClient.ts and register it here.",
      );

    case "workers_ai":
    case "workers-ai":
      throw new Error(
        "[pm-copilot] Workers AI provider is not wired yet. Implement lib/llm/workersAiLLMClient.ts and register it inside createDefaultLLMClient.",
      );

    default: {
      if (provider !== "") {
        console.warn(
          `[pm-copilot] Unknown LLM_PROVIDER="${provider}". Falling back to mock.`,
        );
      }
      return createMockLLMClient();
    }
  }
}
