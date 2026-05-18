import { parseAssistantJson as parseAssistantJsonUnsafe } from "@/lib/agents/parseAgentJson";
import { INTAKE_SYSTEM_PROMPT, buildIntakeUserPrompt } from "@/lib/prompts";
import type { LLMClient } from "@/lib/llm/types";
import {
  coerceIntakeOutput,
  type IntakeAgentOutput,
  type IntakeRequestBody,
} from "@/lib/schemas";
import { createDefaultLLMClient } from "@/lib/llm/llmClient";

function parseAssistantJson(raw: string): unknown {
  try {
    return parseAssistantJsonUnsafe(raw);
  } catch {
    throw new Error("Intake Agent returned non-JSON text");
  }
}

export async function runIntakeAgent(
  payload: IntakeRequestBody,
  deps?: { llm?: LLMClient },
): Promise<IntakeAgentOutput> {
  const llm = deps?.llm ?? createDefaultLLMClient();

  const userContent = buildIntakeUserPrompt(payload);

  const raw = await llm.complete({
    messages: [
      { role: "system", content: INTAKE_SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    temperature: 0.25,
    maxTokens: 1200,
  });

  const parsed = parseAssistantJson(raw);
  return coerceIntakeOutput(parsed);
}
