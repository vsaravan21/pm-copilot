"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";

import { AgentInfoButton } from "@/components/agents/AgentInfoButton";
import { DashboardBackdrop } from "@/components/agents/DashboardBackdrop";
import { IntakeExpandedPanel } from "@/components/agents/IntakeExpandedPanel";
import { PrioritizationExpandedPanel } from "@/components/agents/PrioritizationExpandedPanel";
import { SpecWriterExpandedPanel } from "@/components/agents/SpecWriterExpandedPanel";
import { SynthesisExpandedPanel } from "@/components/agents/SynthesisExpandedPanel";
import { useIntakeWorkspace } from "@/hooks/useIntakeWorkspace";
import { usePrioritizationWorkspace } from "@/hooks/usePrioritizationWorkspace";
import { useSpecWriterWorkspace } from "@/hooks/useSpecWriterWorkspace";
import { useSynthesisWorkspace } from "@/hooks/useSynthesisWorkspace";
import { AGENT_GUIDES } from "@/lib/agentGuides";
import type { DashboardAgentId } from "@/components/DashboardAgentCard";
import { isAgentRouteId } from "@/lib/agentRoutes";

const TITLES: Record<DashboardAgentId, string> = {
  intake: "Intake Agent",
  synthesis: "Synthesis Agent",
  prioritization: "Prioritization Agent",
  spec: "Spec Writer Agent",
};

export default function AgentWorkspacePage() {
  const params = useParams();
  const raw = params.agentId;
  const agentId = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";

  if (!isAgentRouteId(agentId)) {
    notFound();
  }

  const intake = useIntakeWorkspace();
  const synthesis = useSynthesisWorkspace({ intakeOutput: intake.result });
  const prioritization = usePrioritizationWorkspace({
    synthesisOutput: synthesis.result,
  });
  const specWriter = useSpecWriterWorkspace({
    prioritizationOutput: prioritization.result,
  });
  const guide = AGENT_GUIDES[agentId];

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
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-pm-text sm:text-[1.85rem]">
              {TITLES[agentId]}
            </h1>
            <AgentInfoButton agentId={agentId} />
          </div>
          <p className="text-sm leading-relaxed text-pm-subtle">{guide.howItWorks}</p>
        </header>

        <div className="rounded-xl border border-pm-border bg-pm-card p-5 sm:p-8">
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
          )}
          {agentId === "prioritization" && (
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
          )}
          {agentId === "spec" && (
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
          )}
        </div>
      </main>
    </DashboardBackdrop>
  );
}
