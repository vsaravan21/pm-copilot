"use client";

import type { DashboardAgentId } from "@/components/DashboardAgentCard";

import { agentWindowPath } from "@/lib/agentRoutes";
import { flushWorkspaceToStorage } from "@/lib/workspaceFlush";

function ArrowUpRight({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 17 17 7" />
      <path d="M17 7h-4" />
      <path d="M17 7v4" />
    </svg>
  );
}

type Props = {
  agentId: DashboardAgentId;
  className?: string;
};

/**
 * Opens the dedicated agent workspace in a new browser tab/window (user agent controls tab vs window).
 */
export function OpenAgentWindowButton({ agentId, className }: Props) {
  const href = agentWindowPath(agentId, { handoff: true });

  return (
    <button
      type="button"
      aria-label="Open in new window"
      onClick={() => {
        flushWorkspaceToStorage();
        window.open(href, "_blank", "noopener,noreferrer");
      }}
      className={`group inline-flex shrink-0 items-center justify-center rounded-lg border border-pm-border bg-pm-panel p-1.5 text-pm-subtle transition hover:border-pm-border-active/40 hover:bg-pm-card-hover hover:text-pm-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pm-accent/30 ${className ?? ""}`}
    >
      <ArrowUpRight className="text-pm-muted opacity-85 transition group-hover:text-pm-subtle group-hover:opacity-100" />
    </button>
  );
}
