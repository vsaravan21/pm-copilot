import { usePmCopilotWorkspace } from "@/context/PmCopilotWorkspaceContext";

/** @deprecated Options ignored — workspace is shared via context. */
export function useSynthesisWorkspace(_options?: unknown) {
  return usePmCopilotWorkspace().synthesis;
}
