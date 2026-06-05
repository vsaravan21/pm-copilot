/**
 * Shared types for pipeline agents. Extend as you add agents.
 */

import {
  computePriorityScore,
  PRIORITIZATION_SCORING_MODEL_SUMMARY,
} from "@/lib/prioritization/scoring";

export type InputTypeClassification =
  | "user_interview"
  | "feedback"
  | "brainstorm_notes"
  | "meeting_notes"
  | "mixed"
  | "unknown";

export type DetectedPMTask =
  | "discovery_synthesis"
  | "opportunity_discovery"
  | "prioritization"
  | "requirements_drafting"
  | "experiment_design"
  | "strategy"
  | "unknown";

export interface ProductContextSlice {
  productNameProvided?: string | null;
  targetUserProvided?: string | null;
  summary: string;
  userGroupsHinted: string[];
}

export interface IntakeAgentOutput {
  inputType: InputTypeClassification;
  detectedTask: DetectedPMTask;
  productContext: ProductContextSlice;
  keyObservations: string[];
  potentialPainPoints: string[];
  potentialOpportunities: string[];
  missingContextQuestions: string[];
  /** 0–1 overall confidence for this intake pass */
  confidence: number;
  /** Echo of LLM-facing notes snippet for tracing (mock uses short excerpt) */
  sourceExcerptHint?: string;
}

/** Alias aligned with product docs (`IntakeOutput`). */
export type IntakeOutput = IntakeAgentOutput;

/**
 * Shared optional context for every agent. Agents read what they need and ignore
 * irrelevant fields so the same POST shape works standalone and in pipeline mode.
 */
export type BaseAgentInput = {
  rawInput?: string;
  directInput?: string;
  productName?: string;
  targetUser?: string;
  intakeOutput?: IntakeOutput;
  synthesisOutput?: SynthesisAgentOutput;
  prioritizationOutput?: PrioritizationAgentOutput;
  /** Rank id from Prioritization output, when known */
  focusedOpportunityId?: string;
  /** Freeform title, one-liner, or id hint for spec / prioritization focus */
  selectedOpportunity?: string;
};

/** Intake accepts the same text fields as downstream agents, plus legacy `notes`. */
export type IntakeAgentInput = BaseAgentInput & {
  /**
   * Legacy dashboard field — merged with `rawInput` / `directInput` via `resolveIntakePrimaryText`.
   */
  notes?: string;
};

export type IntakeRequestBody = IntakeAgentInput;

// —— Synthesis Agent ——

export type SynthesisAgentInput = BaseAgentInput;

export interface EvidenceRef {
  /** Short verbatim or paraphrased anchor into raw material */
  excerpt: string;
  /** Optional quick confidence hint for mock / UI */
  groundingNote?: string;
}

export interface SynthesisTheme {
  title: string;
  /** What repeats or converges across the material */
  pattern: string;
  evidence: EvidenceRef[];
}

export interface SynthesisUserNeed {
  need: string;
  /** Why a PM should care */
  rationale: string;
  evidence: EvidenceRef[];
}

export interface SynthesisOpportunityInsight {
  title: string;
  /** Non-summary insight — implication for the product */
  insight: string;
  evidence: EvidenceRef[];
}

export interface SynthesisAgentOutput {
  /** One tight paragraph framing the synthesis story */
  executiveSummary: string;
  themes: SynthesisTheme[];
  /** Clustered pain language (not a dump of intake bullets) */
  recurringPainThemes: string[];
  articulatedUserNeeds: SynthesisUserNeed[];
  opportunityInsights: SynthesisOpportunityInsight[];
  crossCuttingRisks: string[];
  remainingUnknowns: string[];
  confidence: number;
}

// —— Prioritization Agent ——

export type PrioritizationAgentInput = BaseAgentInput & {
  /** Adjust decision lens and rerank the same item set */
  rerankInstruction?: string;
};

export type PrioritizationInputType =
  | "opportunity"
  | "solution"
  | "feature"
  | "roadmapItem"
  | "insight"
  | "unknown";

/** Dimension scores (1–5). See `computePriorityScore` in lib/prioritization/scoring.ts. */
export interface PrioritizationScores {
  userImpact: number;
  businessValue: number;
  evidenceStrength: number;
  strategicFit: number;
  confidence: number;
  implementationEffort: number;
  technicalComplexity: number;
  risk: number;
}

/** @deprecated Use PrioritizationScores */
export type ScoringDimensions = PrioritizationScores;

