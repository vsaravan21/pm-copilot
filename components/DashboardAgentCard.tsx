"use client";

import type { ReactNode } from "react";

import { AgentInfoButton } from "@/components/agents/AgentInfoButton";
import { OpenAgentWindowButton } from "@/components/agents/OpenAgentWindowButton";

export type DashboardAgentId = "intake" | "synthesis" | "prioritization" | "spec";

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      aria-hidden
      className={`size-5 shrink-0 text-pm-muted transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
    </svg>
  );
}

type DashboardAgentCardProps = {
  agentId: DashboardAgentId;
  title: string;
  description: string;
  isExpanded: boolean;
  onToggle: () => void;
  collapsedPreview: ReactNode;
  expandedContent: ReactNode;
  className?: string;
};

/**
 * Expandable dashboard tile for the PM Copilot orchestration view.
 */
export function DashboardAgentCard({
  agentId,
  title,
  description,
  isExpanded,
  onToggle,
  collapsedPreview,
  expandedContent,
  className,
}: DashboardAgentCardProps) {
  const panelId = `agent-panel-${agentId}`;
  const labelId = `agent-label-${agentId}`;

  return (
    <article
      className={`group/card flex flex-col overflow-hidden rounded-xl border bg-pm-card transition-colors duration-200 ${
        isExpanded
          ? "border-pm-border-active/40 shadow-[0_0_0_1px_rgba(56,189,248,0.06)_inset]"
          : "border-pm-border hover:border-white/[0.12]"
      } ${className ?? ""}`}
    >
      <div className={`px-5 pb-5 pt-5 ${isExpanded ? "border-b border-pm-border" : ""}`}>
        <div className="flex items-start gap-3">
          <button
            id={labelId}
            type="button"
            aria-expanded={isExpanded}
            aria-controls={isExpanded ? panelId : undefined}
            onClick={onToggle}
            className="min-w-0 flex-1 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pm-accent/30"
          >
            <h2 className="text-[16px] font-semibold tracking-tight text-pm-text">{title}</h2>
            <p className="mt-2 text-[13px] leading-snug text-pm-muted sm:text-sm">{description}</p>
            {!isExpanded && (
              <div className="mt-4 rounded-lg border border-pm-border bg-pm-panel/60 px-4 py-3 text-left">
                {collapsedPreview}
              </div>
            )}
          </button>

          <div className="flex shrink-0 flex-col items-end gap-2 pt-0.5">
            <div className="flex items-center gap-1.5">
              <AgentInfoButton agentId={agentId} />
              <OpenAgentWindowButton agentId={agentId} />
            </div>
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={isExpanded}
              aria-controls={isExpanded ? panelId : undefined}
              aria-label={isExpanded ? "Collapse agent card" : "Expand agent card"}
              className="rounded-md p-1 text-pm-muted transition hover:bg-white/[0.04] hover:text-pm-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pm-accent/30"
            >
              <Chevron expanded={isExpanded} />
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={labelId}
          className="max-h-[min(75vh,720px)] overflow-y-auto overscroll-contain px-5 pb-6 pt-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10"
        >
          {expandedContent}
        </div>
      )}
    </article>
  );
}
