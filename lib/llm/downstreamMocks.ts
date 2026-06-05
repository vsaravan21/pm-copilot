import {
  computePriorityScore,
  PRIORITIZATION_SCORING_MODEL_SUMMARY,
} from "@/lib/prioritization/scoring";
import {
  coerceIntakeOutput,
  coercePrioritizationOutput,
  coerceSpecWriterOutput,
  coerceSynthesisOutput,
  type EvidenceRef,
  type IntakeAgentOutput,
  type PrioritizationAgentOutput,
  type PrioritizationInputType,
  type PrioritizationScores,
  type RankedPrioritizationItem,
  type SpecWriterAgentOutput,
  type SynthesisAgentOutput,
  type SynthesisTheme,
} from "@/lib/schemas";

function extractBlock(content: string, name: string): string | undefined {
  const startTag = `=== ${name} ===`;
  const start = content.indexOf(startTag);
  if (start === -1) return undefined;
  let pos = start + startTag.length;
  while (content[pos] === "\n" || content[pos] === "\r") pos += 1;
  const rest = content.slice(pos);
  const nextMatch = rest.search(/\n===\s/);
  const body = nextMatch === -1 ? rest.trim() : rest.slice(0, nextMatch).trim();
  return body || undefined;
}

function tryParseIntakeJson(json: string | undefined): IntakeAgentOutput | undefined {
  if (!json?.trim()) return undefined;
  try {
    return coerceIntakeOutput(JSON.parse(json));
  } catch {
    return undefined;
  }
}

function tryParseSynthesisJson(json: string | undefined): SynthesisAgentOutput | undefined {
  if (!json?.trim()) return undefined;
  try {
    return coerceSynthesisOutput(JSON.parse(json));
  } catch {
    return undefined;
  }
}

function tryParsePrioritizationJson(
  json: string | undefined,
): PrioritizationAgentOutput | undefined {
  if (!json?.trim()) return undefined;
  try {
    return coercePrioritizationOutput(JSON.parse(json));
  } catch {
    return undefined;
  }
}

function tryParseSpecWriterJson(json: string | undefined): SpecWriterAgentOutput | undefined {
  if (!json?.trim()) return undefined;
  try {
    return coerceSpecWriterOutput(JSON.parse(json));
  } catch {
    return undefined;
  }
}

function clampScore(n: number): number {
  return Math.min(5, Math.max(1, Math.round(n)));
}

function applyRerankLens(scores: PrioritizationScores, instruction: string): PrioritizationScores {
  const i = instruction.toLowerCase();
  const s = { ...scores };
  if (/fastest mvp|mvp|lowest.*effort|ship fast/i.test(i)) {
    s.implementationEffort = clampScore(s.implementationEffort - 1);
    s.technicalComplexity = clampScore(s.technicalComplexity - 1);
    s.strategicFit = clampScore(s.strategicFit + 1);
  }
  if (/user impact|student/i.test(i)) s.userImpact = clampScore(s.userImpact + 1);
  if (/technical complexity|lowest.*complex/i.test(i)) {
    s.technicalComplexity = clampScore(s.technicalComplexity - 1);
  }
  if (/evidence|strongest evidence/i.test(i)) {
    s.evidenceStrength = clampScore(s.evidenceStrength + 1);
    s.confidence = clampScore(s.confidence + 1);
  }
  if (/business value|org leader|leader value/i.test(i)) {
    s.businessValue = clampScore(s.businessValue + 1);
  }
  if (/executive|roadmap pitch/i.test(i)) {
    s.strategicFit = clampScore(s.strategicFit + 1);
    s.businessValue = clampScore(s.businessValue + 1);
  }
  if (/penalize.*risk|risk more/i.test(i)) s.risk = clampScore(s.risk + 1);
  return s;
}

