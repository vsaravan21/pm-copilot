import { getOpenAIConfig } from "@/lib/llm/env";
import type { LLMClient, LLMCompleteOptions } from "@/lib/llm/types";

type OpenAIChatResponse = {
  choices?: Array<{
    message?: { content?: string | null };
  }>;
  error?: { message?: string; type?: string };
};

function supportsJsonObjectMode(model: string): boolean {
  const m = model.toLowerCase();
  return m.includes("gpt-4o") || m.includes("gpt-4-turbo") || m.includes("gpt-3.5-turbo-1106");
}

function mapOpenAIHttpError(status: number, apiMessage?: string): Error {
  if (status === 401) {
    return new Error(
      "[pm-copilot] OpenAI rejected the API key. Check OPENAI_API_KEY in .env.local.",
    );
  }
  if (status === 429) {
    return new Error(
      "[pm-copilot] OpenAI rate limit reached. Wait a moment and retry, or use a smaller model.",
    );
  }
  if (status >= 500) {
    return new Error(
      "[pm-copilot] OpenAI service is temporarily unavailable. Try again shortly.",
    );
  }
  const detail = apiMessage ? ` ${apiMessage}` : "";
  return new Error(`[pm-copilot] OpenAI request failed (${status}).${detail}`);
}

export function createOpenAILLMClient(): LLMClient & { kind: "openai" } {
  const config = getOpenAIConfig();

  return {
    kind: "openai",
    async complete(options: LLMCompleteOptions): Promise<string> {
      const body: Record<string, unknown> = {
        model: config.model,
        messages: options.messages,
        temperature: options.temperature ?? 0.25,
      };

      if (options.maxTokens != null) {
        body.max_tokens = options.maxTokens;
      }

      if (supportsJsonObjectMode(config.model)) {
        body.response_format = { type: "json_object" };
      }

      let response: Response;
      try {
        response = await fetch(`${config.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(120_000),
        });
      } catch (cause) {
        const msg =
          cause instanceof Error && cause.name === "TimeoutError"
            ? "[pm-copilot] OpenAI request timed out. Try again or reduce input size."
            : "[pm-copilot] Could not reach OpenAI. Check your network and OPENAI_BASE_URL.";
        throw new Error(msg);
      }

      let payload: OpenAIChatResponse;
      try {
        payload = (await response.json()) as OpenAIChatResponse;
      } catch {
        throw mapOpenAIHttpError(response.status);
      }

      if (!response.ok) {
        console.error("[pm-copilot] OpenAI error:", response.status, payload.error);
        throw mapOpenAIHttpError(response.status, payload.error?.message);
      }

      const content = payload.choices?.[0]?.message?.content;
      if (typeof content !== "string" || !content.trim()) {
        throw new Error("[pm-copilot] OpenAI returned an empty assistant message.");
      }

      return content;
    },
  };
}
