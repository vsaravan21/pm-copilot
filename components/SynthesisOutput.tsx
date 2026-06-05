"use client";

import { useMemo, useState } from "react";

import { OutputCard } from "@/components/OutputCard";
import type { SynthesisAgentOutput } from "@/lib/schemas";

function bulletList(items: string[]) {
  if (!items.length) {
    return <p className="text-sm text-pm-muted">None surfaced.</p>;
  }
  return (
    <ul className="space-y-2 text-[15px] leading-relaxed">
      {items.map((item, index) => (
        <li key={`${index}-${item.slice(0, 40)}`} className="flex gap-2.5">
          <span className="mt-2 inline-block size-[5px] shrink-0 rounded-full bg-pm-violet/55" />
          <span className="flex-1 text-pm-text">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function evidenceList(excerpts: { excerpt: string; groundingNote?: string }[]) {
  if (!excerpts.length) return null;
  return (
    <ul className="mt-2 space-y-1.5 border-l border-pm-border/80 pl-3 text-[13px] text-pm-muted">
      {excerpts.map((e, i) => (
        <li key={i}>
          <span className="text-pm-subtle">&ldquo;{e.excerpt}&rdquo;</span>
          {e.groundingNote ? (
            <span className="mt-0.5 block text-[11px] text-pm-muted">{e.groundingNote}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function SynthesisOutput({
  data,
  error,
  compact = false,
}: {
  data: SynthesisAgentOutput | null;
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
        Run synthesis to see themes, needs, opportunities, and evidence-backed insights.
      </p>
    );
  }

  const gap = compact ? "gap-3" : "gap-4";
  const confPct = Math.round(Math.min(Math.max(data.confidence, 0), 1) * 100);

  return (
    <div className={`flex flex-col ${gap}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-pm-border pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pm-violet/90">
            Synthesis Agent output
          </p>
          <h3 className="text-lg font-semibold text-pm-text">Research synthesis</h3>
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

      <OutputCard title="Executive summary">
        <p className="text-[15px] leading-relaxed">{data.executiveSummary}</p>
      </OutputCard>

      <div className={`grid ${compact ? "gap-3" : "gap-4"} lg:grid-cols-2`}>
        <OutputCard title="Themes & recurring motifs">
          <div className="space-y-4">
            {data.themes.map((t) => (
              <div key={t.title}>
                <p className="font-medium text-pm-text">{t.title}</p>
                <p className="mt-1 text-sm text-pm-subtle">{t.pattern}</p>
                {evidenceList(t.evidence)}
              </div>
            ))}
            {!data.themes.length && <p className="text-sm text-pm-muted">No themes yet.</p>}
          </div>
        </OutputCard>

        <OutputCard title="User pain summaries">
          {bulletList(data.recurringPainThemes)}
        </OutputCard>
      </div>

      <OutputCard title="Articulated needs">
        <div className="space-y-4">
          {data.articulatedUserNeeds.map((n) => (
            <div key={n.need}>
              <p className="font-medium text-pm-text">{n.need}</p>
              <p className="mt-1 text-sm text-pm-subtle">{n.rationale}</p>
              {evidenceList(n.evidence)}
            </div>
          ))}
          {!data.articulatedUserNeeds.length && (
            <p className="text-sm text-pm-muted">No needs articulated.</p>
          )}
        </div>
      </OutputCard>

      <OutputCard title="Opportunities (evidence-linked)">
        <div className="space-y-4">
          {data.opportunityInsights.map((o) => (
            <div key={o.title}>
              <p className="font-medium text-pm-text">{o.title}</p>
              <p className="mt-1 text-sm text-pm-subtle">{o.insight}</p>
              {evidenceList(o.evidence)}
            </div>
          ))}
          {!data.opportunityInsights.length && (
            <p className="text-sm text-pm-muted">No opportunities surfaced.</p>
          )}
        </div>
      </OutputCard>

      <div className="grid gap-4 md:grid-cols-2">
        <OutputCard title="Cross-cutting risks">{bulletList(data.crossCuttingRisks)}</OutputCard>
        <OutputCard title="Remaining unknowns">{bulletList(data.remainingUnknowns)}</OutputCard>
      </div>
    </div>
  );
}
