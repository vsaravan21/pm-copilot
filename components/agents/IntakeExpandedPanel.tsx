import { InputPanel } from "@/components/InputPanel";
import { IntakeOutput } from "@/components/IntakeOutput";
import type { IntakeAgentOutput } from "@/lib/schemas";

import { SectionLabel } from "./SectionLabel";

export function IntakeExpandedPanel({
  notes,
  setNotes,
  productName,
  setProductName,
  targetUser,
  setTargetUser,
  loading,
  result,
  error,
  onRun,
}: {
  notes: string;
  setNotes: (v: string) => void;
  productName: string;
  setProductName: (v: string) => void;
  targetUser: string;
  setTargetUser: (v: string) => void;
  loading: boolean;
  result: IntakeAgentOutput | null;
  error: string | null;
  onRun: () => void;
}) {
  return (
    <div className="space-y-8 pt-2">
      <div className="space-y-2">
        <SectionLabel>Input source</SectionLabel>
        <p className="text-sm leading-relaxed text-pm-subtle">Raw notes + optional product context</p>
        <div className="mt-3">
          <InputPanel
            notes={notes}
            productName={productName}
            targetUser={targetUser}
            loading={loading}
            onNotesChange={setNotes}
            onProductNameChange={setProductName}
            onTargetUserChange={setTargetUser}
            onRun={onRun}
            compact
          />
        </div>
      </div>
      <div className="space-y-3">
        <SectionLabel>Structured output</SectionLabel>
        <IntakeOutput data={result} error={error} pipelineEmbedded compact />
      </div>
    </div>
  );
}