export interface RankedPrioritizationItem {
  id: string;
  /** Final priority order; 1 is highest */
  rank: number;
  /** Calculated from scores — higher is higher priority */
  priorityScore: number;
  inputType: PrioritizationInputType;
  title: string;
  underlyingProblem: string;
  targetUser: string;
  /** When inputType is opportunity or problem-like */
  possibleSolutions: string[];
  /** When inputType is solution, feature, or roadmapItem */
  mappedOpportunity: string | null;
  scores: PrioritizationScores;
  rationale: string;
  tradeoffs: string[];
  assumptions: string[];
  risks: string[];
  missingInformation: string[];
}

/** @deprecated Use RankedPrioritizationItem */
export type RankedOpportunity = RankedPrioritizationItem;

export interface PrioritizationAgentOutput {
  portfolioNarrative: string;
  /** Explicit description of how priorityScore is calculated */
  scoringModelSummary: string;
  rankedItems: RankedPrioritizationItem[];
  /** Portfolio-level missing information, open questions, and discovery gaps */
  decisionNotes: string[];
  recommendedNextStep: string;
  /** Set on rerank — what changed vs the previous ranking */
  changeSummary?: string;
  confidence: number;
}

// —— Spec Writer Agent ——

export type SpecWriterAgentInput = BaseAgentInput & {
  /** Refine the current PRD in place */
  refinementInstruction?: string;
  /** Previous PRD draft when refining */
  specWriterOutput?: SpecWriterAgentOutput;
};

export interface UserStoryDraft {
  title: string;
  description: string;
  acceptanceCriteria: string[];
}

export interface SpecWriterAgentOutput {
  prdTitle: string;
  problemStatement: string;
  targetUsers: string[];
  goals: string[];
  nonGoals: string[];
  proposedSolution: string;
  featureRecommendations: string[];
  userStories: UserStoryDraft[];
  coreRequirements: string[];
  successMetrics: string[];
  launchConsiderations: string[];
  risks: string[];
  openQuestions: string[];
  nextSteps: string[];
  /** Evidence, prioritization rationale, or upstream context cited */
  sourceContext: string[];
  /** Set on refinement — what changed vs the previous PRD */
  revisionSummary?: string;
  confidence: number;
}

/** Doc-aligned names for prior-step JSON. */
export type SynthesisOutput = SynthesisAgentOutput;
export type PrioritizationOutput = PrioritizationAgentOutput;

export type SynthesisRequestBody = SynthesisAgentInput;
export type PrioritizationRequestBody = PrioritizationAgentInput;
export type SpecWriterRequestBody = SpecWriterAgentInput;

export function coerceIntakeOutput(raw: unknown): IntakeAgentOutput {
  const o = raw as Record<string, unknown>;
  const productContextRaw = (o.productContext ?? {}) as Record<string, unknown>;
  const productContext: ProductContextSlice = {
    productNameProvided:
      (productContextRaw.productNameProvided as string | null | undefined) ?? null,
    targetUserProvided:
      (productContextRaw.targetUserProvided as string | null | undefined) ?? null,
    summary: String(productContextRaw.summary ?? "").trim(),
    userGroupsHinted: Array.isArray(productContextRaw.userGroupsHinted)
      ? productContextRaw.userGroupsHinted.map(String)
      : [],
  };

  const inputType =
    normalizeInputType((o.inputType as string | undefined) ?? "unknown");

  const detectedTask =
    normalizeDetectedTask((o.detectedTask as string | undefined) ?? "unknown");

  return {
    inputType,
    detectedTask,
    productContext,
    keyObservations: stringArray(o.keyObservations),
    potentialPainPoints: stringArray(o.potentialPainPoints),
    potentialOpportunities: stringArray(o.potentialOpportunities),
    missingContextQuestions: stringArray(o.missingContextQuestions),
    confidence: clamp01(Number(o.confidence)),
    sourceExcerptHint:
      typeof o.sourceExcerptHint === "string" ? o.sourceExcerptHint : undefined,
  };
}

export function coerceSynthesisOutput(raw: unknown): SynthesisAgentOutput {
  const o = raw as Record<string, unknown>;
  return {
    executiveSummary: String(o.executiveSummary ?? "").trim(),
    themes: themeArray(o.themes),
    recurringPainThemes: stringArray(o.recurringPainThemes),
    articulatedUserNeeds: userNeedArray(o.articulatedUserNeeds),
    opportunityInsights: oppInsightArray(o.opportunityInsights),
    crossCuttingRisks: stringArray(o.crossCuttingRisks),
    remainingUnknowns: stringArray(o.remainingUnknowns),
    confidence: clamp01(Number(o.confidence)),
  };
}

