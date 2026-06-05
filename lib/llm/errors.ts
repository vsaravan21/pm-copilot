export type AgentHttpError = {
  message: string;
  status: number;
};

export function toAgentHttpError(error: unknown, fallbackLabel: string): AgentHttpError {
  const message =
    error instanceof Error ? error.message : `${fallbackLabel} failed unexpectedly`;

  if (
    message.includes("OPENAI_API_KEY") ||
    message.includes("rejected the API key") ||
    message.includes("LLM_PROVIDER=openai is not wired")
  ) {
    return { message, status: 400 };
  }

  if (
    message.includes("rate limit") ||
    message.includes("temporarily unavailable") ||
    message.includes("Could not reach OpenAI") ||
    message.includes("timed out")
  ) {
    return { message, status: 502 };
  }

  if (message.includes("non-JSON") || message.includes("returned non-JSON")) {
    return { message, status: 502 };
  }

  return { message, status: 500 };
}
