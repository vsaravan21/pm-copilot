export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export interface LLMCompleteOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

/**
 * Narrow contract so OpenAI-like and Workers AI backends can swap in later.
 */
export interface LLMClient {
  complete(options: LLMCompleteOptions): Promise<string>;
}

export type LLMProviderId = "mock" | "openai" | "workers_ai";