export function coercePrioritizationOutput(raw: unknown): PrioritizationAgentOutput {
  const o = raw as Record<string, unknown>;
  const notes = stringArray(o.decisionNotes);
  const explicitNext = String(o.recommendedNextStep ?? "").trim();
  const rankedRaw =
    o.rankedItems !== undefined ? o.rankedItems : o.rankedOpportunities;
  return {
    portfolioNarrative: String(o.portfolioNarrative ?? "").trim(),
    scoringModelSummary:
      String(o.scoringModelSummary ?? "").trim() ||
      PRIORITIZATION_SCORING_MODEL_SUMMARY,
    rankedItems: rankedItemArray(rankedRaw),
    decisionNotes: notes,
    recommendedNextStep:
      explicitNext ||
      "Validate the top-ranked item with metrics and a thin discovery slice.",
    changeSummary: String(o.changeSummary ?? "").trim() || undefined,
    confidence: clamp01(Number(o.confidence)),
  };
}

export function coerceSpecWriterOutput(raw: unknown): SpecWriterAgentOutput {
  const o = raw as Record<string, unknown>;
  const targetUsers = stringArray(o.targetUsers);
  const legacyTarget = String(o.targetUser ?? "").trim();
  if (!targetUsers.length && legacyTarget) targetUsers.push(legacyTarget);

  return {
    prdTitle: String(o.prdTitle ?? o.documentTitle ?? "Product requirements draft").trim(),
    problemStatement: String(o.problemStatement ?? "").trim(),
    targetUsers,
    goals: stringArray(o.goals),
    nonGoals: stringArray(o.nonGoals),
    proposedSolution: String(o.proposedSolution ?? "").trim(),
    featureRecommendations: stringArray(o.featureRecommendations),
    userStories: userStoryArray(o.userStories),
    coreRequirements: stringArray(o.coreRequirements),
    successMetrics: stringArray(o.successMetrics),
    launchConsiderations: stringArray(o.launchConsiderations),
    risks: stringArray(o.risks),
    openQuestions: stringArray(o.openQuestions),
    nextSteps: stringArray(o.nextSteps),
    sourceContext: stringArray(o.sourceContext),
    revisionSummary: String(o.revisionSummary ?? "").trim() || undefined,
    confidence: clamp01(Number(o.confidence)),
  };
}

function evidenceRefArray(v: unknown): EvidenceRef[] {
  if (!Array.isArray(v)) return [];
  const out: EvidenceRef[] = [];
  for (const item of v) {
    const x = item as Record<string, unknown>;
    const excerpt = String(x.excerpt ?? "").trim();
    if (!excerpt) continue;
    out.push({
      excerpt,
      groundingNote:
        typeof x.groundingNote === "string" ? x.groundingNote : undefined,
    });
  }
  return out;
}

function themeArray(v: unknown): SynthesisTheme[] {
  if (!Array.isArray(v)) return [];
  const out: SynthesisTheme[] = [];
  for (const item of v) {
    const x = item as Record<string, unknown>;
    const title = String(x.title ?? "").trim();
    const pattern = String(x.pattern ?? "").trim();
    if (!title && !pattern) continue;
    out.push({
      title: title || "Theme",
      pattern: pattern || "—",
      evidence: evidenceRefArray(x.evidence),
    });
  }
  return out.slice(0, 12);
}

function userNeedArray(v: unknown): SynthesisUserNeed[] {
  if (!Array.isArray(v)) return [];
  const out: SynthesisUserNeed[] = [];
  for (const item of v) {
    const x = item as Record<string, unknown>;
    const need = String(x.need ?? "").trim();
    if (!need) continue;
    out.push({
      need,
      rationale: String(x.rationale ?? "").trim(),
      evidence: evidenceRefArray(x.evidence),
    });
  }
  return out.slice(0, 16);
}

function oppInsightArray(v: unknown): SynthesisOpportunityInsight[] {
  if (!Array.isArray(v)) return [];
  const out: SynthesisOpportunityInsight[] = [];
  for (const item of v) {
    const x = item as Record<string, unknown>;
    const title = String(x.title ?? "").trim();
    const insight = String(x.insight ?? "").trim();
    if (!title && !insight) continue;
    out.push({
      title: title || "Opportunity",
      insight: insight || "—",
      evidence: evidenceRefArray(x.evidence),
    });
  }
  return out.slice(0, 12);
}

