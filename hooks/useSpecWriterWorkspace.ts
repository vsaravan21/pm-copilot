import { usePmCopilotWorkspace } from "@/context/PmCopilotWorkspaceContext";

/** @deprecated Options ignored — workspace is shared via context. */
export function useSpecWriterWorkspace(_options?: unknown) {
  return usePmCopilotWorkspace().specWriter;
}
