"use client";

import type { ReactNode } from "react";

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
  badgeText: string;
  badgeTone: "active" | "muted";
  description: string;
  isExpanded: boolean;
  onToggle: () => void;
  collapsedPreview: ReactNode;
  expandedContent: ReactNode;
  className?: string;
};

/**
 * Expandable dashboard tile — glass panel for the PM Copilot orchestration view.
 */
export function DashboardAgentCard({
  agentId,
  title,
  badgeText,
  badgeTone,
  description,
  isExpanded,
  onToggle,
  collapsedPreview,
  expandedContent,
  className,
}: DashboardAgentCardProps) {
  const isActive = badgeTone === "active";

  const surface = isActive
    ? [
        "border-pm-border-active/55 bg-pm-card backdrop-blur-xl",
        "shadow-[0_24px_64px_-28px_rgba(255,121,198,0.22),0_0_0_1px_rgba(255,121,198,0.12)_inset]",
        "ring-1 ring-pm-border-active/25",
      ].join(" ")
    : [
        "border-pm-border bg-pm-card/90 backdrop-blur-xl",
        "shadow-[0_20px_50px_-32px_rgba(0,0,0,0.65)]",
        "ring-1 ring-white/[0.04]",
      ].join(" ");

  const badge =
    badgeTone === "active"
      ? "border border-pm-success/45 bg-pm-success/12 text-pm-success shadow-[0_0_20px_-6px_rgba(68,215,182,0.45)]"
      : "border border-dashed border-pm-muted/45 bg-pm-panel/95 text-pm-muted";

  const previewTray = isActive
    ? "border border-white/[0.09] bg-[image:var(--gradient-accent-subtle)] shadow-inner shadow-black/20"
    : "border border-pm-border bg-pm-panel/70";

  const panelId = `agent-panel-${agentId}`;
  const labelId = `agent-label-${agentId}`;

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-[17px] border transition-shadow duration-300 ${surface} ${isActive ? "" : "opacity-[0.96] hover:opacity-100"} ${className ?? ""}`}
    >
      <div className={`px-5 pb-5 pt-5 ${isExpanded ? "border-b border-pm-border" : ""}`}>
        <div className="flex items-start gap-3">
          <button
            id={labelId}
            type="button"
            aria-expanded={isExpanded}
            aria-controls={isExpanded ? panelId : undefined}
            onClick={onToggle}
            className="min-w-0 flex-1 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pm-violet/35"
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h2 className="text-[17px] font-semibold tracking-tight text-pm-text">{title}</h2>
              <span
                className={`rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${badge}`}
              >
                {badgeText}
              </span>
            </div>
            <p
              className={`mt-3 text-[13px] leading-snug sm:text-sm ${isActive ? "text-pm-subtle" : "text-pm-muted"}`}
            >
              {description}
            </p>
            {!isExpanded && (
              <div className={`mt-4 rounded-[13px] px-4 py-3 text-left ${previewTray}`}>{collapsedPreview}</div>
            )}
          </button>

          <div className="flex shrink-0 flex-col items-end gap-2 pt-0.5">
            <OpenAgentWindowButton agentId={agentId} />
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={isExpanded}
              aria-controls={isExpanded ? panelId : undefined}
              aria-label={isExpanded ? "Collapse agent card" : "Expand agent card"}
              className="rounded-md p-1 text-pm-muted transition hover:bg-white/[0.05] hover:text-pm-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pm-violet/35"
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
          className="max-h-[min(75vh,720px)] overflow-y-auto overscroll-contain px-5 pb-6 pt-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-pm-violet/25"
        >
          {expandedContent}
        </div>
      )}
    </article>
  );
}
