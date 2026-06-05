import { Fragment } from "react";

const STEPS = ["Messy Notes", "Intake", "Synthesis", "Prioritization", "PRD"] as const;

/** Orchestration chain — integrated into the hero. */
export function PipelineStrip() {
  return (
    <nav
      aria-label="Workflow pipeline"
      className="flex flex-col gap-3 border-y border-pm-border py-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
        {STEPS.map((label, index) => (
          <Fragment key={label}>
            <span className="whitespace-nowrap rounded-md border border-pm-border bg-pm-panel/80 px-2.5 py-1 font-mono text-[10.5px] font-medium tracking-tight text-pm-subtle">
              {label}
            </span>
            {index < STEPS.length - 1 ? (
              <span className="text-[11px] text-pm-muted/50" aria-hidden>
                →
              </span>
            ) : null}
          </Fragment>
        ))}
      </div>
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-pm-muted">
        Orchestration chain
      </p>
    </nav>
  );
}
