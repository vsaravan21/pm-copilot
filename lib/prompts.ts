/**
 * Prompts for LLM-backed agents. Used when switching from mock to a real provider.
 */

import type {
  DetectedPMTask,
  InputTypeClassification,
  PrioritizationAgentInput,
  SpecWriterAgentInput,
  SynthesisAgentInput,
} from "@/lib/schemas";

export const INTAKE_SYSTEM_PROMPT = `You are the Intake Agent for PM Copilot, a disciplined product assistant.
Read messy PM inputs (interviews, notes, feedback). Your job:

1. Classify the input type (${JSON.stringify([
    "user_interview",
    "feedback",
    "brainstorm_notes",
    "meeting_notes",
    "mixed",
    "unknown"] as InputTypeClassification[])} — pick the best fit).
2. Infer the likely PM task (${JSON.stringify([
    "discovery_synthesis",
    "opportunity_discovery",
    "prioritization",
    "requirements_drafting",
    "experiment_design",
    "strategy",
    "unknown"] as DetectedPMTask[])} — best fit).
3. Summarize product context in plain language using what is explicit plus light, labeled inference.
4. List key factual observations grounded in the text (short bullets).
5. List potential customer pain points (hypotheses, clearly phrased as such if not explicit).
6. List potential opportunities (ideas or problems worth solving).
7. List concise questions for missing context the PM should clarify next.
8. Provide confidence in [0,1] reflecting how actionable and clear the intake is given sparseness.

Respond with ONE JSON object only (no prose, no markdown fences) matching this shape exactly:
{
  "inputType": string,
  "detectedTask": string,
  "productContext": {
    "productNameProvided": string | null,
    "targetUserProvided": string | null,
    "summary": string,
    "userGroupsHinted": string[]
  },
  "keyObservations": string[],
  "potentialPainPoints": string[],
  "potentialOpportunities": string[],
  "missingContextQuestions": string[],
  "confidence": number,
  "sourceExcerptHint": string | null
}`;

export function buildIntakeUserPrompt(params: {
  notes: string;
  productName?: string;
  targetUser?: string;
}): string {
  const chunks: string[] = [];
  if (params.productName?.trim())
    chunks.push(`Product name (from user): ${params.productName.trim()}`);
  if (params.targetUser?.trim())
    chunks.push(`Target user (from user): ${params.targetUser.trim()}`);
  chunks.push("Raw messy notes follow between <notes> markers.");
  chunks.push("<notes>");
  chunks.push(params.notes.trim());
  chunks.push("</notes>");
  return chunks.join("\n");
}

// —— Synthesis Agent (marker: "You are the Synthesis Agent for PM Copilot") ——

export const SYNTHESIS_SYSTEM_PROMPT = `You are the Synthesis Agent for PM Copilot.
You synthesize messy product material plus structured intake into PM-grade insight—not a summary.
Identify recurring themes, articulate user needs with rationale, surface opportunity-level insights with evidence anchors, and flag risks and unknowns.

Respond with ONE JSON object only (no prose, no markdown fences):
{
  "executiveSummary": string,
  "themes": [{ "title": string, "pattern": string, "evidence": [{ "excerpt": string, "groundingNote"?: string }] }],
  "recurringPainThemes": string[],
  "articulatedUserNeeds": [{ "need": string, "rationale": string, "evidence": [{ "excerpt": string }] }],
  "opportunityInsights": [{ "title": string, "insight": string, "evidence": [{ "excerpt": string }] }],
  "crossCuttingRisks": string[],
  "remainingUnknowns": string[],
  "confidence": number
}`;

export function buildSynthesisUserPrompt(input: SynthesisAgentInput): string {
  const lines: string[] = [];
  lines.push("=== RAW_INPUT ===");
  lines.push(input.rawInput.trim());
  lines.push("");
  if (input.productName?.trim()) lines.push(`Product (user): ${input.productName.trim()}`);
  if (input.targetUser?.trim()) lines.push(`Target user (user): ${input.targetUser.trim()}`);
  if (input.intakeOutput) {
    lines.push("");
    lines.push("=== INTAKE_OUTPUT_JSON ===");
    lines.push(JSON.stringify(input.intakeOutput));
  }
  return lines.join("\n");
}

