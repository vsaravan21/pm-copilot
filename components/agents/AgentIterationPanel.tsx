"use client";

const textareaClass =
  "w-full rounded-[14px] border border-pm-border bg-pm-bg/55 px-4 py-3 text-[14px] leading-relaxed text-pm-text shadow-inner shadow-black/35 outline-none transition placeholder:text-pm-muted/55 focus:border-pm-border-active/45 focus:ring-2 focus:ring-pm-violet/25";

type Props = {
  title: string;
  description: string;
  placeholder: string;
  instruction: string;
  presets: readonly string[];
  buttonLabel: string;
  loadingLabel: string;
  loading: boolean;
  disabled: boolean;
  onInstructionChange: (v: string) => void;
  onSubmit: () => void;
};

export function AgentIterationPanel({
  title,
  description,
  placeholder,
  instruction,
  presets,
  buttonLabel,
  loadingLabel,
  loading,
  disabled,
  onInstructionChange,
  onSubmit,
}: Props) {
  return (
    <div className="rounded-[13px] border border-pm-violet/20 bg-pm-violet/5 px-4 py-4">
      <h4 className="text-[13px] font-semibold text-pm-text">{title}</h4>
      <p className="mt-1 text-[13px] leading-relaxed text-pm-muted">{description}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onInstructionChange(preset)}
            className="rounded-full border border-pm-border bg-pm-panel/60 px-2.5 py-1 text-[11px] font-medium text-pm-subtle transition hover:border-pm-violet/35 hover:text-pm-text"
          >
            {preset}
          </button>
        ))}
      </div>

      <label className="mt-3 block space-y-2 text-sm text-pm-subtle">
        <span className="font-medium text-pm-text">Your instruction</span>
        <textarea
          rows={3}
          value={instruction}
          onChange={(e) => onInstructionChange(e.target.value)}
          placeholder={placeholder}
          className={textareaClass}
        />
      </label>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading || disabled}
          className="inline-flex items-center justify-center rounded-[11px] border border-pm-violet/40 bg-pm-violet/15 px-5 py-2 text-sm font-semibold text-pm-violet transition hover:bg-pm-violet/22 disabled:pointer-events-none disabled:opacity-45"
        >
          {loading ? loadingLabel : buttonLabel}
        </button>
        {disabled && !loading && (
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-pm-muted">
            Enter an instruction to continue
          </span>
        )}
      </div>
    </div>
  );
}
