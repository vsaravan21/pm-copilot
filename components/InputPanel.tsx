"use client";

const inputClass =
  "w-full rounded-[11px] border border-pm-border bg-pm-bg/60 px-3 py-2.5 text-[15px] text-pm-text shadow-inner shadow-black/30 outline-none transition placeholder:text-pm-muted/55 focus:border-pm-border-active/50 focus:ring-2 focus:ring-pm-violet/25";

const textareaClass =
  "w-full rounded-[14px] border border-pm-border bg-pm-bg/55 px-4 py-3 font-mono text-[13.5px] leading-relaxed text-pm-text shadow-inner shadow-black/35 outline-none transition placeholder:text-pm-muted/55 focus:border-pm-border-active/45 focus:ring-2 focus:ring-pm-violet/25";

type InputPanelProps = {
  notes: string;
  productName: string;
  targetUser: string;
  loading: boolean;
  onNotesChange: (value: string) => void;
  onProductNameChange: (value: string) => void;
  onTargetUserChange: (value: string) => void;
  onRun: () => void;
  compact?: boolean;
};

export function InputPanel({
  notes,
  productName,
  targetUser,
  loading,
  onNotesChange,
  onProductNameChange,
  onTargetUserChange,
  onRun,
  compact = false,
}: InputPanelProps) {
  const disabled = loading || notes.trim().length === 0;

  return (
    <div className={compact ? "flex flex-col gap-4" : "flex flex-col gap-6"}>
      {!compact && (
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-pm-muted">Intake source</p>
          <h2 className="text-xl font-semibold text-pm-text">Paste notes and context</h2>
          <p className="text-sm leading-relaxed text-pm-subtle">
            Raw material stays attributable as it flows through synthesis and downstream agents.
          </p>
        </header>
      )}

      <div className={`grid md:grid-cols-2 ${compact ? "gap-3" : "gap-5"}`}>
        <label className="space-y-2 text-sm text-pm-subtle">
          <span className="font-medium text-pm-text">Product name (optional)</span>
          <input
            type="text"
            value={productName}
            onChange={(event) => onProductNameChange(event.target.value)}
            placeholder="e.g. Northstar Console"
            className={inputClass}
          />
        </label>
        <label className="space-y-2 text-sm text-pm-subtle">
          <span className="font-medium text-pm-text">Target user (optional)</span>
          <input
            type="text"
            value={targetUser}
            onChange={(event) => onTargetUserChange(event.target.value)}
            placeholder="e.g. Enterprise admins"
            className={inputClass}
          />
        </label>
      </div>

      <label className="space-y-2 text-sm text-pm-subtle">
        <span className="font-medium text-pm-text">Messy product notes</span>
        <textarea
          rows={compact ? 8 : 14}
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder="Paste transcripts, bullets, feedback, or brainstorm fragments..."
          spellCheck={false}
          className={textareaClass}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onRun}
          disabled={disabled}
          className="inline-flex items-center justify-center rounded-[11px] bg-[image:var(--gradient-accent)] px-6 py-2.5 text-sm font-semibold text-[#FAF8FF] shadow-[0_10px_36px_-10px_rgba(155,92,255,0.55)] transition hover:-translate-y-px hover:shadow-[0_14px_42px_-10px_rgba(155,92,255,0.62)] disabled:pointer-events-none disabled:opacity-45"
        >
          {loading ? "Running…" : "Run Intake Agent"}
        </button>
        {!notes.trim() && (
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-pm-muted">
            Notes required
          </span>
        )}
      </div>
    </div>
  );
}