function mockRerankPrioritization(
  previous: PrioritizationAgentOutput,
  instruction: string,
): PrioritizationAgentOutput {
  const oldTop = previous.rankedItems.find((r) => r.rank === 1);
  const reranked = [...previous.rankedItems]
    .map((item) => {
      const scores = applyRerankLens(item.scores, instruction);
      const priorityScore = computePriorityScore(scores);
      return {
        ...item,
        scores,
        priorityScore,
        rationale: `Re-ranked under lens “${instruction.slice(0, 100)}”: priorityScore ${priorityScore} after adjusting criteria—not a new item set.`,
        tradeoffs: [
          item.tradeoffs[0] ?? "Tradeoffs shift when the decision lens changes.",
          `Lens applied: ${instruction.slice(0, 90)}`,
        ],
        assumptions: [
          item.assumptions[0] ?? "Prior evidence still directionally valid.",
          `Temporarily weighting: ${instruction.slice(0, 80)}`,
        ],
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));

  const newTop = reranked[0];
  const changeSummary =
    oldTop && newTop && oldTop.id !== newTop.id
      ? `“${newTop.title}” is now #1 (was #${oldTop.rank} for “${oldTop.title}”) after applying: ${instruction.slice(0, 120)}. Same items, re-weighted scores.`
      : `Order updated under “${instruction.slice(0, 120)}” while keeping the same portfolio items; rationale and scores reflect the new lens.`;

  return coercePrioritizationOutput({
    ...previous,
    rankedItems: reranked,
    portfolioNarrative: `${previous.portfolioNarrative.slice(0, 240)} [Reranked: ${instruction.slice(0, 80)}]`,
    recommendedNextStep: `Advance #1 (“${newTop?.title ?? "top item"}”) given the ${instruction.slice(0, 60)} lens; confirm tradeoffs with stakeholders.`,
    changeSummary,
    confidence: clamp01(Math.min(0.95, previous.confidence + 0.04)),
  });
}

function mockRefineSpecWriter(
  previous: SpecWriterAgentOutput,
  instruction: string,
): SpecWriterAgentOutput {
  const i = instruction.toLowerCase();
  const next: SpecWriterAgentOutput = { ...previous };
  const notes: string[] = [];

  if (/concise|shorter/i.test(i)) {
    next.problemStatement = `${previous.problemStatement.slice(0, 320)}`.trim();
    next.goals = previous.goals.slice(0, 3);
    notes.push("tightened narrative length");
  }
  if (/mvp|narrow scope/i.test(i)) {
    next.nonGoals = [
      ...previous.nonGoals,
      "Deferred: secondary personas, polish-heavy edge cases, and non-critical integrations.",
    ];
    next.userStories = previous.userStories.slice(0, 1);
    notes.push("narrowed MVP scope");
  }
  if (/success metric|stronger metric/i.test(i)) {
    next.successMetrics = [
      ...previous.successMetrics,
      "Leading indicator: weekly active users completing core job within 7 days (+15% vs baseline).",
      "Guardrail: support tickets for this flow do not increase week-over-week.",
    ];
    notes.push("expanded success metrics");
  }
  if (/user stor/i.test(i)) {
    next.userStories = [
      ...previous.userStories,
      {
        title: "As a new user, I can complete onboarding with guided recovery",
        description: "Covers happy path plus explicit failure recovery for the MVP cohort.",
        acceptanceCriteria: [
          "User sees progress indicator across steps",
          "Abandonment triggers save-state and resume",
        ],
      },
    ];
    notes.push("added user stories");
  }
  if (/stakeholder|polished|executive/i.test(i)) {
    next.proposedSolution = `${previous.proposedSolution} Executive summary: delivers measurable outcome for the target segment with clear rollout gates.`;
    notes.push("more stakeholder-ready tone");
  }
  if (/technical requirement/i.test(i)) {
    next.coreRequirements = [
      ...previous.coreRequirements,
      "API contracts documented with versioning and backward compatibility for v1 consumers.",
      "P95 latency under 300ms for primary read path in production.",
    ];
    notes.push("added technical requirements");
  }
  if (/launch/i.test(i)) {
    next.launchConsiderations = [
      ...previous.launchConsiderations,
      "Comms plan for internal champions before external GA.",
    ];
    notes.push("expanded launch considerations");
  }
  if (/risk/i.test(i)) {
    next.risks = [
      ...previous.risks,
      "Adoption risk if training materials lag feature availability by more than one sprint.",
    ];
    notes.push("more specific risks");
  }

  const revisionSummary =
    notes.length > 0
      ? `Refined per “${instruction.slice(0, 100)}”: ${notes.join("; ")}.`
      : `Refined per “${instruction.slice(0, 100)}”: light edits across sections while preserving structure.`;

  next.sourceContext = [
    ...previous.sourceContext,
    `Refinement: ${instruction.slice(0, 120)}`,
  ].slice(0, 10);

  return coerceSpecWriterOutput({
    ...next,
    revisionSummary,
    confidence: clamp01(Math.min(0.95, previous.confidence + 0.05)),
  });
}

function splitSentences(text: string): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  return cleaned
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0.55;
  return Math.min(1, Math.max(0, n));
}

