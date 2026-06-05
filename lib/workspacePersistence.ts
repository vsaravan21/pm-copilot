import {
  coerceIntakeOutput,
  coercePrioritizationOutput,
  coerceSpecWriterOutput,
  coerceSynthesisOutput,
  type IntakeAgentOutput,
  type PrioritizationAgentOutput,
  type SpecWriterAgentOutput,
  type SynthesisAgentOutput,
} from "@/lib/schemas";

export const WORKSPACE_STORAGE_KEY = "pm-copilot:workspace:v1";
export const WORKSPACE_HANDOFF_PARAM = "handoff";

export type PersistedWorkspaceState = {
  version: 1;
  intake: {
    notes: string;
    productName: string;
    targetUser: string;
    result: IntakeAgentOutput | null;
  };
  synthesis: {
    rawInput: string;
    productName: string;
    targetUser: string;
    useIntakeInsights: boolean;
    addOwnInsights: boolean;
    result: SynthesisAgentOutput | null;
  };
  prioritization: {
    rawInput: string;
    productName: string;
    targetUser: string;
    useSynthesisOpportunities: boolean;
    addOwnOpportunities: boolean;
    rerankInstruction: string;
    result: PrioritizationAgentOutput | null;
  };
  spec: {
    rawInput: string;
    productName: string;
    targetUser: string;
    usePrioritizedItem: boolean;
    addOwnIdea: boolean;
    selectedRankedItemId: string | null;
    refinementInstruction: string;
    result: SpecWriterAgentOutput | null;
  };
};

export const EMPTY_PERSISTED_WORKSPACE: PersistedWorkspaceState = {
  version: 1,
  intake: { notes: "", productName: "", targetUser: "", result: null },
  synthesis: {
    rawInput: "",
    productName: "",
    targetUser: "",
    useIntakeInsights: false,
    addOwnInsights: true,
    result: null,
  },
  prioritization: {
    rawInput: "",
    productName: "",
    targetUser: "",
    useSynthesisOpportunities: false,
    addOwnOpportunities: true,
    rerankInstruction: "",
    result: null,
  },
  spec: {
    rawInput: "",
    productName: "",
    targetUser: "",
    usePrioritizedItem: false,
    addOwnIdea: true,
    selectedRankedItemId: null,
    refinementInstruction: "",
    result: null,
  },
};

function safeCoerceIntake(raw: unknown): IntakeAgentOutput | null {
  if (!raw || typeof raw !== "object") return null;
  try {
    return coerceIntakeOutput(raw);
  } catch {
    return null;
  }
}

function safeCoerceSynthesis(raw: unknown): SynthesisAgentOutput | null {
  if (!raw || typeof raw !== "object") return null;
  try {
    return coerceSynthesisOutput(raw);
  } catch {
    return null;
  }
}

function safeCoercePrioritization(raw: unknown): PrioritizationAgentOutput | null {
  if (!raw || typeof raw !== "object") return null;
  try {
    return coercePrioritizationOutput(raw);
  } catch {
    return null;
  }
}

function safeCoerceSpec(raw: unknown): SpecWriterAgentOutput | null {
  if (!raw || typeof raw !== "object") return null;
  try {
    return coerceSpecWriterOutput(raw);
  } catch {
    return null;
  }
}

