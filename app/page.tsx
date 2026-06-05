"use client";

import { useCallback, useState } from "react";

import { DashboardBackdrop } from "@/components/agents/DashboardBackdrop";
import { IntakeExpandedPanel } from "@/components/agents/IntakeExpandedPanel";
import { PrioritizationExpandedPanel } from "@/components/agents/PrioritizationExpandedPanel";
import { SpecWriterExpandedPanel } from "@/components/agents/SpecWriterExpandedPanel";
import { SynthesisExpandedPanel } from "@/components/agents/SynthesisExpandedPanel";
import { DashboardAgentCard, type DashboardAgentId } from "@/components/DashboardAgentCard";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useIntakeWorkspace } from "@/hooks/useIntakeWorkspace";
import { usePrioritizationWorkspace } from "@/hooks/usePrioritizationWorkspace";
import { useSpecWriterWorkspace } from "@/hooks/useSpecWriterWorkspace";
import { useSynthesisWorkspace } from "@/hooks/useSynthesisWorkspace";
import type {
  IntakeAgentOutput,
  PrioritizationAgentOutput,
  SpecWriterAgentOutput,
  SynthesisAgentOutput,
} from "@/lib/schemas";

function slugLabel(slug: string): string {
  return slug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function IntakeCollapsedPreview({
  error,
  result,
}: {
  error: string | null;
  result: IntakeAgentOutput | null;
}) {
  if (error) {
    return (
      <p className="line-clamp-3 text-[13px] leading-relaxed text-pm-error">
        {error.length > 160 ? `${error.slice(0, 160)}…` : error}
      </p>
    );
  }
  if (!result) {
    return (
      <p className="text-[13px] leading-relaxed text-pm-subtle">
        Expand to paste raw notes and run intake — structured signals surface here once ready.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      <p className="line-clamp-2 text-[13px] leading-relaxed text-pm-text">
        {result.productContext.summary || "Structured intake captured — open for full breakdown."}
      </p>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-md border border-pm-border bg-pm-panel px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-pm-subtle">
          {slugLabel(result.inputType)}
        </span>
        <span className="rounded-md border border-pm-border-active/30 bg-pm-accent/8 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-pm-accent">
          {slugLabel(result.detectedTask)}
        </span>
        <span className="rounded-md border border-pm-border bg-pm-panel px-2 py-0.5 text-[10px] font-medium text-pm-muted">
          {Math.round(Math.min(Math.max(result.confidence, 0), 1) * 100)}% confidence
        </span>
      </div>
    </div>
  );
}

function SynthesisCollapsedPreview({
  error,
  result,
}: {
  error: string | null;
  result: SynthesisAgentOutput | null;
}) {
  if (error) {
    return (
      <p className="line-clamp-3 text-[13px] leading-relaxed text-pm-error">
        {error.length > 160 ? `${error.slice(0, 160)}…` : error}
      </p>
    );
  }
  if (!result) {
    return (
      <p className="text-[13px] leading-relaxed text-pm-subtle">
        Expand to run synthesis on raw notes with optional Intake context from this session.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      <p className="line-clamp-2 text-[13px] leading-relaxed text-pm-text">
        {result.executiveSummary || "Synthesis complete — open for themes and evidence."}
      </p>
      <div className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wide text-pm-muted">
        <span>{result.themes.length} themes</span>
        <span>·</span>
        <span>{result.opportunityInsights.length} opportunities</span>
        <span>·</span>
        <span>{Math.round(Math.min(Math.max(result.confidence, 0), 1) * 100)}% conf.</span>
      </div>
    </div>
  );
}

function PrioritizationCollapsedPreview({
  error,
  result,
}: {
  error: string | null;
  result: PrioritizationAgentOutput | null;
}) {
  if (error) {
    return (
      <p className="line-clamp-3 text-[13px] leading-relaxed text-pm-error">
        {error.length > 160 ? `${error.slice(0, 160)}…` : error}
      </p>
    );
  }
  if (!result) {
    return (
      <p className="text-[13px] leading-relaxed text-pm-subtle">
        Expand to classify and rank product inputs from Synthesis and/or your own paste.
      </p>
    );
  }
  const rankedItems = Array.isArray(result.rankedItems) ? result.rankedItems : [];
  const top = rankedItems.find((o) => o.rank === 1);
  return (
    <div className="space-y-2">
      <p className="line-clamp-2 text-[13px] leading-relaxed text-pm-text">
        {top
          ? `#1 (${top.inputType}): ${top.title} — ${result.portfolioNarrative.slice(0, 72)}…`
          : result.portfolioNarrative}
      </p>
      <div className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wide text-pm-muted">
        <span>{rankedItems.length} ranked</span>
        <span>·</span>
        <span>{Math.round(Math.min(Math.max(result.confidence, 0), 1) * 100)}% conf.</span>
      </div>
    </div>
  );
}

function SpecWriterCollapsedPreview({
  error,
  result,
}: {
  error: string | null;
  result: SpecWriterAgentOutput | null;
}) {
  if (error) {
    return (
      <p className="line-clamp-3 text-[13px] leading-relaxed text-pm-error">
        {error.length > 160 ? `${error.slice(0, 160)}…` : error}
      </p>
    );
  }
  if (!result) {
    return (
      <p className="text-[13px] leading-relaxed text-pm-subtle">
        Expand to draft a PRD from a prioritized item and/or your own feature idea.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      <p className="line-clamp-2 text-[13px] leading-relaxed text-pm-text">
        {result.prdTitle} — {result.problemStatement.slice(0, 72)}…
      </p>
      <div className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wide text-pm-muted">
        <span>{Array.isArray(result.userStories) ? result.userStories.length : 0} stories</span>
        <span>·</span>
        <span>{Math.round(Math.min(Math.max(result.confidence, 0), 1) * 100)}% conf.</span>
      </div>
    </div>
  );
}

export default function Home() {
  const intake = useIntakeWorkspace();
  const synthesis = useSynthesisWorkspace({ intakeOutput: intake.result });
  const prioritization = usePrioritizationWorkspace({
    synthesisOutput: synthesis.result,
  });
  const specWriter = useSpecWriterWorkspace({
    prioritizationOutput: prioritization.result,
  });

  const [expanded, setExpanded] = useState<DashboardAgentId | null>(null);

  const toggle = useCallback((id: DashboardAgentId) => {
    setExpanded((prev) => (prev === id ? null : id));
  }, []);

  return (
    <DashboardBackdrop>
      <main className="relative z-10 mx-auto flex max-w-[1180px] flex-col gap-10 px-5 py-10 sm:pl-8 sm:pr-11 lg:gap-12 lg:py-14">
        <DashboardHeader />

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2 lg:gap-5">
          <DashboardAgentCard
            agentId="intake"
            title="Intake Agent"
            description="Turns unstructured notes into classified signals covering context, pains, opportunities, and follow-ups."
            isExpanded={expanded === "intake"}
            onToggle={() => toggle("intake")}
            collapsedPreview={<IntakeCollapsedPreview error={intake.error} result={intake.result} />}
            expandedContent={
              <IntakeExpandedPanel
                notes={intake.notes}
                setNotes={intake.setNotes}
                productName={intake.productName}
                setProductName={intake.setProductName}
                targetUser={intake.targetUser}
                setTargetUser={intake.setTargetUser}
                loading={intake.loading}
                result={intake.result}
                error={intake.error}
                onRun={() => void intake.runIntake()}
              />
            }
          />

          <DashboardAgentCard
            agentId="synthesis"
            title="Synthesis Agent"
            description="Clusters themes and evidence-backed insights from raw intake material."
            isExpanded={expanded === "synthesis"}
            onToggle={() => toggle("synthesis")}
            collapsedPreview={
              <SynthesisCollapsedPreview error={synthesis.error} result={synthesis.result} />
            }
            expandedContent={
              <SynthesisExpandedPanel
                rawInput={synthesis.rawInput}
                setRawInput={synthesis.setRawInput}
                productName={synthesis.productName}
                setProductName={synthesis.setProductName}
                targetUser={synthesis.targetUser}
                setTargetUser={synthesis.setTargetUser}
                useIntakeInsights={synthesis.useIntakeInsights}
                setUseIntakeInsights={synthesis.setUseIntakeInsights}
                addOwnInsights={synthesis.addOwnInsights}
                setAddOwnInsights={synthesis.setAddOwnInsights}
                intakeAvailable={synthesis.intakeAvailable}
                loading={synthesis.loading}
                result={synthesis.result}
                error={synthesis.error}
                canRun={synthesis.canRun}
                onRun={() => void synthesis.runSynthesis()}
              />
            }
          />

          <DashboardAgentCard
            agentId="prioritization"
            title="Prioritization Agent"
            description="Scores and stacks opportunities while spelling out assumptions, risks, and tradeoffs."
            isExpanded={expanded === "prioritization"}
            onToggle={() => toggle("prioritization")}
            collapsedPreview={
              <PrioritizationCollapsedPreview
                error={prioritization.error}
                result={prioritization.result}
              />
            }
            expandedContent={
              <PrioritizationExpandedPanel
                rawInput={prioritization.rawInput}
                setRawInput={prioritization.setRawInput}
                productName={prioritization.productName}
                setProductName={prioritization.setProductName}
                targetUser={prioritization.targetUser}
                setTargetUser={prioritization.setTargetUser}
                useSynthesisOpportunities={prioritization.useSynthesisOpportunities}
                setUseSynthesisOpportunities={prioritization.setUseSynthesisOpportunities}
                addOwnOpportunities={prioritization.addOwnOpportunities}
                setAddOwnOpportunities={prioritization.setAddOwnOpportunities}
                synthesisAvailable={prioritization.synthesisAvailable}
                loading={prioritization.loading}
                rerankInstruction={prioritization.rerankInstruction}
                setRerankInstruction={prioritization.setRerankInstruction}
                rerankLoading={prioritization.rerankLoading}
                result={prioritization.result}
                error={prioritization.error}
                canRun={prioritization.canRun}
                canRerank={prioritization.canRerank}
                onRun={() => void prioritization.runPrioritization()}
                onRerank={() => void prioritization.rerankPrioritization()}
              />
            }
          />

          <DashboardAgentCard
            agentId="spec"
            title="Spec Writer Agent"
            description="Turns product thinking into an editable PRD you can copy or download as PDF for stakeholders."
            isExpanded={expanded === "spec"}
            onToggle={() => toggle("spec")}
            collapsedPreview={
              <SpecWriterCollapsedPreview error={specWriter.error} result={specWriter.result} />
            }
            expandedContent={
              <SpecWriterExpandedPanel
                rawInput={specWriter.rawInput}
                setRawInput={specWriter.setRawInput}
                productName={specWriter.productName}
                setProductName={specWriter.setProductName}
                targetUser={specWriter.targetUser}
                setTargetUser={specWriter.setTargetUser}
                usePrioritizedItem={specWriter.usePrioritizedItem}
                setUsePrioritizedItem={specWriter.setUsePrioritizedItem}
                addOwnIdea={specWriter.addOwnIdea}
                setAddOwnIdea={specWriter.setAddOwnIdea}
                rankedItems={specWriter.rankedItems}
                selectedRankedItemId={specWriter.selectedRankedItemId}
                setSelectedRankedItemId={specWriter.setSelectedRankedItemId}
                prioritizationAvailable={specWriter.prioritizationAvailable}
                loading={specWriter.loading}
                refinementInstruction={specWriter.refinementInstruction}
                setRefinementInstruction={specWriter.setRefinementInstruction}
                refineLoading={specWriter.refineLoading}
                result={specWriter.result}
                error={specWriter.error}
                canRun={specWriter.canRun}
                canRefine={specWriter.canRefine}
                onRun={() => void specWriter.runSpecWriter()}
                onRefine={() => void specWriter.refinePrd()}
              />
            }
          />
        </div>
      </main>
    </DashboardBackdrop>
  );
}