// —— Prioritization Agent ——

export const PRIORITIZATION_SYSTEM_PROMPT = `You are the Prioritization Agent for PM Copilot.
Rank and compare opportunities using impact, business value, evidence strength, implementation effort, and technical complexity.
Be explicit about tradeoffs, assumptions, and risks—no vanity rankings.

Respond with ONE JSON object only (no prose, no markdown fences):
{
  "portfolioNarrative": string,
  "rankedOpportunities": [{
    "id": string,
    "title": string,
    "summary": string,
    "scores": {
      "userImpact": number,
      "businessValue": number,
      "evidenceStrength": number,
      "implementationEffort": number,
      "technicalComplexity": number
    },
    "compositeRank": number,
    "rationale": string,
    "tradeoffs": string[],
    "assumptions": string[],
    "risks": string[]
  }],
  "decisionNotes": string[],
  "confidence": number
}`;

export function buildPrioritizationUserPrompt(input: PrioritizationAgentInput): string {
  const lines: string[] = [];
  if (input.rawInput?.trim()) {
    lines.push("=== RAW_INPUT ===");
    lines.push(input.rawInput.trim());
    lines.push("");
  }
  if (input.productName?.trim()) lines.push(`Product (user): ${input.productName.trim()}`);
  if (input.targetUser?.trim()) lines.push(`Target user (user): ${input.targetUser.trim()}`);
  if (input.intakeOutput) {
    lines.push("");
    lines.push("=== INTAKE_OUTPUT_JSON ===");
    lines.push(JSON.stringify(input.intakeOutput));
  }
  if (input.synthesisOutput) {
    lines.push("");
    lines.push("=== SYNTHESIS_OUTPUT_JSON ===");
    lines.push(JSON.stringify(input.synthesisOutput));
  }
  if (!lines.length) {
    lines.push("(No structured upstream JSON provided—infer cautiously from any future context.)");
  }
  return lines.join("\n");
}

// —— Spec Writer Agent ——

export const SPEC_WRITER_SYSTEM_PROMPT = `You are the Spec Writer Agent for PM Copilot.
Translate prioritized product thinking into a structured PRD-style artifact: goals, scope boundaries, user stories, success metrics, risks, open questions, and next steps.

Respond with ONE JSON object only (no prose, no markdown fences):
{
  "documentTitle": string,
  "problemStatement": string,
  "goals": string[],
  "nonGoals": string[],
  "userStories": [{ "title": string, "description": string, "acceptanceCriteria": string[] }],
  "successMetrics": string[],
  "risks": string[],
  "openQuestions": string[],
  "nextSteps": string[],
  "confidence": number
}`;

export function buildSpecWriterUserPrompt(input: SpecWriterAgentInput): string {
  const lines: string[] = [];
  if (input.productName?.trim()) lines.push(`Product (user): ${input.productName.trim()}`);
  if (input.targetUser?.trim()) lines.push(`Target user (user): ${input.targetUser.trim()}`);
  if (input.focusedOpportunityId?.trim()) {
    lines.push(`Focused opportunity id: ${input.focusedOpportunityId.trim()}`);
  }
  if (input.rawInput?.trim()) {
    lines.push("");
    lines.push("=== RAW_INPUT ===");
    lines.push(input.rawInput.trim());
  }
  if (input.intakeOutput) {
    lines.push("");
    lines.push("=== INTAKE_OUTPUT_JSON ===");
    lines.push(JSON.stringify(input.intakeOutput));
  }
  if (input.synthesisOutput) {
    lines.push("");
    lines.push("=== SYNTHESIS_OUTPUT_JSON ===");
    lines.push(JSON.stringify(input.synthesisOutput));
  }
  if (input.prioritizationOutput) {
    lines.push("");
    lines.push("=== PRIORITIZATION_OUTPUT_JSON ===");
    lines.push(JSON.stringify(input.prioritizationOutput));
  }
  return lines.join("\n") || "(Awaiting upstream JSON context.)";
}
