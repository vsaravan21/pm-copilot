import type { PrioritizationScores } from "@/lib/schemas";

/** Human-readable formula echoed in prompts, mocks, and UI. */
export const PRIORITIZATION_SCORING_MODEL_SUMMARY =
  "priorityScore = (userImpact + businessValue + evidenceStrength + strategicFit + confidence) − (implementationEffort + technicalComplexity + risk). Each dimension is 1–5. Higher impact, value, evidence, fit, and confidence increase priority; higher effort, complexity, and risk decrease it.";

/** Deterministic 0–100 score from dimension scores (1–5 each). */
export function computePriorityScore(scores: PrioritizationScores): number {
  const positive =
    scores.userImpact +
    scores.businessValue +
    scores.evidenceStrength +
    scores.strategicFit +
    scores.confidence;
  const negative =
    scores.implementationEffort + scores.technicalComplexity + scores.risk;
  const raw = positive - negative;
  return Math.min(100, Math.max(0, Math.round(((raw + 15) / 30) * 100)));
}
