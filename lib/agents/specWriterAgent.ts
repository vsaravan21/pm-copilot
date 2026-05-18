import { parseAssistantJson as parseAssistantJsonUnsafe } from "@/lib/agents/parseAgentJson";
import {
  SPEC_WRITER_SYSTEM_PROMPT,
  buildSpecWriterUserPrompt,
} from "@/lib/prompts";
import { createDefaultLLMClient } from "@/lib/llm/llmClient";
import type { LLMClient } from "@/lib/llm/types";
import {
  coerceSpecWriterOutput,
  type SpecWriterAgentInput,
  type SpecWriterAgentOutput,
} from "@/lib/schemas";

function parseAssistantJson(raw: string): unknown {
  try {
    return parseAssistantJsonUnsafe(raw);
  } catch {
    throw new Error("Spec Writer Agent returned non-JSON text");
  }
}

export async function runSpecWriterAgent(
  payload: SpecWriterAgentInput,
  deps?: { llm?: LLMClient },
): Promise<SpecWriterAgentOutput> {
  const llm = deps?.llm ?? createDefaultLLMClient();

  const userContent = buildSpecWriterUserPrompt(payload);

  const raw = await llm.complete({
    messages: [
      { role: "system", content: SPEC_WRITER_SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    temperature: 0.2,
    maxTokens: 2800,
  });

  const parsed = parseAssistantJson(raw);
  return coerceSpecWriterOutput(parsed);
}
