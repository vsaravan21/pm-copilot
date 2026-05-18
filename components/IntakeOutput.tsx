"use client";

import { useMemo, useState } from "react";

import type { IntakeAgentOutput } from "@/lib/schemas";

import { OutputCard } from "./OutputCard";

function prettifySlug(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function bulletList(items: string[]) {
  if (!items.length) {
    return <p className="text-sm text-pm-muted">No items detected yet.</p>;
  }

  return (
    <ul className="space-y-2 text-[15px] leading-relaxed">
      {items.map((item, index) => (
        <li key={`${index}-${item}`} className="flex gap-2.5">
          <span className="mt-2 inline-block size-[5px] shrink-0 rounded-full bg-pm-violet/55 shadow-[0_0_14px_-2px_rgba(155,92,255,0.55)]" />
          <span className="flex-1 text-pm-text">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function IntakeOutput({
  data,
  error,
  pipelineEmbedded = false,
  compact = false,
}: {
  data: IntakeAgentOutput | null;
  error: string | null;
  pipelineEmbedded?: boolean;
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

  const gapMajor = compact ? "gap-3" : "gap-5";
  const gapGrid = compact ? "gap-3" : "gap-4";
  const gapTriple = compact ? "gap-3" : "gap-4";

  const chipInput =
    "rounded-full border border-pm-pink/30 bg-pm-pink/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-pm-pink";
  const chipTask =
    "rounded-full border border-pm-blue/30 bg-pm-blue/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-pm-blue";
  const chipConf =
    "rounded-full border border-pm-warning/30 bg-pm-warning/10 px-3 py-1 text-[11px] font-semibold text-pm-warning";

  return (
    <div className={`flex flex-col ${gapMajor}`}>
      <div
        className={`flex flex-wrap items-center justify-between gap-3 ${pipelineEmbedded ? "pb-4" : "border-b border-dashed border-pm-border pb-5"}`}
      >
        <div>
          {!pipelineEmbedded && (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pm-violet/90">Intake Agent output</p>
              <h3 className="text-lg font-semibold text-pm-text">Structured intake</h3>
            </>
          )}
          {pipelineEmbedded && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-pm-muted">Intake results</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void handleCopy()}
          disabled={!data}
          className="rounded-[9px] border border-pm-border bg-pm-panel/60 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-pm-subtle transition hover:border-pm-border-active/60 hover:text-pm-text disabled:cursor-not-allowed disabled:opacity-40"
        >
          {copied ? "Copied" : "Copy JSON"}
        </button>
      </div>

      {error && (
        <div className="rounded-[13px] border border-pm-error/35 bg-pm-error/10 px-4 py-3 text-sm text-pm-error">
          {error}
        </div>
      )}

      {!data && !error && (
        <p className="text-sm text-pm-muted">
          Outputs appear once you run <span className="text-pm-subtle">Intake Agent</span> above.
        </p>
      )}

      {data && (
        <>
          <div className={`grid ${gapGrid} md:grid-cols-[2fr_minmax(0,1fr)]`}>
            <OutputCard title="Signals">
              <div className="flex flex-wrap gap-2">
                <span className={chipInput}>Input • {prettifySlug(data.inputType)}</span>
                <span className={chipTask}>Task • {prettifySlug(data.detectedTask)}</span>
                <span className={chipConf}>
                  Confidence • {(Math.round(Math.min(Math.max(data.confidence, 0), 1) * 1000) / 10).toFixed(1)}%
                </span>
              </div>
            </OutputCard>
            <OutputCard title="Trace">
              <p className="text-sm text-pm-subtle">
                Mock mode derives structure from cues in your notes (connect a model later for production fidelity).
              </p>
              {data.sourceExcerptHint && (
                <p className="mt-3 rounded-[11px] border border-pm-border bg-pm-bg/50 p-3 text-xs text-pm-subtle">
                  <span className="font-semibold text-pm-text">Snippet</span>: {data.sourceExcerptHint}
                </p>
              )}
            </OutputCard>
          </div>

          <OutputCard title="Product context">
            <p className="text-[15px] leading-relaxed text-pm-text">{data.productContext.summary}</p>
            <dl className="mt-4 grid gap-3 text-sm text-pm-subtle md:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-pm-muted">Product name captured</dt>
                <dd className="mt-1 text-pm-text">{data.productContext.productNameProvided ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-pm-muted">Target user captured</dt>
                <dd className="mt-1 text-pm-text">{data.productContext.targetUserProvided ?? "—"}</dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-wrap gap-2">
              {data.productContext.userGroupsHinted.map((hint) => (
                <span
                  key={hint}
                  className="rounded-md border border-dashed border-pm-border px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-pm-subtle"
                >
                  {hint}
                </span>
              ))}
              {!data.productContext.userGroupsHinted.length && (
                <p className="text-xs italic text-pm-muted">
                  No quoted segments surfaced — add short persona descriptors for richer tagging.
                </p>
              )}
            </div>
          </OutputCard>

          <div className={`grid ${gapTriple} xl:grid-cols-3`}>
            <OutputCard title="Key observations">{bulletList(data.keyObservations)}</OutputCard>
            <OutputCard title="Potential pain points">{bulletList(data.potentialPainPoints)}</OutputCard>
            <OutputCard title="Potential opportunities">{bulletList(data.potentialOpportunities)}</OutputCard>
          </div>

          <OutputCard title="Missing context questions">{bulletList(data.missingContextQuestions)}</OutputCard>
        </>
      )}
    </div>
  );
}
