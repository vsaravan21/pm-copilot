import type { LLMProviderId } from "@/lib/llm/types";

export function normalizeEnv(value?: string): string | undefined {
  if (!value) return undefined;
  return value.trim().replace(/^["']+|["']+$/g, "");
}

export function getLLMProviderId(): LLMProviderId {
  const raw = normalizeEnv(process.env.LLM_PROVIDER) ?? "mock";
  const lower = raw.toLowerCase();
  if (lower === "openai") return "openai";
  if (lower === "workers_ai" || lower === "workers-ai") return "workers_ai";
  return "mock";
}

/** Non-secret label for UI / health checks. */
export function getLLMProviderLabel(): LLMProviderId {
  return getLLMProviderId();
}

export type OpenAIConfig = {
  apiKey: string;
  model: string;
  baseUrl: string;
};

export function getOpenAIConfig(): OpenAIConfig {
  const apiKey = normalizeEnv(process.env.OPENAI_API_KEY);
  if (!apiKey) {
    throw new Error(
      "[pm-copilot] Set OPENAI_API_KEY in .env.local when LLM_PROVIDER=openai (see .env.example).",
    );
  }

  const model = normalizeEnv(process.env.OPENAI_MODEL) ?? "gpt-4o-mini";
  const baseUrl =
    normalizeEnv(process.env.OPENAI_BASE_URL)?.replace(/\/$/, "") ??
    "https://api.openai.com/v1";

  return { apiKey, model, baseUrl };
}

export function getPublicLLMStatus(): { provider: LLMProviderId; model?: string } {
  const provider = getLLMProviderLabel();
  if (provider === "openai") {
    return {
      provider,
      model: normalizeEnv(process.env.OPENAI_MODEL) ?? "gpt-4o-mini",
    };
  }
  return { provider };
}
