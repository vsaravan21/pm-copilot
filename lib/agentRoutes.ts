import type { DashboardAgentId } from "@/components/DashboardAgentCard";
import { WORKSPACE_HANDOFF_PARAM } from "@/lib/workspacePersistence";

const IDS: DashboardAgentId[] = ["intake", "synthesis", "prioritization", "spec"];

export function isAgentRouteId(value: string): value is DashboardAgentId {
  return (IDS as string[]).includes(value);
}

export function agentWindowPath(id: DashboardAgentId, options?: { handoff?: boolean }): string {
  const base = `/agent/${id}`;
  if (options?.handoff) return `${base}?${WORKSPACE_HANDOFF_PARAM}=1`;
  return base;
}
