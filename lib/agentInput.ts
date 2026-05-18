import type { BaseAgentInput, IntakeAgentInput } from "@/lib/schemas";

/**
 * Primary text for Intake: legacy `notes`, then explicit standalone fields.
 * See `mergePrimaryMaterial` for downstream agents (different precedence).
 */
export function resolveIntakePrimaryText(input: IntakeAgentInput): string {
  const notes = input.notes?.trim() ?? "";
  const direct = input.directInput?.trim() ?? "";
  const raw = input.rawInput?.trim() ?? "";
  return notes || direct || raw;
}

/**
 * Standalone paste: `directInput` wins when the user is focused on a single field;
 * otherwise `rawInput` (or legacy `notes` on non-intake payloads).
 */
export function mergePrimaryMaterial(
  input: BaseAgentInput & { notes?: string },
): string {
  const direct = input.directInput?.trim() ?? "";
  const raw = input.rawInput?.trim() ?? "";
  const notes = input.notes?.trim() ?? "";

  if (direct && raw && direct !== raw) {
    return `--- directInput ---\n${direct}\n\n--- rawInput ---\n${raw}`;
  }
  return direct || raw || notes;
}
