import { parseAssistantJson as parseAssistantJsonUnsafe } from "@/lib/agents/parseAgentJson";
import {
  SYNTHESIS_SYSTEM_PROMPT,
  buildSynthesisUserPrompt,
} from "@/lib/prompts";
import { createDefaultLLMClient } from "@/lib/llm/llmClient";
import type { LLMClient } from "@/lib/llm/types";
import {
  coerceSynthesisOutput,
  type SynthesisAgentInput,
  type SynthesisAgentOutput,
} from "@/lib/schemas";

function parseAssistantJson(raw: string): unknown {
  try {
    return parseAssistantJsonUnsafe(raw);
  } catch {
    throw new Error("Synthesis Agent returned non-JSON text");
  }
}

export async function runSynthesisAgent(
  payload: SynthesisAgentInput,
  deps?: { llm?: LLMClient },
): Promise<SynthesisAgentOutput> {
  const llm = deps?.llm ?? createDefaultLLMClient();

  const userContent = buildSynthesisUserPrompt(payload);

  const raw = await llm.complete({
    messages: [
      { role: "system", content: SYNTHESIS_SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    temperature: 0.25,
    maxTokens: 2200,
  });

  const parsed = parseAssistantJson(raw);
  return coerceSynthesisOutput(parsed);
}
