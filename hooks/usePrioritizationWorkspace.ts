import { usePmCopilotWorkspace } from "@/context/PmCopilotWorkspaceContext";

/** @deprecated Options ignored — workspace is shared via context. */
export function usePrioritizationWorkspace(_options?: unknown) {
  return usePmCopilotWorkspace().prioritization;
}
