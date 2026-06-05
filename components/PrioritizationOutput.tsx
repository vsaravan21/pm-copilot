"use client";

import { useMemo, useState } from "react";

import { OutputCard } from "@/components/OutputCard";
import type {
  PrioritizationAgentOutput,
  PrioritizationInputType,
  PrioritizationScores,
} from "@/lib/schemas";

function bulletList(items: string[]) {
  if (!items.length) {
    return <p className="text-sm text-pm-muted">None listed.</p>;
  }
  return (
    <ul className="space-y-2 text-[14px] leading-relaxed">
      {items.map((item, index) => (
        <li key={`${index}-${item.slice(0, 32)}`} className="flex gap-2.5">
          <span className="mt-2 inline-block size-[5px] shrink-0 rounded-full bg-pm-violet/55" />
          <span className="flex-1 text-pm-text">{item}</span>
        </li>
      ))}
    </ul>
  );
}

const INPUT_TYPE_LABELS: Record<PrioritizationInputType, string> = {
  opportunity: "Opportunity",
  solution: "Solution",
  feature: "Feature",
  roadmapItem: "Roadmap item",
  insight: "Insight",
  unknown: "Unknown",
};

const SCORE_HIGHER: { key: keyof PrioritizationScores; label: string }[] = [
  { key: "userImpact", label: "User impact" },
  { key: "businessValue", label: "Business value" },
  { key: "evidenceStrength", label: "Evidence strength" },
  { key: "strategicFit", label: "Strategic fit" },
  { key: "confidence", label: "Confidence" },
];

const SCORE_LOWER: { key: keyof PrioritizationScores; label: string }[] = [
  { key: "implementationEffort", label: "Implementation effort" },
  { key: "technicalComplexity", label: "Technical complexity" },
  { key: "risk", label: "Risk" },
];

