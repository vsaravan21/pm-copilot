/**
 * Shared types for pipeline agents. Extend as you add agents.
 */

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

export type IntakeRequestBody = {
  notes: string;
  productName?: string;
  targetUser?: string;
};

/** Alias aligned with product docs (`IntakeOutput`). */
export type IntakeOutput = IntakeAgentOutput;

// —— Synthesis Agent ——

export interface SynthesisAgentInput {
  rawInput: string;
  intakeOutput?: IntakeAgentOutput;
  productName?: string;
  targetUser?: string;
}

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

export interface PrioritizationAgentInput {
  /** Verbatim context when upstream JSON is absent */
  rawInput?: string;
  intakeOutput?: IntakeAgentOutput;
  synthesisOutput?: SynthesisAgentOutput;
  productName?: string;
  targetUser?: string;
}

export interface ScoringDimensions {
  /** 1–5 normalized for mock; real models may calibrate */
  userImpact: number;
  businessValue: number;
  evidenceStrength: number;
  /** Higher means heavier lift */
  implementationEffort: number;
  technicalComplexity: number;
}

export interface RankedOpportunity {
  id: string;
  title: string;
  summary: string;
  scores: ScoringDimensions;
  /** 1 = top */
  compositeRank: number;
  rationale: string;
  tradeoffs: string[];
  assumptions: string[];
  risks: string[];
}

export interface PrioritizationAgentOutput {
  portfolioNarrative: string;
  rankedOpportunities: RankedOpportunity[];
  decisionNotes: string[];
  confidence: number;
}

// —— Spec Writer Agent ——

export interface SpecWriterAgentInput {
  rawInput?: string;
  intakeOutput?: IntakeAgentOutput;
  synthesisOutput?: SynthesisAgentOutput;
  prioritizationOutput?: PrioritizationAgentOutput;
  /** When sharpening a single opportunity from the rank stack */
  focusedOpportunityId?: string;
  productName?: string;
  targetUser?: string;
}

export interface UserStoryDraft {
  title: string;
  description: string;
  acceptanceCriteria: string[];
}

export interface SpecWriterAgentOutput {
  documentTitle: string;
  problemStatement: string;
  goals: string[];
  nonGoals: string[];
  userStories: UserStoryDraft[];
  successMetrics: string[];
  risks: string[];
  openQuestions: string[];
  nextSteps: string[];
  confidence: number;
}

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
  return {
    portfolioNarrative: String(o.portfolioNarrative ?? "").trim(),
    rankedOpportunities: rankedOppArray(o.rankedOpportunities),
    decisionNotes: stringArray(o.decisionNotes),
    confidence: clamp01(Number(o.confidence)),
  };
}

export function coerceSpecWriterOutput(raw: unknown): SpecWriterAgentOutput {
  const o = raw as Record<string, unknown>;
  return {
    documentTitle: String(o.documentTitle ?? "").trim(),
    problemStatement: String(o.problemStatement ?? "").trim(),
    goals: stringArray(o.goals),
    nonGoals: stringArray(o.nonGoals),
    userStories: userStoryArray(o.userStories),
    successMetrics: stringArray(o.successMetrics),
    risks: stringArray(o.risks),
    openQuestions: stringArray(o.openQuestions),
    nextSteps: stringArray(o.nextSteps),
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

function scoreDim(o: unknown): ScoringDimensions {
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
    implementationEffort: n("implementationEffort", 3),
    technicalComplexity: n("technicalComplexity", 3),
  };
}

function rankedOppArray(v: unknown): RankedOpportunity[] {
  if (!Array.isArray(v)) return [];
  const out: RankedOpportunity[] = [];
  let i = 0;
  for (const item of v) {
    const x = item as Record<string, unknown>;
    const title = String(x.title ?? "").trim();
    if (!title) continue;
    i += 1;
    out.push({
      id: typeof x.id === "string" && x.id.trim() ? x.id.trim() : `opp-${i}`,
      title,
      summary: String(x.summary ?? "").trim(),
      scores: scoreDim(x.scores),
      compositeRank: Number.isFinite(Number(x.compositeRank))
        ? Math.max(1, Math.floor(Number(x.compositeRank)))
        : i,
      rationale: String(x.rationale ?? "").trim(),
      tradeoffs: stringArray(x.tradeoffs),
      assumptions: stringArray(x.assumptions),
      risks: stringArray(x.risks),
    });
  }
  return out.slice(0, 20);
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
