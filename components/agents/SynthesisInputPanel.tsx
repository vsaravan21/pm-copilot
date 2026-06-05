"use client";

import { SectionLabel } from "./SectionLabel";

const inputClass =
  "w-full rounded-[11px] border border-pm-border bg-pm-bg/60 px-3 py-2.5 text-[15px] text-pm-text shadow-inner shadow-black/30 outline-none transition placeholder:text-pm-muted/55 focus:border-pm-border-active/50 focus:ring-2 focus:ring-pm-violet/25";

const textareaClass =
  "w-full rounded-[14px] border border-pm-border bg-pm-bg/55 px-4 py-3 font-mono text-[13.5px] leading-relaxed text-pm-text shadow-inner shadow-black/35 outline-none transition placeholder:text-pm-muted/55 focus:border-pm-border-active/45 focus:ring-2 focus:ring-pm-violet/25";

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
  useIntakeInsights: boolean;
  addOwnInsights: boolean;
  intakeAvailable: boolean;
  loading: boolean;
  canRun: boolean;
  onRawInputChange: (v: string) => void;
  onProductNameChange: (v: string) => void;
  onTargetUserChange: (v: string) => void;
  onUseIntakeInsightsChange: (v: boolean) => void;
  onAddOwnInsightsChange: (v: boolean) => void;
  onRun: () => void;
};

function runHint(
  useIntakeInsights: boolean,
  addOwnInsights: boolean,
  intakeAvailable: boolean,
  rawInput: string,
  canRun: boolean,
): string | null {
  if (canRun) return null;
  if (!useIntakeInsights && !addOwnInsights) {
    return "Select at least one input source";
  }
  if (useIntakeInsights && !intakeAvailable) {
    return "Run Intake on the dashboard first";
  }
  if (addOwnInsights && !rawInput.trim()) {
    return "Add notes under your own insights, or enable Intake insights";
  }
  return "Complete the selected input sources";
}

export function SynthesisInputPanel({
  rawInput,
  productName,
  targetUser,
  useIntakeInsights,
  addOwnInsights,
  intakeAvailable,
  loading,
  canRun,
  onRawInputChange,
  onProductNameChange,
  onTargetUserChange,
  onUseIntakeInsightsChange,
  onAddOwnInsightsChange,
  onRun,
}: Props) {
  const hint = runHint(
    useIntakeInsights,
    addOwnInsights,
    intakeAvailable,
    rawInput,
    canRun,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <SourceOption
          title="Use insights from the Intake Agent"
          description={
            intakeAvailable
              ? "Includes observations, pains, opportunities, and context from your latest Intake run in this session."
              : "Run the Intake Agent first — its output will appear here when available."
          }
          checked={useIntakeInsights}
          disabled={!intakeAvailable}
          onChange={onUseIntakeInsightsChange}
        />
        <SourceOption
          title="Add your own insights"
          description="Paste interviews, notes, feedback, or brainstorms with optional product and user context."
          checked={addOwnInsights}
          onChange={onAddOwnInsightsChange}
        />
      </div>

      {addOwnInsights && (
        <div className="space-y-4 rounded-[13px] border border-pm-border bg-pm-panel/40 px-4 py-4">
          <SectionLabel>Add your own insights</SectionLabel>

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
            <span className="font-medium text-pm-text">Raw notes, interviews, or feedback</span>
            <textarea
              rows={8}
              value={rawInput}
              onChange={(e) => onRawInputChange(e.target.value)}
              placeholder="Paste the same material you used for Intake, or new research verbatim..."
              spellCheck={false}
              className={textareaClass}
            />
          </label>
        </div>
      )}

      {useIntakeInsights && intakeAvailable && (
        <p className="rounded-[10px] border border-pm-success/25 bg-pm-success/8 px-3 py-2 text-[12px] text-pm-success">
          Intake output from this session will be sent with your synthesis request.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onRun}
          disabled={loading || !canRun}
          className="inline-flex items-center justify-center rounded-[11px] bg-[image:var(--gradient-accent)] px-6 py-2.5 text-sm font-semibold text-[#FAF8FF] shadow-[0_10px_36px_-10px_rgba(155,92,255,0.55)] transition hover:-translate-y-px hover:shadow-[0_14px_42px_-10px_rgba(155,92,255,0.62)] disabled:pointer-events-none disabled:opacity-45"
        >
          {loading ? "Running…" : "Run Synthesis Agent"}
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