function scoreFromLabel(label: string, index: number, hasEvidence: boolean): PrioritizationScores {
  const hash = (label.length + index * 7) % 5;
  return {
    userImpact: 2 + (hash % 3),
    businessValue: 2 + ((hash + 1) % 3),
    evidenceStrength: hasEvidence ? 3 + (hash % 2) : 2 + (hash % 2),
    strategicFit: 2 + ((hash + 2) % 3),
    confidence: hasEvidence ? 3 + (hash % 2) : 2,
    implementationEffort: 2 + ((5 - hash) % 3),
    technicalComplexity: 2 + ((hash + index) % 3),
    risk: 2 + ((hash + index + 1) % 3),
  };
}

function classifyMockInput(title: string, body: string): PrioritizationInputType {
  const t = `${title} ${body}`.toLowerCase();
  if (/\b(roadmap|q[1-4]|stakeholder|exec request|committed)\b/.test(t)) return "roadmapItem";
  if (/\b(feature|capability|toggle|dashboard|export|notification)\b/.test(t)) return "feature";
  if (/\b(build|implement|ship|solution|redesign|integration)\b/.test(t)) return "solution";
  if (/\b(insight|pattern|theme|synthesis|converging)\b/.test(t)) return "insight";
  if (/\b(pain|problem|friction|struggle|need|opportunity|bet)\b/.test(t)) return "opportunity";
  return "unknown";
}

function splitCandidateLines(raw: string): string[] {
  const lines = raw
    .split(/\r?\n/)
    .flatMap((line) => line.split(/(?<=[•\-*])\s+/))
    .map((l) => l.replace(/^[\s•\-*\d.()[\]]+/, "").trim())
    .filter((l) => l.length > 3);
  return lines.length ? lines.slice(0, 12) : [];
}

