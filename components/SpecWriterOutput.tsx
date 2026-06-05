"use client";

import { useState, type ReactNode } from "react";

import { downloadPrdPdf } from "@/lib/spec/generatePrdPdf";
import { formatPrdDocument } from "@/lib/spec/formatPrdDocument";
import type { SpecWriterAgentOutput, UserStoryDraft } from "@/lib/schemas";

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

function PrdSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-pm-border/80 pb-5 last:border-0 last:pb-0">
      <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-pm-violet/85">
        {title}
      </h4>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

function UserStoriesBlock({ stories }: { stories: UserStoryDraft[] }) {
  if (!stories.length) {
    return <p className="text-sm text-pm-muted">None listed.</p>;
  }
  return (
    <div className="space-y-4">
      {stories.map((story, index) => (
        <article
          key={`${index}-${story.title.slice(0, 24)}`}
          className="rounded-[11px] border border-pm-border/70 bg-pm-bg/40 px-3.5 py-3"
        >
          <h5 className="text-[15px] font-semibold text-pm-text">{story.title}</h5>
          <p className="mt-1.5 text-sm leading-relaxed text-pm-subtle">{story.description}</p>
          {story.acceptanceCriteria.length > 0 && (
            <div className="mt-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-pm-muted">
                Acceptance criteria
              </p>
              <div className="mt-1">{bulletList(story.acceptanceCriteria)}</div>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

export function SpecWriterOutput({
  data,
  error,
  compact = false,
}: {
  data: SpecWriterAgentOutput | null;
  error: string | null;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  async function handleCopyPrd() {
    if (!data) return;
    await navigator.clipboard.writeText(formatPrdDocument(data));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function handleDownloadPdf() {
    if (!data) return;
    setPdfBusy(true);
    try {
      downloadPrdPdf(data);
    } finally {
      setTimeout(() => setPdfBusy(false), 600);
    }
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
        Run the Spec Writer to generate a PRD draft you can copy or download as PDF.
      </p>
    );
  }

  const confPct = Math.round(Math.min(Math.max(data.confidence, 0), 1) * 100);

  return (
    <div className={`flex flex-col ${compact ? "gap-3" : "gap-4"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-pm-border pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pm-violet/90">
            PRD draft
          </p>
          <h3 className="text-lg font-semibold leading-snug text-pm-text">{data.prdTitle}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-pm-warning/30 bg-pm-warning/10 px-3 py-1 text-[11px] font-semibold text-pm-warning">
            {confPct}% confidence
          </span>
          <button
            type="button"
            onClick={() => void handleCopyPrd()}
            className="rounded-lg border border-pm-border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-pm-muted transition hover:border-pm-violet/40 hover:text-pm-text"
          >
            {copied ? "Copied" : "Copy PRD"}
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={pdfBusy}
            className="rounded-lg border border-pm-violet/35 bg-pm-violet/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-pm-violet transition hover:bg-pm-violet/18 disabled:opacity-50"
          >
            {pdfBusy ? "Preparing…" : "Download PDF"}
          </button>
        </div>
      </div>

      {data.revisionSummary && (
        <div className="rounded-[11px] border border-pm-violet/25 bg-pm-violet/8 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-pm-violet/90">
            Revision summary
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-pm-text">{data.revisionSummary}</p>
        </div>
      )}

      <article className="rounded-[15px] border border-pm-border bg-pm-panel/50 px-5 py-5 shadow-[0_16px_44px_-36px_rgba(0,0,0,0.85)] sm:px-6 sm:py-6">
        <div className="space-y-5">
          <PrdSection title="Problem statement">
            <p className="text-[15px] leading-relaxed text-pm-text">{data.problemStatement}</p>
          </PrdSection>

          <PrdSection title="Target users">{bulletList(data.targetUsers)}</PrdSection>

          <PrdSection title="Goals">{bulletList(data.goals)}</PrdSection>

          <PrdSection title="Non-goals">{bulletList(data.nonGoals)}</PrdSection>

          <PrdSection title="Proposed solution">
            <p className="text-[15px] leading-relaxed text-pm-text">{data.proposedSolution}</p>
          </PrdSection>

          {data.featureRecommendations.length > 0 && (
            <PrdSection title="Feature recommendations">
              {bulletList(data.featureRecommendations)}
            </PrdSection>
          )}

          <PrdSection title="User stories">
            <UserStoriesBlock stories={data.userStories} />
          </PrdSection>

          <PrdSection title="Core requirements">{bulletList(data.coreRequirements)}</PrdSection>

          <PrdSection title="Success metrics">{bulletList(data.successMetrics)}</PrdSection>

          <PrdSection title="Launch considerations">
            {bulletList(data.launchConsiderations)}
          </PrdSection>

          <PrdSection title="Risks">{bulletList(data.risks)}</PrdSection>

          <PrdSection title="Open questions">{bulletList(data.openQuestions)}</PrdSection>

          <PrdSection title="Next steps">{bulletList(data.nextSteps)}</PrdSection>

          {data.sourceContext.length > 0 && (
            <PrdSection title="Source context & evidence">
              {bulletList(data.sourceContext)}
            </PrdSection>
          )}
        </div>
      </article>
    </div>
  );
}
