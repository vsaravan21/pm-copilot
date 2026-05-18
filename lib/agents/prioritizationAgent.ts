import { parseAssistantJson as parseAssistantJsonUnsafe } from "@/lib/agents/parseAgentJson";
import {
  PRIORITIZATION_SYSTEM_PROMPT,
  buildPrioritizationUserPrompt,
} from "@/lib/prompts";
import { createDefaultLLMClient } from "@/lib/llm/llmClient";
import type { LLMClient } from "@/lib/llm/types";
import {
  coercePrioritizationOutput,
  type PrioritizationAgentInput,
  type PrioritizationAgentOutput,
} from "@/lib/schemas";

function parseAssistantJson(raw: string): unknown {
  try {
    return parseAssistantJsonUnsafe(raw);
  } catch {
    throw new Error("Prioritization Agent returned non-JSON text");
  }
}

export async function runPrioritizationAgent(
  payload: PrioritizationAgentInput,
  deps?: { llm?: LLMClient },
): Promise<PrioritizationAgentOutput> {
  const llm = deps?.llm ?? createDefaultLLMClient();

  const userContent = buildPrioritizationUserPrompt(payload);

  const raw = await llm.complete({
    messages: [
      { role: "system", content: PRIORITIZATION_SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    temperature: 0.2,
    maxTokens: 2600,
  });

  const parsed = parseAssistantJson(raw);
  return coercePrioritizationOutput(parsed);
}
