import {
  mockPrioritizationFromUserContent,
  mockSpecWriterFromUserContent,
  mockSynthesisFromUserContent,
} from "@/lib/llm/downstreamMocks";
import { mockIntakeFromMessages } from "@/lib/llm/intakeMock";
import type { LLMCompleteOptions } from "@/lib/llm/types";

function systemPrompt(messages: { role: string; content: string }[]): string {
  const sys = messages.find((m) => m.role === "system");
  return sys?.content ?? "";
}

function lastUserContent(messages: { role: string; content: string }[]): string {
  const u = [...messages].reverse().find((m) => m.role === "user");
  return u?.content ?? "";
}

export function routeMockAgentJson(options: LLMCompleteOptions): string {
  const system = systemPrompt(options.messages);
  const user = lastUserContent(options.messages);

  if (system.includes("Spec Writer Agent for PM Copilot")) {
    return JSON.stringify(mockSpecWriterFromUserContent(user));
  }
  if (system.includes("Prioritization Agent for PM Copilot")) {
    return JSON.stringify(mockPrioritizationFromUserContent(user));
  }
  if (system.includes("Synthesis Agent for PM Copilot")) {
    return JSON.stringify(mockSynthesisFromUserContent(user));
  }

  return JSON.stringify(mockIntakeFromMessages(options.messages));
}
