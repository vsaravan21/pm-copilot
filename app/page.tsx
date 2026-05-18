"use client";

import { useCallback, useState } from "react";

import { DashboardBackdrop } from "@/components/agents/DashboardBackdrop";
import { IntakeExpandedPanel } from "@/components/agents/IntakeExpandedPanel";
import { PlaceholderAgentExpanded } from "@/components/agents/PlaceholderAgentExpanded";
import { DashboardAgentCard, type DashboardAgentId } from "@/components/DashboardAgentCard";
import { PipelineStrip } from "@/components/PipelineStrip";
import { useIntakeWorkspace } from "@/hooks/useIntakeWorkspace";
import {
  prioritizationBullets,
  specBullets,
  synthesisBullets,
} from "@/lib/agentPlaceholderBullets";
import type { IntakeAgentOutput } from "@/lib/schemas";

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
        <span className="rounded-full border border-pm-pink/30 bg-pm-pink/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-pm-pink">
          {slugLabel(result.inputType)}
        </span>
        <span className="rounded-full border border-pm-blue/30 bg-pm-blue/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-pm-blue">
          {slugLabel(result.detectedTask)}
        </span>
        <span className="rounded-full border border-pm-warning/30 bg-pm-warning/10 px-2.5 py-0.5 text-[10px] font-semibold text-pm-warning">
          {Math.round(Math.min(Math.max(result.confidence, 0), 1) * 100)}% confidence
        </span>
      </div>
    </div>
  );
}

export default function Home() {
  const intake = useIntakeWorkspace();

  const [expanded, setExpanded] = useState<DashboardAgentId | null>(null);

  const toggle = useCallback((id: DashboardAgentId) => {
    setExpanded((prev) => (prev === id ? null : id));
  }, []);

  return (
    <DashboardBackdrop>
      <main className="relative z-10 mx-auto flex max-w-[1180px] flex-col gap-8 px-5 py-12 sm:pl-8 sm:pr-11 lg:gap-10 lg:py-16">
        <header className="relative max-w-[40rem] space-y-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-pm-muted">PM Copilot</p>
          <div
            className="h-[3px] w-14 rounded-full bg-gradient-to-r from-pm-pink via-pm-violet to-pm-blue opacity-[0.85]"
            aria-hidden
          />
          <h1 className="text-[2.05rem] font-semibold leading-[1.12] tracking-tight text-pm-text sm:text-[2.3rem]">
            Agent dashboard
          </h1>
          <p className="text-[15px] leading-[1.62] text-pm-subtle">
            PM Copilot exists to help product managers turn messy product inputs into structured decisions so that
            insight, prioritization, and product specs become easier to create.
          </p>
          <p className="max-w-xl text-[13px] leading-relaxed text-pm-muted">
            Expand a lane to operate it — agents call the configured LLM (mock by default). Intake has a full run
            workflow here; Synthesis, Prioritization, and Spec Writer use the same contracts via API.
          </p>
        </header>

        <PipelineStrip />

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2 lg:gap-6">
          <DashboardAgentCard
            agentId="intake"
            title="Intake Agent"
            badgeText="Active"
            badgeTone="active"
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
            badgeText="Active"
            badgeTone="active"
            description="Clusters themes and evidence-backed insights from raw intake material."
            isExpanded={expanded === "synthesis"}
            onToggle={() => toggle("synthesis")}
            collapsedPreview={
              <p className="text-[13px] leading-relaxed text-pm-subtle">
                POST `/api/synthesis` with `rawInput` and optional `intakeOutput` — themes and insights surface here
                when the UI is wired.
              </p>
            }
            expandedContent={
              <PlaceholderAgentExpanded
                inputLead="Raw notes + Intake Agent output"
                inputDetail="The agent will ingest both verbatim notes and intake JSON to weave narrative + citations."
                bullets={synthesisBullets}
              />
            }
          />

          <DashboardAgentCard
            agentId="prioritization"
            title="Prioritization Agent"
            badgeText="Active"
            badgeTone="active"
            description="Scores and stacks opportunities while spelling out assumptions, risks, and tradeoffs."
            isExpanded={expanded === "prioritization"}
            onToggle={() => toggle("prioritization")}
            collapsedPreview={
              <p className="text-[13px] leading-relaxed text-pm-subtle">
                POST `/api/prioritization` with optional upstream JSON — ranked opportunities when the UI is wired.
              </p>
            }
            expandedContent={
              <PlaceholderAgentExpanded
                inputLead="Synthesis Agent opportunities"
                inputDetail="Expect scored matrices that pair numbers with conversational rationale blocks."
                bullets={prioritizationBullets}
              />
            }
          />

          <DashboardAgentCard
            agentId="spec"
            title="Spec Writer Agent"
            badgeText="Active"
            badgeTone="active"
            description="Drafts stakeholder-ready specs fed by the prioritized storyline and citations."
            isExpanded={expanded === "spec"}
            onToggle={() => toggle("spec")}
            collapsedPreview={
              <p className="text-[13px] leading-relaxed text-pm-subtle">
                POST `/api/spec-writer` with optional pipeline JSON — PRD-shaped output when the UI is wired.
              </p>
            }
            expandedContent={
              <PlaceholderAgentExpanded
                inputLead="Prioritized opportunity + supporting evidence"
                inputDetail="Downstream teams get PRD-first artifacts without retracing upstream discovery chatter."
                bullets={specBullets}
              />
            }
          />
        </div>
      </main>
    </DashboardBackdrop>
  );
}
