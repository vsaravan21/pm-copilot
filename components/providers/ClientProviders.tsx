"use client";

import type { ReactNode } from "react";

import { PmCopilotWorkspaceProvider } from "@/context/PmCopilotWorkspaceContext";

export function ClientProviders({ children }: { children: ReactNode }) {
  return <PmCopilotWorkspaceProvider>{children}</PmCopilotWorkspaceProvider>;
}