/** Deterministic mock: theme/need extraction from raw + optional intake. */
export function mockSynthesisFromUserContent(userContent: string): SynthesisAgentOutput {
  const raw =
    extractBlock(userContent, "RAW_INPUT")?.trim() ??
    userContent.trim();
  const intake = tryParseIntakeJson(extractBlock(userContent, "INTAKE_OUTPUT_JSON"));
  const sentences = splitSentences(raw);
  const obs = intake?.keyObservations?.length
    ? intake.keyObservations
    : sentences.slice(0, 6).map((s) => s.slice(0, 240));

  const themes: SynthesisTheme[] = obs.slice(0, 4).map((text, i) => ({
    title: `Converging pattern ${i + 1}`,
    pattern: `Signals repeat around: ${text.slice(0, 140)}${text.length > 140 ? "…" : ""}`,
    evidence: [
      {
        excerpt: text.slice(0, 200),
        groundingNote: intake ? "Anchored to intake observation" : "Anchored to raw notes",
      } satisfies EvidenceRef,
    ],
  }));

  if (!themes.length && raw) {
    themes.push({
      title: "Primary friction cluster",
      pattern:
        "The raw material implies a coherent problem area worth validating with targeted research.",
      evidence: [{ excerpt: raw.slice(0, 220) } satisfies EvidenceRef],
    });
  }

  const recurringPainThemes = (intake?.potentialPainPoints ?? [])
    .slice(0, 5)
    .map((p, i) => `Pain cluster ${i + 1}: ${p.slice(0, 120)}`);

  const articulatedUserNeeds =
    (intake?.potentialPainPoints ?? []).slice(0, 4).map((p) => ({
      need: `Users need relief from: ${p.slice(0, 100)}`,
      rationale:
        "Repeated friction language suggests this need is material for retention or task success.",
      evidence: [{ excerpt: p.slice(0, 160) }],
    })) ?? [];

  if (!articulatedUserNeeds.length && raw) {
    articulatedUserNeeds.push({
      need: "Clarify the primary job-to-be-done before sizing solutions.",
      rationale: "Notes imply pain but segmentation and frequency are still ambiguous.",
      evidence: [{ excerpt: raw.slice(0, 180) }],
    });
  }

  const opportunityInsights = (intake?.potentialOpportunities ?? []).slice(0, 5).map((o, i) => ({
    title: `Opportunity ${i + 1}`,
    insight:
      "If validated at scale, addressing this direction could differentiate the experience and reduce drop-off.",
    evidence: [{ excerpt: o.slice(0, 200) }],
  }));

  if (!opportunityInsights.length && sentences[0]) {
    opportunityInsights.push({
      title: "Discovery-led opportunity",
      insight:
        "Treat the strongest verbatim signals as hypotheses; pair with lightweight experiments.",
      evidence: [{ excerpt: sentences[0].slice(0, 200) }],
    });
  }

  const crossCuttingRisks = [
    "Sampling bias: dominant voices may not reflect the broader segment.",
    "Recency and severity of pain are not yet quantified.",
    "Dependencies on platform, policy, or third parties are unverified.",
  ];

  const remainingUnknowns =
    intake?.missingContextQuestions?.slice(0, 6) ??
    [
      "What is the baseline conversion or task success rate?",
      "Which user cohorts are most affected?",
    ];

  const richness = Math.min(1, raw.length / 3500 + themes.length / 8);
  const confidence = clamp01(0.5 + richness * 0.35);

  return coerceSynthesisOutput({
    executiveSummary:
      intake?.productContext?.summary && intake.productContext.summary.length > 20
        ? `Synthesis: ${intake.productContext.summary} Themes emerge across ${themes.length || 1} clusters with actionable discovery paths.`
        : `Cross-cutting synthesis of ${raw.length ? "the captured notes" : "sparse input"}: prioritize validating the strongest recurring signals before scoping delivery work.`,
    themes,
    recurringPainThemes: recurringPainThemes.length
      ? recurringPainThemes
      : ["(No explicit pain clustering — run targeted follow-ups.)"],
    articulatedUserNeeds,
    opportunityInsights,
    crossCuttingRisks,
    remainingUnknowns,
    confidence,
  });
}