function scoreDim(o: unknown): PrioritizationScores {
  const x = (o ?? {}) as Record<string, unknown>;
  const n = (k: string, d: number) => {
    const v = Number(x[k]);
    if (Number.isNaN(v)) return d;
    return Math.min(5, Math.max(1, Math.round(v)));
  };
  return {
    userImpact: n("userImpact", 3),
    businessValue: n("businessValue", 3),
    evidenceStrength: n("evidenceStrength", 3),
    strategicFit: n("strategicFit", 3),
    confidence: n("confidence", 3),
    implementationEffort: n("implementationEffort", 3),
    technicalComplexity: n("technicalComplexity", 3),
    risk: n("risk", 3),
  };
}

function normalizePrioritizationInputType(v: unknown): PrioritizationInputType {
  const allowed: PrioritizationInputType[] = [
    "opportunity",
    "solution",
    "feature",
    "roadmapItem",
    "insight",
    "unknown",
  ];
  const raw = String(v ?? "unknown").trim().toLowerCase().replace(/[\s_-]+/g, "");
  if (raw === "roadmapitem") return "roadmapItem";
  const key = raw as PrioritizationInputType;
  return allowed.includes(key) ? key : "unknown";
}

function rankedItemArray(v: unknown): RankedPrioritizationItem[] {
  if (!Array.isArray(v)) return [];
  const out: RankedPrioritizationItem[] = [];
  let i = 0;
  for (const item of v) {
    const x = item as Record<string, unknown>;
    const title = String(x.title ?? "").trim();
    if (!title) continue;
    i += 1;
    const scores = scoreDim(x.scores);
    const rank = Number.isFinite(Number(x.rank))
      ? Math.max(1, Math.floor(Number(x.rank)))
      : Number.isFinite(Number(x.compositeRank))
        ? Math.max(1, Math.floor(Number(x.compositeRank)))
        : i;
    const priorityScore = Number.isFinite(Number(x.priorityScore))
      ? Math.min(100, Math.max(0, Math.round(Number(x.priorityScore))))
      : computePriorityScore(scores);
    const inputType = normalizePrioritizationInputType(x.inputType);
    const underlyingProblem = String(
      x.underlyingProblem ?? x.summary ?? "",
    ).trim();
    const mappedRaw = x.mappedOpportunity;
    const mappedOpportunity =
      mappedRaw === null
        ? null
        : typeof mappedRaw === "string" && mappedRaw.trim()
          ? mappedRaw.trim()
          : null;

    out.push({
      id: typeof x.id === "string" && x.id.trim() ? x.id.trim() : `item-${i}`,
      rank,
      priorityScore,
      inputType,
      title,
      underlyingProblem: underlyingProblem || "Needs clarification from PM",
      targetUser: String(x.targetUser ?? "").trim(),
      possibleSolutions: stringArray(x.possibleSolutions),
      mappedOpportunity,
      scores,
      rationale: String(x.rationale ?? "").trim(),
      tradeoffs: stringArray(x.tradeoffs),
      assumptions: stringArray(x.assumptions),
      risks: stringArray(x.risks),
      missingInformation: stringArray(x.missingInformation),
    });
  }
  return out
    .slice(0, 24)
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));
}

function userStoryArray(v: unknown): UserStoryDraft[] {
  if (!Array.isArray(v)) return [];
  const out: UserStoryDraft[] = [];
  for (const item of v) {
    const x = item as Record<string, unknown>;
    const title = String(x.title ?? "").trim();
    if (!title) continue;
    out.push({
      title,
      description: String(x.description ?? "").trim(),
      acceptanceCriteria: stringArray(x.acceptanceCriteria),
    });
  }
  return out.slice(0, 24);
}

function stringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map(String).filter((s) => s.trim().length > 0);
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0.5;
  return Math.min(1, Math.max(0, n));
}

function normalizeInputType(v: string): InputTypeClassification {
  const allowed: InputTypeClassification[] = [
    "user_interview",
    "feedback",
    "brainstorm_notes",
    "meeting_notes",
    "mixed",
    "unknown",
  ];
  const key = String(v).toLowerCase().replace(/\s+/g, "_") as InputTypeClassification;
  return allowed.includes(key) ? key : "mixed";
}

function normalizeDetectedTask(v: string): DetectedPMTask {
  const allowed: DetectedPMTask[] = [
    "discovery_synthesis",
    "opportunity_discovery",
    "prioritization",
    "requirements_drafting",
    "experiment_design",
    "strategy",
    "unknown",
  ];
  const key = String(v).toLowerCase().replace(/\s+/g, "_") as DetectedPMTask;
  return allowed.includes(key) ? key : "unknown";
}
