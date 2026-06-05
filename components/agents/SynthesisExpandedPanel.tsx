"use client";

import { SynthesisOutput } from "@/components/SynthesisOutput";
import { AGENT_GUIDES } from "@/lib/agentGuides";
import type { SynthesisAgentOutput } from "@/lib/schemas";

import { SectionLabel } from "./SectionLabel";
import { SynthesisInputPanel } from "./SynthesisInputPanel";

export function SynthesisExpandedPanel({
  rawInput,
  setRawInput,
  productName,
  setProductName,
  targetUser,
  setTargetUser,
  useIntakeInsights,
  setUseIntakeInsights,
  addOwnInsights,
  setAddOwnInsights,
  intakeAvailable,
  loading,
  result,
  error,
  canRun,
  onRun,
}: {
  rawInput: string;
  setRawInput: (v: string) => void;
  productName: string;
  setProductName: (v: string) => void;
  targetUser: string;
  setTargetUser: (v: string) => void;
  useIntakeInsights: boolean;
  setUseIntakeInsights: (v: boolean) => void;
  addOwnInsights: boolean;
  setAddOwnInsights: (v: boolean) => void;
  intakeAvailable: boolean;
  loading: boolean;
  result: SynthesisAgentOutput | null;
  error: string | null;
  canRun: boolean;
  onRun: () => void;
}) {
  const guide = AGENT_GUIDES.synthesis;

  return (
    <div className="space-y-8 pt-2">
      <div className="space-y-2">
        <SectionLabel>Input source</SectionLabel>
        <p className="text-sm font-medium text-pm-text">{guide.inputLead}</p>
        <p className="text-sm leading-relaxed text-pm-muted">{guide.inputDetail}</p>
        <div className="mt-3">
          <SynthesisInputPanel
            rawInput={rawInput}
            productName={productName}
            targetUser={targetUser}
            useIntakeInsights={useIntakeInsights}
            addOwnInsights={addOwnInsights}
            intakeAvailable={intakeAvailable}
            loading={loading}
            canRun={canRun}
            onRawInputChange={setRawInput}
            onProductNameChange={setProductName}
            onTargetUserChange={setTargetUser}
            onUseIntakeInsightsChange={setUseIntakeInsights}
            onAddOwnInsightsChange={setAddOwnInsights}
            onRun={onRun}
          />
        </div>
      </div>
      <div className="space-y-3">
        <SectionLabel>Synthesis output</SectionLabel>
        <SynthesisOutput data={result} error={error} compact />
      </div>
    </div>
  );
}