export function mockPrioritizationFromUserContent(userContent: string): PrioritizationAgentOutput {
  const rerankInstruction = extractBlock(userContent, "RERANK_INSTRUCTION");
  const previousPrior = tryParsePrioritizationJson(
    extractBlock(userContent, "PRIORITIZATION_OUTPUT_JSON"),
  );
  if (rerankInstruction && previousPrior?.rankedItems?.length) {
    return mockRerankPrioritization(previousPrior, rerankInstruction);
  }

  const raw = extractBlock(userContent, "RAW_INPUT") ?? "";
  const intake = tryParseIntakeJson(extractBlock(userContent, "INTAKE_OUTPUT_JSON"));
  const synthesis = tryParseSynthesisJson(extractBlock(userContent, "SYNTHESIS_OUTPUT_JSON"));

  type Candidate = {
    title: string;
    body: string;
    inputType?: PrioritizationInputType;
    evidenceHint?: string;
  };
  const candidates: Candidate[] = [];

  if (synthesis?.opportunityInsights?.length) {
    for (const o of synthesis.opportunityInsights) {
      candidates.push({
        title: o.title,
        body: o.insight,
        inputType: "insight",
        evidenceHint: o.evidence[0]?.excerpt,
      });
    }
  }
  if (synthesis?.recurringPainThemes?.length) {
    for (const pain of synthesis.recurringPainThemes.slice(0, 4)) {
      candidates.push({ title: pain.slice(0, 90), body: pain, inputType: "opportunity" });
    }
  }
  for (const line of splitCandidateLines(raw)) {
    candidates.push({ title: line.slice(0, 100), body: line });
  }
  if (!candidates.length && intake?.potentialOpportunities?.length) {
    for (const t of intake.potentialOpportunities) {
      candidates.push({ title: t.slice(0, 90), body: t, inputType: "opportunity" });
    }
  }
  if (!candidates.length && intake?.potentialPainPoints?.length) {
    for (const t of intake.potentialPainPoints) {
      candidates.push({ title: t.slice(0, 90), body: t, inputType: "opportunity" });
    }
  }
  if (!candidates.length) {
    candidates.push({
      title: "Clarify priority candidates",
      body:
        raw.trim() ||
        "Upstream JSON was sparse—infer cautiously and gather more evidence before ranking.",
      inputType: "unknown",
    });
  }

  const defaultTarget =
    userContent.match(/Target user \(user\):\s*(.+)/)?.[1]?.trim() ||
    intake?.productContext?.targetUserProvided ||
    "Primary user segment (confirm with PM)";

  const rankedDraft: RankedPrioritizationItem[] = candidates.slice(0, 10).map((c, i) => {
    const inputType = c.inputType ?? classifyMockInput(c.title, c.body);
    const hasEvidence = Boolean(c.evidenceHint);
    const scores = scoreFromLabel(c.title, i, hasEvidence);
    const priorityScore = computePriorityScore(scores);
    const isSolutionLike =
      inputType === "solution" || inputType === "feature" || inputType === "roadmapItem";
    const underlyingProblem = isSolutionLike
      ? `User need implied by “${c.title}”: ${c.body.slice(0, 160)}`
      : c.body.slice(0, 280) || c.title;
    const mappedOpportunity = isSolutionLike
      ? synthesis?.opportunityInsights?.[0]?.title ??
        intake?.potentialOpportunities?.[0] ??
        "Broader product opportunity — validate with discovery"
      : null;
    const possibleSolutions =
      inputType === "opportunity" || inputType === "unknown"
        ? [
            `Explore thin slice for: ${c.title.slice(0, 60)}`,
            "Partner with design on journey map before build",
          ]
        : [];

    return {
      id: `item-${i + 1}`,
      rank: i + 1,
      priorityScore,
      inputType,
      title: c.title,
      underlyingProblem,
      targetUser: defaultTarget,
      possibleSolutions,
      mappedOpportunity,
      scores,
      rationale: `Rank driven by priorityScore ${priorityScore}: balances impact and evidence against effort, complexity, and risk${
        c.evidenceHint ? ` (signal: “${c.evidenceHint.slice(0, 72)}…”)` : ""
      }.`,
      tradeoffs: [
        "Higher-ranked items may need discovery before engineering commitment.",
        "Lower-ranked items can jump if revenue or retention linkage is proven.",
      ],
      assumptions: [
        "Input labels reflect real user or business pain, not solution bias alone.",
        "Team capacity stays within a typical product cycle.",
      ],
      risks: [
        "Mis-rank if severity/frequency quant data is missing.",
        "Cross-team dependencies may not be captured in notes.",
      ],
      missingInformation: [
        "Quantify affected users and frequency for this item.",
        "Confirm strategic fit with current quarter goals.",
      ],
    };
  });

  const portfolioNarrative = synthesis?.executiveSummary?.trim().length
    ? `Normalized ${rankedDraft.length} candidates from synthesis and notes. ${synthesis.executiveSummary.slice(0, 320)}`
    : intake?.productContext?.summary?.trim().length
      ? `Priority stack from intake and pasted inputs: ${intake.productContext.summary.slice(0, 260)}`
      : `Normalized ${rankedDraft.length} mixed product inputs (opportunities, features, solutions, or notes) into a ranked portfolio.`;

  const decisionNotes = [
    "Revisit rankings after usage metrics, survey prevalence, or synthesis refresh.",
    "When inputType is unknown, run a short clarification interview before build.",
  ];

  const conf = clamp01(0.55 + Math.min(0.35, rankedDraft.length * 0.04));

  return coercePrioritizationOutput({
    portfolioNarrative,
    scoringModelSummary: PRIORITIZATION_SCORING_MODEL_SUMMARY,
    rankedItems: rankedDraft,
    decisionNotes,
    recommendedNextStep:
      "Pilot the #1 ranked item with a measurable success metric and a two-week discovery checkpoint.",
    confidence: conf,
  });
}

