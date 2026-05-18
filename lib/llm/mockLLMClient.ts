import { routeMockAgentJson } from "@/lib/llm/mockAgentRouter";
import type { LLMClient, LLMCompleteOptions } from "@/lib/llm/types";

// Re-export for tests or tooling that parse intake-shaped prompts
export { extractNotesBlock, mockIntakeFromMessages } from "@/lib/llm/intakeMock";

/**
 * Lightweight LLM shim: returns JSON formatted like a model call for testing without keys.
 * Routes by system-prompt agent identity (intake vs downstream agents).
 */
export function createMockLLMClient(): LLMClient & { kind: "mock" } {
  return {
    kind: "mock",
    async complete(options: LLMCompleteOptions): Promise<string> {
      void options.temperature;
      void options.maxTokens;
      return routeMockAgentJson(options);
    },
  };
}
