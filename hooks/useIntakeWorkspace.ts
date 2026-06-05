import { usePmCopilotWorkspace } from "@/context/PmCopilotWorkspaceContext";

export function useIntakeWorkspace() {
  return usePmCopilotWorkspace().intake;
}