export function mockSpecWriterFromUserContent(userContent: string): SpecWriterAgentOutput {
  const refinementInstruction = extractBlock(userContent, "REFINEMENT_INSTRUCTION");
  const previousPrd = tryParseSpecWriterJson(extractBlock(userContent, "SPEC_WRITER_OUTPUT_JSON"));
  if (refinementInstruction && previousPrd?.prdTitle) {
    return mockRefineSpecWriter(previousPrd, refinementInstruction);
  }

  const raw = extractBlock(userContent, "RAW_INPUT") ?? "";
  const intake = tryParseIntakeJson(extractBlock(userContent, "INTAKE_OUTPUT_JSON"));
  const synthesis = tryParseSynthesisJson(extractBlock(userContent, "SYNTHESIS_OUTPUT_JSON"));
  const prioritization = tryParsePrioritizationJson(
    extractBlock(userContent, "PRIORITIZATION_OUTPUT_JSON"),
  );

  let focusedId: string | undefined;
  let selectedOpportunityLabel: string | undefined;
  for (const line of userContent.split(/\r?\n/)) {
    if (line.startsWith("Focused opportunity id:")) {
      focusedId = line.slice("Focused opportunity id:".length).trim() || undefined;
    }
    if (line.startsWith("Selected opportunity (user):")) {
      selectedOpportunityLabel =
        line.slice("Selected opportunity (user):".length).trim() || undefined;
    }
  }

  const ranked: RankedPrioritizationItem[] = prioritization?.rankedItems ?? [];
  const selected: RankedPrioritizationItem | undefined =
    (focusedId ? ranked.find((r) => r.id === focusedId) : undefined) ?? ranked[0];

  const title =
    selected?.title ??
    (selectedOpportunityLabel ? selectedOpportunityLabel.slice(0, 120) : undefined) ??
    synthesis?.opportunityInsights?.[0]?.title ??
    "Discovery initiative";

  const problem =
    selected?.underlyingProblem?.trim() ||
    synthesis?.executiveSummary?.trim() ||
    intake?.productContext?.summary?.trim() ||
    (raw.trim() ? raw.slice(0, 400).trim() : "") ||
    "Problem statement pending — attach intake or prioritization JSON.";

  const userStories = [
    {
      title: `As a user, I can resolve ${title.slice(0, 60)}`,
      description:
        "Primary flow covers the critical path; edge cases land in a follow-up scope slice.",
      acceptanceCriteria: [
        "User can complete the job in under the baseline task time for this cohort.",
        "Failure states are explicit with recovery or escalation paths.",
        "Analytics events capture success, abandonment, and key funnel transitions.",
      ],
    },
    {
      title: "As an admin, I can monitor adoption and errors",
      description: "Operational visibility for rollout risk management.",
      acceptanceCriteria: [
        "Dashboard or export shows adoption and error rates by segment.",
        "Alerts trigger on SLO breaches defined with PM.",
      ],
    },
  ];

  const pn =
    userContent.match(/Product \(user\):\s*(.+)/)?.[1]?.trim() ??
    intake?.productContext?.productNameProvided ??
    "";
  const prdTitle = pn ? `${pn} — ${title}` : `PRD — ${title}`;
  const targetUsers = [
    selected?.targetUser?.trim() ||
      userContent.match(/Target user \(user\):\s*(.+)/)?.[1]?.trim() ||
      intake?.productContext?.targetUserProvided ||
      "Primary user segment (confirm with PM)",
  ].filter(Boolean) as string[];

  const sourceContext: string[] = [];
  if (selected) {
    sourceContext.push(
      `Prioritization #${selected.rank}: ${selected.title} (priorityScore ${selected.priorityScore})`,
      selected.rationale,
      ...selected.tradeoffs.slice(0, 2).map((t) => `Tradeoff: ${t}`),
    );
  }
  if (synthesis?.executiveSummary) {
    sourceContext.push(`Synthesis: ${synthesis.executiveSummary.slice(0, 200)}`);
  }
  if (raw.trim()) sourceContext.push(`User notes: ${raw.slice(0, 180)}`);

  return coerceSpecWriterOutput({
    prdTitle,
    problemStatement: problem,
    targetUsers,
    goals: [
      "Deliver a clearly scoped slice that validates the core hypothesis.",
      "Improve primary success metric for the targeted user segment.",
    ],
    nonGoals: [
      "Full platform rewrite or unbounded scope expansion in v1.",
      "Perfect coverage of edge personas before learning from primary segment.",
    ],
    proposedSolution: selected
      ? `Address “${selected.title}” by shipping a focused v1 that resolves: ${selected.underlyingProblem.slice(0, 200)}`
      : raw.trim()
        ? `Implement the concept described in user notes: ${raw.slice(0, 220)}`
        : "Proposed solution to be refined with design and engineering after discovery.",
    featureRecommendations: [
      `Core flow for: ${title.slice(0, 80)}`,
      "Instrumentation and admin visibility for rollout",
      ...(selected?.possibleSolutions?.slice(0, 2) ?? []),
    ],
    userStories,
    coreRequirements: [
      "End-to-end happy path for the primary persona",
      "Explicit error and empty states with recovery guidance",
      "Analytics events for funnel, success, and abandonment",
      "Accessibility and responsive layout for primary surfaces",
    ],
    successMetrics: [
      "Primary: activation or task success rate lifts vs baseline (define exact metric with data).",
      "Secondary: support volume or time-on-task reduction for the friction cluster.",
    ],
    launchConsiderations: [
      "Phased rollout with feature flag or cohort gating",
      "Support and docs updated before GA",
      "Rollback plan if primary metric regresses beyond agreed threshold",
    ],
    risks: [
      ...(selected?.risks?.slice(0, 2) ?? []),
      ...(synthesis?.crossCuttingRisks?.slice(0, 2) ?? []),
      "Scope creep if success metrics are not pinned before build.",
    ],
    openQuestions:
      selected?.missingInformation?.length
        ? selected.missingInformation.slice(0, 4)
        : synthesis?.remainingUnknowns?.slice(0, 4) ??
          intake?.missingContextQuestions?.slice(0, 4) ?? [
            "What is the definition of “done” for the pilot cohort?",
          ],
    nextSteps: [
      "Confirm metrics and pilot cohort with PM + analytics.",
      "Ship thin experiment or MVP; review gates against success metrics.",
      ...(prioritization?.recommendedNextStep
        ? [prioritization.recommendedNextStep]
        : []),
    ],
    sourceContext: sourceContext.slice(0, 8),
    confidence: clamp01(0.52 + (ranked.length ? 0.12 : 0)),
  });
}
