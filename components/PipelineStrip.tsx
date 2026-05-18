import { Fragment } from "react";

const STEPS = [
  "Messy Notes",
  "Intake",
  "Synthesis",
  "Prioritization",
  "PRD",
] as const;

/** Orchestration timeline — restrained accent, not neon. */
export function PipelineStrip() {
  return (
    <nav
      aria-label="Workflow pipeline"
      className="border border-pm-border bg-pm-panel/75 px-4 py-3.5 shadow-[0_12px_40px_-28px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:px-5 rounded-[15px]"
    >
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 sm:justify-start sm:gap-x-3">
        {STEPS.map((label, index) => (
          <Fragment key={label}>
            <span className="whitespace-nowrap rounded-lg border border-white/[0.06] bg-pm-bg/80 px-3 py-1.5 font-mono text-[11px] font-medium tracking-tight text-pm-subtle shadow-inner shadow-black/30">
              {label}
            </span>
            {index < STEPS.length - 1 ? (
              <span className="text-pm-muted/60" aria-hidden>
                →
              </span>
            ) : null}
          </Fragment>
        ))}
        <span className="ml-auto hidden text-[10px] font-medium uppercase tracking-[0.2em] text-pm-muted lg:inline">
          Orchestration chain
        </span>
      </div>
    </nav>
  );
}