export function loadPersistedWorkspace(): PersistedWorkspaceState {
  if (typeof window === "undefined") return EMPTY_PERSISTED_WORKSPACE;
  try {
    const raw = sessionStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (!raw) return EMPTY_PERSISTED_WORKSPACE;
    const parsed = JSON.parse(raw) as Partial<PersistedWorkspaceState>;
    if (parsed.version !== 1) return EMPTY_PERSISTED_WORKSPACE;

    const intake = parsed.intake ?? EMPTY_PERSISTED_WORKSPACE.intake;
    const synthesis = parsed.synthesis ?? EMPTY_PERSISTED_WORKSPACE.synthesis;
    const prioritization =
      parsed.prioritization ?? EMPTY_PERSISTED_WORKSPACE.prioritization;
    const spec = parsed.spec ?? EMPTY_PERSISTED_WORKSPACE.spec;

    return {
      version: 1,
      intake: {
        notes: String(intake.notes ?? ""),
        productName: String(intake.productName ?? ""),
        targetUser: String(intake.targetUser ?? ""),
        result: safeCoerceIntake(intake.result),
      },
      synthesis: {
        rawInput: String(synthesis.rawInput ?? ""),
        productName: String(synthesis.productName ?? ""),
        targetUser: String(synthesis.targetUser ?? ""),
        useIntakeInsights: Boolean(synthesis.useIntakeInsights),
        addOwnInsights: synthesis.addOwnInsights !== false,
        result: safeCoerceSynthesis(synthesis.result),
      },
      prioritization: {
        rawInput: String(prioritization.rawInput ?? ""),
        productName: String(prioritization.productName ?? ""),
        targetUser: String(prioritization.targetUser ?? ""),
        useSynthesisOpportunities: Boolean(prioritization.useSynthesisOpportunities),
        addOwnOpportunities: prioritization.addOwnOpportunities !== false,
        rerankInstruction: String(prioritization.rerankInstruction ?? ""),
        result: safeCoercePrioritization(prioritization.result),
      },
      spec: {
        rawInput: String(spec.rawInput ?? ""),
        productName: String(spec.productName ?? ""),
        targetUser: String(spec.targetUser ?? ""),
        usePrioritizedItem: Boolean(spec.usePrioritizedItem),
        addOwnIdea: spec.addOwnIdea !== false,
        selectedRankedItemId:
          typeof spec.selectedRankedItemId === "string"
            ? spec.selectedRankedItemId
            : null,
        refinementInstruction: String(spec.refinementInstruction ?? ""),
        result: safeCoerceSpec(spec.result),
      },
    };
  } catch {
    return EMPTY_PERSISTED_WORKSPACE;
  }
}

export function savePersistedWorkspace(state: PersistedWorkspaceState): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota or private mode */
  }
}

export function clearPersistedWorkspace(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(WORKSPACE_STORAGE_KEY);
    localStorage.removeItem(WORKSPACE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function isBrowserReload(): boolean {
  if (typeof window === "undefined") return false;
  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  return nav?.type === "reload";
}

export function hasWorkspaceHandoff(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get(WORKSPACE_HANDOFF_PARAM) === "1";
}

export function stripWorkspaceHandoffFromUrl(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has(WORKSPACE_HANDOFF_PARAM)) return;
  url.searchParams.delete(WORKSPACE_HANDOFF_PARAM);
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(null, "", next);
}

export function snapshotFromWorkspaceState(state: {
  intake: PersistedWorkspaceState["intake"] & { error?: string | null };
  synthesis: PersistedWorkspaceState["synthesis"] & { error?: string | null };
  prioritization: PersistedWorkspaceState["prioritization"] & { error?: string | null };
  spec: PersistedWorkspaceState["spec"] & { error?: string | null };
}): PersistedWorkspaceState {
  return {
    version: 1,
    intake: {
      notes: state.intake.notes,
      productName: state.intake.productName,
      targetUser: state.intake.targetUser,
      result: state.intake.result,
    },
    synthesis: {
      rawInput: state.synthesis.rawInput,
      productName: state.synthesis.productName,
      targetUser: state.synthesis.targetUser,
      useIntakeInsights: state.synthesis.useIntakeInsights,
      addOwnInsights: state.synthesis.addOwnInsights,
      result: state.synthesis.result,
    },
    prioritization: {
      rawInput: state.prioritization.rawInput,
      productName: state.prioritization.productName,
      targetUser: state.prioritization.targetUser,
      useSynthesisOpportunities: state.prioritization.useSynthesisOpportunities,
      addOwnOpportunities: state.prioritization.addOwnOpportunities,
      rerankInstruction: state.prioritization.rerankInstruction,
      result: state.prioritization.result,
    },
    spec: {
      rawInput: state.spec.rawInput,
      productName: state.spec.productName,
      targetUser: state.spec.targetUser,
      usePrioritizedItem: state.spec.usePrioritizedItem,
      addOwnIdea: state.spec.addOwnIdea,
      selectedRankedItemId: state.spec.selectedRankedItemId,
      refinementInstruction: state.spec.refinementInstruction,
      result: state.spec.result,
    },
  };
}
