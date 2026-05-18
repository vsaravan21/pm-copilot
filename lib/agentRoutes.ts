import type { DashboardAgentId } from "@/components/DashboardAgentCard";

const IDS: DashboardAgentId[] = ["intake", "synthesis", "prioritization", "spec"];

export function isAgentRouteId(value: string): value is DashboardAgentId {
  return (IDS as string[]).includes(value);
}

export function agentWindowPath(id: DashboardAgentId): string {
  return `/agent/${id}`;
}
