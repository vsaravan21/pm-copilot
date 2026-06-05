import type {
  BaseAgentInput,
  IntakeAgentInput,
  PrioritizationAgentInput,
  SpecWriterAgentInput,
} from "@/lib/schemas";
import {
  coerceIntakeOutput,
  coercePrioritizationOutput,
  coerceSpecWriterOutput,
  coerceSynthesisOutput,
  type IntakeAgentOutput,
  type PrioritizationAgentOutput,
  type SpecWriterAgentOutput,
  type SynthesisAgentOutput,
} from "@/lib/schemas";

export function baseFieldsFromUnknown(
  typed: Record<string, unknown>,
): Pick<
  BaseAgentInput,
  | "rawInput"
  | "directInput"
  | "productName"
  | "targetUser"
  | "focusedOpportunityId"
  | "selectedOpportunity"
> {
  return {
    rawInput:
      typeof typed.rawInput === "string" ? typed.rawInput.trim() || undefined : undefined,
    directInput:
      typeof typed.directInput === "string" ? typed.directInput.trim() || undefined : undefined,
    productName:
      typeof typed.productName === "string" ? typed.productName.trim() || undefined : undefined,
    targetUser:
      typeof typed.targetUser === "string" ? typed.targetUser.trim() || undefined : undefined,
    focusedOpportunityId:
      typeof typed.focusedOpportunityId === "string"
        ? typed.focusedOpportunityId.trim() || undefined
        : undefined,
    selectedOpportunity:
      typeof typed.selectedOpportunity === "string"
        ? typed.selectedOpportunity.trim() || undefined
        : undefined,
  };
}

export function optionalNotes(typed: Record<string, unknown>): string | undefined {
  return typeof typed.notes === "string" ? typed.notes.trim() || undefined : undefined;
}

export function optionalIntakeOutput(
  typed: Record<string, unknown>,
): IntakeAgentOutput | undefined {
  if (typed.intakeOutput === undefined || typed.intakeOutput === null) return undefined;
  return coerceIntakeOutput(typed.intakeOutput);
}

export function optionalSynthesisOutput(
  typed: Record<string, unknown>,
): SynthesisAgentOutput | undefined {
  if (typed.synthesisOutput === undefined || typed.synthesisOutput === null) return undefined;
  return coerceSynthesisOutput(typed.synthesisOutput);
}

export function optionalPrioritizationOutput(
  typed: Record<string, unknown>,
): PrioritizationAgentOutput | undefined {
  if (typed.prioritizationOutput === undefined || typed.prioritizationOutput === null)
    return undefined;
  return coercePrioritizationOutput(typed.prioritizationOutput);
}

/** Full Intake POST body including legacy `notes`. */
export function parseIntakeAgentInput(typed: Record<string, unknown>): IntakeAgentInput {
  return {
    ...baseFieldsFromUnknown(typed),
    notes: optionalNotes(typed),
  };
}

export function parseSynthesisAgentInput(typed: Record<string, unknown>): BaseAgentInput {
  return {
    ...baseFieldsFromUnknown(typed),
    intakeOutput: optionalIntakeOutput(typed),
  };
}

function optionalRerankInstruction(typed: Record<string, unknown>): string | undefined {
  return typeof typed.rerankInstruction === "string"
    ? typed.rerankInstruction.trim() || undefined
    : undefined;
}

function optionalRefinementInstruction(typed: Record<string, unknown>): string | undefined {
  return typeof typed.refinementInstruction === "string"
    ? typed.refinementInstruction.trim() || undefined
    : undefined;
}

function optionalSpecWriterOutput(
  typed: Record<string, unknown>,
): SpecWriterAgentOutput | undefined {
  if (typed.specWriterOutput === undefined || typed.specWriterOutput === null) return undefined;
  return coerceSpecWriterOutput(typed.specWriterOutput);
}

export function parsePrioritizationAgentInput(
  typed: Record<string, unknown>,
): PrioritizationAgentInput {
  return {
    ...baseFieldsFromUnknown(typed),
    intakeOutput: optionalIntakeOutput(typed),
    synthesisOutput: optionalSynthesisOutput(typed),
    prioritizationOutput: optionalPrioritizationOutput(typed),
    rerankInstruction: optionalRerankInstruction(typed),
  };
}

export function parseSpecWriterAgentInput(typed: Record<string, unknown>): SpecWriterAgentInput {
  return {
    ...baseFieldsFromUnknown(typed),
    intakeOutput: optionalIntakeOutput(typed),
    synthesisOutput: optionalSynthesisOutput(typed),
    prioritizationOutput: optionalPrioritizationOutput(typed),
    specWriterOutput: optionalSpecWriterOutput(typed),
    refinementInstruction: optionalRefinementInstruction(typed),
  };
}