function ScoreGrid({ scores }: { scores: PrioritizationScores }) {
  const renderBar = (key: keyof PrioritizationScores, label: string, invert: boolean) => {
    const value = scores[key];
    const pct = (value / 5) * 100;
    return (
      <div key={key} className="space-y-1">
        <div className="flex justify-between text-[11px] text-pm-muted">
          <span>{label}</span>
          <span className="font-semibold text-pm-subtle">{value}/5</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-pm-panel">
          <div
            className={`h-full rounded-full ${invert ? "bg-pm-warning/70" : "bg-pm-violet/70"}`}
            style={{ width: `${pct}%` }}
            role="presentation"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="mt-3 space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-pm-muted">
        Scoring dimensions
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {SCORE_HIGHER.map(({ key, label }) => renderBar(key, label, false))}
        {SCORE_LOWER.map(({ key, label }) => renderBar(key, label, true))}
      </div>
    </div>
  );
}

export function PrioritizationOutput({
  data,
  error,
  compact = false,
}: {
  data: PrioritizationAgentOutput | null;
  error: string | null;
  compact?: boolean;
}) {
  const jsonText = useMemo(() => JSON.stringify(data, null, 2), [data]);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!data) return;
    await navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  if (error) {
    return (
      <p className="rounded-[11px] border border-pm-error/30 bg-pm-error/10 px-4 py-3 text-sm text-pm-error">
        {error}
      </p>
    );
  }

  if (!data) {
    return (
      <p className="text-sm leading-relaxed text-pm-muted">
        Run prioritization to see classified items, scores, underlying problems, and decision notes.
      </p>
    );
  }

  const confPct = Math.round(Math.min(Math.max(data.confidence, 0), 1) * 100);
  const rankedItems = Array.isArray(data.rankedItems) ? data.rankedItems : [];
  const sorted = [...rankedItems].sort((a, b) => a.rank - b.rank);

  return (
    <div className={`flex flex-col ${compact ? "gap-3" : "gap-4"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-pm-border pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pm-violet/90">
            Prioritization output
          </p>
          <h3 className="text-lg font-semibold text-pm-text">Ranked portfolio</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-pm-warning/30 bg-pm-warning/10 px-3 py-1 text-[11px] font-semibold text-pm-warning">
            {confPct}% confidence
          </span>
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="rounded-lg border border-pm-border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-pm-muted transition hover:text-pm-text"
          >
            {copied ? "Copied" : "Copy JSON"}
          </button>
        </div>
      </div>

      {data.changeSummary && (
        <OutputCard title="What changed">
          <p className="text-[15px] leading-relaxed text-pm-text">{data.changeSummary}</p>
        </OutputCard>
      )}

      <OutputCard title="Portfolio narrative">
        <p className="text-[15px] leading-relaxed">{data.portfolioNarrative}</p>
      </OutputCard>

      <OutputCard title="Scoring model">
        <p className="text-sm leading-relaxed text-pm-subtle">{data.scoringModelSummary}</p>
      </OutputCard>

      <div className="space-y-4">
        {sorted.map((item) => (
          <section
            key={item.id}
            className="rounded-[15px] border border-pm-border bg-pm-panel/65 p-4 shadow-[0_16px_44px_-36px_rgba(0,0,0,0.85)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-pm-violet/80">
                    Rank #{item.rank}
                  </span>
                  <span className="rounded-full border border-pm-border bg-pm-bg/50 px-2 py-0.5 text-[10px] font-semibold text-pm-muted">
                    {INPUT_TYPE_LABELS[item.inputType]}
                  </span>
                  <span className="text-[10px] font-semibold text-pm-success">
                    Score {item.priorityScore}
                  </span>
                </div>
                <h4 className="mt-1 text-[16px] font-semibold text-pm-text">{item.title}</h4>
              </div>
              <span className="rounded-md border border-pm-border bg-pm-bg/50 px-2 py-0.5 font-mono text-[11px] text-pm-muted">
                {item.id}
              </span>
            </div>

            <div className="mt-3 space-y-2 text-sm leading-relaxed">
              <p>
                <span className="font-medium text-pm-subtle">Underlying problem: </span>
                {item.underlyingProblem}
              </p>
              {item.targetUser && (
                <p>
                  <span className="font-medium text-pm-subtle">Target user: </span>
                  {item.targetUser}
                </p>
              )}
              {item.mappedOpportunity && (
                <p>
                  <span className="font-medium text-pm-subtle">Maps to opportunity: </span>
                  {item.mappedOpportunity}
                </p>
              )}
            </div>

            {item.possibleSolutions.length > 0 && (
              <div className="mt-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-pm-muted">
                  Possible solutions
                </p>
                <div className="mt-1">{bulletList(item.possibleSolutions)}</div>
              </div>
            )}

            <ScoreGrid scores={item.scores} />

            <p className="mt-3 text-sm leading-relaxed text-pm-text">
              <span className="font-medium text-pm-subtle">Why this rank: </span>
              {item.rationale}
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-pm-muted">
                  Tradeoffs
                </p>
                <div className="mt-1">{bulletList(item.tradeoffs)}</div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-pm-muted">
                  Assumptions
                </p>
                <div className="mt-1">{bulletList(item.assumptions)}</div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-pm-muted">
                  Risks
                </p>
                <div className="mt-1">{bulletList(item.risks)}</div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-pm-muted">
                  Missing information
                </p>
                <div className="mt-1">{bulletList(item.missingInformation)}</div>
              </div>
            </div>
          </section>
        ))}
        {!sorted.length && (
          <p className="text-sm text-pm-muted">No ranked items returned.</p>
        )}
      </div>

      <OutputCard title="Portfolio open questions">
        {bulletList(data.decisionNotes)}
      </OutputCard>

      <OutputCard title="Recommended next step">
        <p className="text-[15px] font-medium leading-relaxed text-pm-text">
          {data.recommendedNextStep}
        </p>
      </OutputCard>
    </div>
  );
}
