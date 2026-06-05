"use client";

import { SpecWriterOutput } from "@/components/SpecWriterOutput";
import { SPEC_WRITER_REFINE_PRESETS } from "@/lib/agentIterationPresets";
import { AGENT_GUIDES } from "@/lib/agentGuides";
import type { RankedPrioritizationItem, SpecWriterAgentOutput } from "@/lib/schemas";

import { AgentIterationPanel } from "./AgentIterationPanel";
import { SpecWriterInputPanel } from "./SpecWriterInputPanel";
import { SectionLabel } from "./SectionLabel";

export function SpecWriterExpandedPanel({
  rawInput,
  setRawInput,
  productName,
  setProductName,
  targetUser,
  setTargetUser,
  usePrioritizedItem,
  setUsePrioritizedItem,
  addOwnIdea,
  setAddOwnIdea,
  rankedItems,
  selectedRankedItemId,
  setSelectedRankedItemId,
  prioritizationAvailable,
  loading,
  result,
  error,
  refinementInstruction,
  setRefinementInstruction,
  refineLoading,
  canRefine,
  canRun,
  onRun,
  onRefine,
}: {
  rawInput: string;
  setRawInput: (v: string) => void;
  productName: string;
  setProductName: (v: string) => void;
  targetUser: string;
  setTargetUser: (v: string) => void;
  usePrioritizedItem: boolean;
  setUsePrioritizedItem: (v: boolean) => void;
  addOwnIdea: boolean;
  setAddOwnIdea: (v: boolean) => void;
  rankedItems: RankedPrioritizationItem[];
  selectedRankedItemId: string | null;
  setSelectedRankedItemId: (v: string | null) => void;
  prioritizationAvailable: boolean;
  loading: boolean;
  result: SpecWriterAgentOutput | null;
  error: string | null;
  refinementInstruction: string;
  setRefinementInstruction: (v: string) => void;
  refineLoading: boolean;
  canRefine: boolean;
  canRun: boolean;
  onRun: () => void;
  onRefine: () => void;
}) {
  const guide = AGENT_GUIDES.spec;

  return (
    <div className="space-y-8 pt-2">
      <div className="space-y-2">
        <SectionLabel>Input source</SectionLabel>
        <p className="text-sm font-medium text-pm-text">{guide.inputLead}</p>
        <p className="text-sm leading-relaxed text-pm-muted">{guide.inputDetail}</p>
        <div className="mt-3">
          <SpecWriterInputPanel
            rawInput={rawInput}
            productName={productName}
            targetUser={targetUser}
            usePrioritizedItem={usePrioritizedItem}
            addOwnIdea={addOwnIdea}
            prioritizationAvailable={prioritizationAvailable}
            rankedItems={rankedItems}
            selectedRankedItemId={selectedRankedItemId}
            loading={loading}
            canRun={canRun}
            onRawInputChange={setRawInput}
            onProductNameChange={setProductName}
            onTargetUserChange={setTargetUser}
            onUsePrioritizedItemChange={setUsePrioritizedItem}
            onAddOwnIdeaChange={setAddOwnIdea}
            onSelectedRankedItemIdChange={(id) => setSelectedRankedItemId(id)}
            onRun={onRun}
          />
        </div>
      </div>
      <div className="space-y-3">
        <SectionLabel>PRD output</SectionLabel>
        <SpecWriterOutput data={result} error={error} compact />
      </div>

      {result && !error && (
        <div className="space-y-3">
          <SectionLabel>Refine PRD</SectionLabel>
          <AgentIterationPanel
            title="Iterate on this draft"
            description="Revise the current PRD in place—scope, tone, metrics, stories—while keeping your original inputs and prioritization context."
            placeholder="e.g. Narrow the MVP scope and add stronger success metrics"
            instruction={refinementInstruction}
            presets={SPEC_WRITER_REFINE_PRESETS}
            buttonLabel="Refine PRD"
            loadingLabel="Refining…"
            loading={refineLoading}
            disabled={!canRefine}
            onInstructionChange={setRefinementInstruction}
            onSubmit={onRefine}
          />
        </div>
      )}
    </div>
  );
}
