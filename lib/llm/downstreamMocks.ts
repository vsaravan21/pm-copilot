import {
  coerceIntakeOutput,
  coercePrioritizationOutput,
  coerceSpecWriterOutput,
  coerceSynthesisOutput,
  type EvidenceRef,
  type IntakeAgentOutput,
  type PrioritizationAgentOutput,
  type RankedOpportunity,
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

function scoreFromLabel(
  label: string,
  index: number,
): {
  userImpact: number;
  businessValue: number;
  evidenceStrength: number;
  implementationEffort: number;
  technicalComplexity: number;
} {
  const hash = (label.length + index * 7) % 5;
  const userImpact = 2 + (hash % 3);
  const businessValue = 2 + ((hash + 1) % 3);
  const evidenceStrength = 2 + ((hash + 2) % 3);
  const implementationEffort = 2 + ((5 - hash) % 3);
  const technicalComplexity = 2 + ((hash + index) % 3);
  return {
    userImpact,
    businessValue,
    evidenceStrength,
    implementationEffort,
    technicalComplexity,
  };
}

function compositeScore(s: ReturnType<typeof scoreFromLabel>): number {
  return (
    s.userImpact * 1.2 +
    s.businessValue +
    s.evidenceStrength -
    s.implementationEffort * 0.9 -
    s.technicalComplexity * 0.5
  );
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
  const raw = extractBlock(userContent, "RAW_INPUT") ?? "";
  const intake = tryParseIntakeJson(extractBlock(userContent, "INTAKE_OUTPUT_JSON"));
  const synthesis = tryParseSynthesisJson(extractBlock(userContent, "SYNTHESIS_OUTPUT_JSON"));

  type Item = { title: string; summary: string; evidenceHint?: string };
  const items: Item[] = [];

  if (synthesis?.opportunityInsights?.length) {
    for (const o of synthesis.opportunityInsights) {
      items.push({
        title: o.title,
        summary: o.insight,
        evidenceHint: o.evidence[0]?.excerpt,
      });
    }
  } else if (intake?.potentialOpportunities?.length) {
    for (const t of intake.potentialOpportunities) {
      items.push({ title: t.slice(0, 90), summary: t });
    }
  } else if (raw.trim()) {
    items.push({
      title: "Validate highest-signal pain",
      summary: raw.slice(0, 280),
    });
  } else {
    items.push({
      title: "Run discovery on open opportunities",
      summary: "Upstream JSON was sparse—infer cautiously and gather more evidence before ranking.",
    });
  }

  const scored = items.map((item, i) => {
    const scores = scoreFromLabel(item.title, i);
    return { item, scores, composite: compositeScore(scores) };
  });

  scored.sort((a, b) => b.composite - a.composite);

  const rankedOpportunities = scored.map((row, i) => ({
    id: `opp-${i + 1}`,
    title: row.item.title,
    summary: row.item.summary,
    scores: row.scores,
    compositeRank: i + 1,
    rationale: `Rank ${i + 1}: balances perceived user impact with implementation load given current evidence${
      row.item.evidenceHint ? ` (“${row.item.evidenceHint.slice(0, 80)}…”)` : ""
    }.`,
    tradeoffs: [
      "Higher-ranked items may need discovery spend before build commitment.",
      "Lower-ranked items could become P0 if segment or revenue linkage strengthens.",
    ],
    assumptions: [
      "Evidence in notes is directionally correct but not statistically representative.",
      "Team capacity and tech stack constraints stay within typical product cycle norms.",
    ],
    risks: [
      "Mis-ranked item if missing quant data on severity or frequency.",
      "Dependencies on other teams or platforms not captured in the notes.",
    ],
  }));

  const portfolioNarrative = synthesis?.executiveSummary?.trim().length
    ? `Portfolio view driven by synthesis themes: ${synthesis.executiveSummary.slice(0, 360)}`
    : intake?.productContext?.summary?.trim().length
      ? `Priority stack grounded in intake context: ${intake.productContext.summary.slice(0, 280)}`
      : "Ranked list reflects heuristic mock scoring until richer synthesis or metrics are attached.";

  const decisionNotes = [
    "Revisit rankings after attaching usage metrics or survey prevalence.",
    "If two items tie on composite, prefer the one with clearer user-facing outcome.",
  ];

  const conf = clamp01(0.55 + Math.min(0.35, rankedOpportunities.length * 0.04));

  return coercePrioritizationOutput({
    portfolioNarrative,
    rankedOpportunities,
    decisionNotes,
    confidence: conf,
  });
}

export function mockSpecWriterFromUserContent(userContent: string): SpecWriterAgentOutput {
  const raw = extractBlock(userContent, "RAW_INPUT") ?? "";
  const intake = tryParseIntakeJson(extractBlock(userContent, "INTAKE_OUTPUT_JSON"));
  const synthesis = tryParseSynthesisJson(extractBlock(userContent, "SYNTHESIS_OUTPUT_JSON"));
  const prioritization = tryParsePrioritizationJson(
    extractBlock(userContent, "PRIORITIZATION_OUTPUT_JSON"),
  );

  let focusedId: string | undefined;
  for (const line of userContent.split(/\r?\n/)) {
    if (line.startsWith("Focused opportunity id:")) {
      focusedId = line.slice("Focused opportunity id:".length).trim() || undefined;
      break;
    }
  }

  const ranked: RankedOpportunity[] = prioritization?.rankedOpportunities ?? [];
  const selected: RankedOpportunity | undefined =
    (focusedId ? ranked.find((r) => r.id === focusedId) : undefined) ?? ranked[0];

  const title =
    selected?.title ??
    synthesis?.opportunityInsights?.[0]?.title ??
    "Discovery initiative";

  const problem =
    selected?.summary?.trim() ||
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
  const documentTitle = pn ? `${pn} — ${title}` : `PRD draft — ${title}`;

  return coerceSpecWriterOutput({
    documentTitle,
    problemStatement: problem,
    goals: [
      "Deliver a clearly scoped slice that validates the core hypothesis.",
      "Improve primary success metric for the targeted user segment.",
    ],
    nonGoals: [
      "Full platform rewrite or unbounded scope expansion in v1.",
      "Perfect coverage of edge personas before learning from primary segment.",
    ],
    userStories,
    successMetrics: [
      "Primary: activation or task success rate lifts vs baseline (define exact metric with data).",
      "Secondary: support volume or time-on-task reduction for the friction cluster.",
    ],
    risks: [
      ...(synthesis?.crossCuttingRisks?.slice(0, 2) ?? []),
      "Scope creep if success metrics are not pinned before build.",
    ],
    openQuestions: synthesis?.remainingUnknowns?.slice(0, 4) ??
      intake?.missingContextQuestions?.slice(0, 4) ?? [
        "What is the definition of “done” for the pilot cohort?",
      ],
    nextSteps: [
      "Confirm metrics and pilot cohort with PM + analytics.",
      "Ship thin experiment or MVP; review gates against success metrics.",
    ],
    confidence: clamp01(0.52 + (ranked.length ? 0.12 : 0)),
  });
}
