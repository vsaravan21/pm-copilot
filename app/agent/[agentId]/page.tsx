"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";

import { DashboardBackdrop } from "@/components/agents/DashboardBackdrop";
import { IntakeExpandedPanel } from "@/components/agents/IntakeExpandedPanel";
import { PlaceholderAgentExpanded } from "@/components/agents/PlaceholderAgentExpanded";
import { useIntakeWorkspace } from "@/hooks/useIntakeWorkspace";
import { isAgentRouteId } from "@/lib/agentRoutes";
import {
  prioritizationBullets,
  specBullets,
  synthesisBullets,
} from "@/lib/agentPlaceholderBullets";

const TITLES = {
  intake: "Intake Agent",
  synthesis: "Synthesis Agent",
  prioritization: "Prioritization Agent",
  spec: "Spec Writer Agent",
} as const;

const SUBTITLES = {
  intake: "Structure messy inputs into classified signals, context, and opportunities.",
  synthesis: "Thematic synthesis with evidence-backed narratives (API: POST /api/synthesis).",
  prioritization: "Scored opportunities with explicit tradeoffs and risks (API: POST /api/prioritization).",
  spec: "PRD-style drafts from prioritized inputs (API: POST /api/spec-writer).",
} as const;

export default function AgentWorkspacePage() {
  const params = useParams();
  const raw = params.agentId;
  const agentId = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";

  if (!isAgentRouteId(agentId)) {
    notFound();
  }

  const intake = useIntakeWorkspace();

  return (
    <DashboardBackdrop>
      <main className="relative z-10 mx-auto max-w-[920px] px-5 py-10 sm:px-8 lg:py-14">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-pm-border pb-6">
          <Link
            href="/"
            className="text-[13px] font-medium text-pm-muted underline-offset-4 transition hover:text-pm-text hover:underline"
          >
            ← Back to dashboard
          </Link>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-pm-muted">PM Copilot · Focused lane</p>
        </div>

        <header className="mb-10 max-w-2xl space-y-3">
          <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-pm-text sm:text-[1.85rem]">
            {TITLES[agentId]}
          </h1>
          <p className="text-sm leading-relaxed text-pm-subtle">{SUBTITLES[agentId]}</p>
        </header>

        <div className="rounded-[17px] border border-pm-border bg-pm-card/95 p-5 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.85)] backdrop-blur-xl sm:p-8">
          {agentId === "intake" && (
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
          )}
          {agentId === "synthesis" && (
            <PlaceholderAgentExpanded
              inputLead="Raw notes + Intake Agent output"
              inputDetail="This agent will ingest verbatim notes and intake JSON to weave narrative and citations."
              bullets={synthesisBullets}
            />
          )}
          {agentId === "prioritization" && (
            <PlaceholderAgentExpanded
              inputLead="Synthesis Agent opportunities"
              inputDetail="Expect scored matrices that pair numbers with conversational rationale blocks."
              bullets={prioritizationBullets}
            />
          )}
          {agentId === "spec" && (
            <PlaceholderAgentExpanded
              inputLead="Prioritized opportunity + supporting evidence"
              inputDetail="Artifacts built for downstream teams without retracing upstream discovery chatter."
              bullets={specBullets}
            />
          )}
        </div>
      </main>
    </DashboardBackdrop>
  );
}
