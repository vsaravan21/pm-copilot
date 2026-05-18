/**
 * Shared JSON extraction for agent responses (LLM or mock).
 */
export function stripCodeFence(text: string): string {
  if (!text.startsWith("```")) return text.trim();
  return text
    .replace(/^```[a-zA-Z0-9]*\s*/m, "")
    .replace(/\s*```$/m, "")
    .trim();
}

export function parseAssistantJson(raw: string): unknown {
  const staged = stripCodeFence(raw.trim());
  try {
    return JSON.parse(staged);
  } catch {
    const start = staged.indexOf("{");
    const end = staged.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(staged.slice(start, end + 1));
    }
    throw new Error("Agent returned non-JSON text");
  }
}
