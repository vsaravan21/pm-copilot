"use client";

import type { RankedPrioritizationItem } from "@/lib/schemas";

import { SectionLabel } from "./SectionLabel";

const inputClass =
  "w-full rounded-[11px] border border-pm-border bg-pm-bg/60 px-3 py-2.5 text-[15px] text-pm-text shadow-inner shadow-black/30 outline-none transition placeholder:text-pm-muted/55 focus:border-pm-border-active/50 focus:ring-2 focus:ring-pm-violet/25";

const textareaClass =
  "w-full rounded-[14px] border border-pm-border bg-pm-bg/55 px-4 py-3 font-mono text-[13.5px] leading-relaxed text-pm-text shadow-inner shadow-black/35 outline-none transition placeholder:text-pm-muted/55 focus:border-pm-border-active/45 focus:ring-2 focus:ring-pm-violet/25";

const selectClass =
  "w-full rounded-[11px] border border-pm-border bg-pm-bg/60 px-3 py-2.5 text-[14px] text-pm-text outline-none focus:border-pm-border-active/50 focus:ring-2 focus:ring-pm-violet/25";

function SourceOption({
  checked,
  disabled,
  title,
  description,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  title: string;
  description: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className={`flex items-start gap-3 rounded-[11px] border px-3 py-2.5 transition ${
        disabled
          ? "cursor-not-allowed border-pm-border/60 bg-pm-panel/30 opacity-60"
          : checked
            ? "border-pm-border-active/40 bg-pm-panel/70"
            : "cursor-pointer border-pm-border bg-pm-panel/50 hover:border-pm-border-active/35"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 size-4 shrink-0 rounded border-pm-border accent-pm-violet"
      />
      <span className="text-[13px] leading-relaxed text-pm-subtle">
        <span className="font-medium text-pm-text">{title}</span>
        <br />
        {description}
      </span>
    </label>
  );
}

type Props = {
  rawInput: string;
  productName: string;
  targetUser: string;
  usePrioritizedItem: boolean;
  addOwnIdea: boolean;
  prioritizationAvailable: boolean;
  rankedItems: RankedPrioritizationItem[];
  selectedRankedItemId: string | null;
  loading: boolean;
  canRun: boolean;
  onRawInputChange: (v: string) => void;
  onProductNameChange: (v: string) => void;
  onTargetUserChange: (v: string) => void;
  onUsePrioritizedItemChange: (v: boolean) => void;
  onAddOwnIdeaChange: (v: boolean) => void;
  onSelectedRankedItemIdChange: (v: string) => void;
  onRun: () => void;
};

function runHint(
  usePrioritized: boolean,
  addOwn: boolean,
  prioritizationAvailable: boolean,
  rawInput: string,
  selectedId: string | null,
  canRun: boolean,
): string | null {
  if (canRun) return null;
  if (!usePrioritized && !addOwn) return "Select at least one input source";
  if (usePrioritized && !prioritizationAvailable) return "Run Prioritization on the dashboard first";
  if (usePrioritized && !selectedId) return "Select a prioritized item";
  if (addOwn && !rawInput.trim()) {
    return "Add your own idea, or enable a prioritized item";
  }
  return "Complete the selected input sources";
}

export function SpecWriterInputPanel({
  rawInput,
  productName,
  targetUser,
  usePrioritizedItem,
  addOwnIdea,
  prioritizationAvailable,
  rankedItems,
  selectedRankedItemId,
  loading,
  canRun,
  onRawInputChange,
  onProductNameChange,
  onTargetUserChange,
  onUsePrioritizedItemChange,
  onAddOwnIdeaChange,
  onSelectedRankedItemIdChange,
  onRun,
}: Props) {
  const hint = runHint(
    usePrioritizedItem,
    addOwnIdea,
    prioritizationAvailable,
    rawInput,
    selectedRankedItemId,
    canRun,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <SourceOption
          title="Use prioritized item from the Prioritization Agent"
          description={
            prioritizationAvailable
              ? "Uses rank, scores, rationale, tradeoffs, assumptions, and risks from your selected item."
              : "Run the Prioritization Agent first — ranked items will appear here when ready."
          }
          checked={usePrioritizedItem}
          disabled={!prioritizationAvailable}
          onChange={onUsePrioritizedItemChange}
        />
        <SourceOption
          title="Add your own feature, opportunity, or product idea"
          description="Paste a rough feature concept, stakeholder request, opportunity, solution, notes, or requirements."
          checked={addOwnIdea}
          onChange={onAddOwnIdeaChange}
        />
      </div>

      {usePrioritizedItem && prioritizationAvailable && (
        <div className="rounded-[13px] border border-pm-border bg-pm-panel/40 px-4 py-4">
          <label className="space-y-2 text-sm text-pm-subtle">
            <span className="font-medium text-pm-text">Prioritized item</span>
            <select
              value={selectedRankedItemId ?? ""}
              onChange={(e) => onSelectedRankedItemIdChange(e.target.value)}
              className={selectClass}
            >
              {rankedItems.map((item) => (
                <option key={item.id} value={item.id}>
                  #{item.rank} · {item.title} (score {item.priorityScore}, {item.inputType})
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {addOwnIdea && (
        <div className="space-y-4 rounded-[13px] border border-pm-border bg-pm-panel/40 px-4 py-4">
          <SectionLabel>Your product idea</SectionLabel>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-2 text-sm text-pm-subtle">
              <span className="font-medium text-pm-text">Product name (optional)</span>
              <input
                type="text"
                value={productName}
                onChange={(e) => onProductNameChange(e.target.value)}
                placeholder="e.g. Northstar Console"
                className={inputClass}
              />
            </label>
            <label className="space-y-2 text-sm text-pm-subtle">
              <span className="font-medium text-pm-text">Target user (optional)</span>
              <input
                type="text"
                value={targetUser}
                onChange={(e) => onTargetUserChange(e.target.value)}
                placeholder="e.g. Enterprise admins"
                className={inputClass}
              />
            </label>
          </div>

          <label className="space-y-2 text-sm text-pm-subtle">
            <span className="font-medium text-pm-text">Feature, opportunity, or requirements</span>
            <textarea
              rows={8}
              value={rawInput}
              onChange={(e) => onRawInputChange(e.target.value)}
              placeholder={`Describe what to spec — e.g.\n• Build self-serve billing export for finance admins\n• Reduce onboarding drop-off at step 3\n• Stakeholder: SSO for enterprise by Q4`}
              spellCheck={false}
              className={textareaClass}
            />
          </label>
        </div>
      )}

      {usePrioritizedItem && prioritizationAvailable && (
        <p className="rounded-[10px] border border-pm-success/25 bg-pm-success/8 px-3 py-2 text-[12px] text-pm-success">
          Prioritization context from this session will ground the PRD in ranked rationale and risks.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onRun}
          disabled={loading || !canRun}
          className="inline-flex items-center justify-center rounded-[11px] bg-[image:var(--gradient-accent)] px-6 py-2.5 text-sm font-semibold text-[#FAF8FF] shadow-[0_10px_36px_-10px_rgba(155,92,255,0.55)] transition hover:-translate-y-px hover:shadow-[0_14px_42px_-10px_rgba(155,92,255,0.62)] disabled:pointer-events-none disabled:opacity-45"
        >
          {loading ? "Running…" : "Run Spec Writer Agent"}
        </button>
        {hint && (
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-pm-muted">
            {hint}
          </span>
        )}
      </div>
    </div>
  );
}
