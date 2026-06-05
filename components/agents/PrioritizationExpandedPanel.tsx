"use client";

import { PrioritizationOutput } from "@/components/PrioritizationOutput";
import { PRIORITIZATION_RERANK_PRESETS } from "@/lib/agentIterationPresets";
import { AGENT_GUIDES } from "@/lib/agentGuides";
import type { PrioritizationAgentOutput } from "@/lib/schemas";

import { AgentIterationPanel } from "./AgentIterationPanel";
import { PrioritizationInputPanel } from "./PrioritizationInputPanel";
import { SectionLabel } from "./SectionLabel";

export function PrioritizationExpandedPanel({
  rawInput,
  setRawInput,
  productName,
  setProductName,
  targetUser,
  setTargetUser,
  useSynthesisOpportunities,
  setUseSynthesisOpportunities,
  addOwnOpportunities,
  setAddOwnOpportunities,
  synthesisAvailable,
  loading,
  rerankInstruction,
  setRerankInstruction,
  rerankLoading,
  result,
  error,
  canRun,
  canRerank,
  onRun,
  onRerank,
}: {
  rawInput: string;
  setRawInput: (v: string) => void;
  productName: string;
  setProductName: (v: string) => void;
  targetUser: string;
  setTargetUser: (v: string) => void;
  useSynthesisOpportunities: boolean;
  setUseSynthesisOpportunities: (v: boolean) => void;
  addOwnOpportunities: boolean;
  setAddOwnOpportunities: (v: boolean) => void;
  synthesisAvailable: boolean;
  loading: boolean;
  result: PrioritizationAgentOutput | null;
  error: string | null;
  rerankInstruction: string;
  setRerankInstruction: (v: string) => void;
  rerankLoading: boolean;
  canRerank: boolean;
  canRun: boolean;
  onRun: () => void;
  onRerank: () => void;
}) {
  const guide = AGENT_GUIDES.prioritization;

  return (
    <div className="space-y-8 pt-2">
      <div className="space-y-2">
        <SectionLabel>Input source</SectionLabel>
        <p className="text-sm font-medium text-pm-text">{guide.inputLead}</p>
        <p className="text-sm leading-relaxed text-pm-muted">{guide.inputDetail}</p>
        <div className="mt-3">
          <PrioritizationInputPanel
            rawInput={rawInput}
            productName={productName}
            targetUser={targetUser}
            useSynthesisOpportunities={useSynthesisOpportunities}
            addOwnOpportunities={addOwnOpportunities}
            synthesisAvailable={synthesisAvailable}
            loading={loading}
            canRun={canRun}
            onRawInputChange={setRawInput}
            onProductNameChange={setProductName}
            onTargetUserChange={setTargetUser}
            onUseSynthesisOpportunitiesChange={setUseSynthesisOpportunities}
            onAddOwnOpportunitiesChange={setAddOwnOpportunities}
            onRun={onRun}
          />
        </div>
      </div>
      <div className="space-y-3">
        <SectionLabel>Prioritization output</SectionLabel>
        <PrioritizationOutput data={result} error={error} compact />
      </div>

      {result && !error && (
        <div className="space-y-3">
          <SectionLabel>Adjust prioritization lens</SectionLabel>
          <AgentIterationPanel
            title="Rerank the same opportunities"
            description="Shift decision criteria—fastest MVP, impact, evidence, risk, and more—without re-entering inputs."
            placeholder="e.g. Prioritize for fastest MVP and penalize high-risk items"
            instruction={rerankInstruction}
            presets={PRIORITIZATION_RERANK_PRESETS}
            buttonLabel="Rerank Opportunities"
            loadingLabel="Reranking…"
            loading={rerankLoading}
            disabled={!canRerank}
            onInstructionChange={setRerankInstruction}
            onSubmit={onRerank}
          />
        </div>
      )}
    </div>
  );
}
