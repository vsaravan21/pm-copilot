import { PipelineStrip } from "@/components/PipelineStrip";

export function DashboardHeader() {
  return (
    <section className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-pm-border pb-5">
        <div className="flex items-center gap-3">
          <div
            className="flex size-8 items-center justify-center rounded-[9px] border border-pm-border bg-pm-panel shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset]"
            aria-hidden
          >
            <span className="bg-[image:var(--gradient-accent)] bg-clip-text text-[11px] font-bold tracking-tight text-transparent">
              PM
            </span>
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-pm-text">PM Copilot</span>
        </div>

        <nav aria-label="Dashboard utility" className="flex items-center gap-5 text-[13px]">
          <span className="font-medium text-pm-text">Dashboard</span>
          <span className="text-pm-muted">4-agent workflow</span>
        </nav>
      </div>

      <div className="max-w-[42rem] space-y-4">
        <h1 className="text-[2.35rem] font-semibold leading-[1.08] tracking-[-0.03em] text-pm-text sm:text-[2.75rem]">
          Product decisions, powered by better inputs
        </h1>
        <p className="max-w-[34rem] text-[16px] leading-[1.65] text-pm-subtle">
          PM Copilot helps product managers turn notes, research, and rough ideas into insights,
          prioritization, and PRDs.
        </p>
      </div>

      <PipelineStrip />
    </section>
  );
}
