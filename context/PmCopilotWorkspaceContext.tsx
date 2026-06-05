"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

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
import {
  clearPersistedWorkspace,
  EMPTY_PERSISTED_WORKSPACE,
  hasWorkspaceHandoff,
  isBrowserReload,
  loadPersistedWorkspace,
  savePersistedWorkspace,
  snapshotFromWorkspaceState,
  stripWorkspaceHandoffFromUrl,
  WORKSPACE_STORAGE_KEY,
  type PersistedWorkspaceState,
} from "@/lib/workspacePersistence";
import { registerWorkspaceFlush } from "@/lib/workspaceFlush";

function buildPrioritizationBody(options: {
  rawInput: string;
  productName: string;
  targetUser: string;
  useSynthesisOpportunities: boolean;
  addOwnOpportunities: boolean;
  synthesisOutput?: SynthesisAgentOutput | null;
  previousResult?: PrioritizationAgentOutput | null;
  rerankInstruction?: string;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (options.addOwnOpportunities) {
    const text = options.rawInput.trim();
    if (text) {
      body.rawInput = text;
      body.directInput = text;
    }
    const pn = options.productName.trim();
    const tu = options.targetUser.trim();
    if (pn) body.productName = pn;
    if (tu) body.targetUser = tu;
  }
  if (options.useSynthesisOpportunities && options.synthesisOutput) {
    body.synthesisOutput = options.synthesisOutput;
  }
  if (options.previousResult) body.prioritizationOutput = options.previousResult;
  if (options.rerankInstruction?.trim()) {
    body.rerankInstruction = options.rerankInstruction.trim();
  }
  return body;
}

function buildSpecWriterBody(options: {
  rawInput: string;
  productName: string;
  targetUser: string;
  usePrioritizedItem: boolean;
  addOwnIdea: boolean;
  prioritizationOutput?: PrioritizationAgentOutput | null;
  selectedRankedItemId: string | null;
  rankedItems: { id: string; title: string }[];
  previousPrd?: SpecWriterAgentOutput | null;
  refinementInstruction?: string;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (options.addOwnIdea) {
    const text = options.rawInput.trim();
    if (text) {
      body.rawInput = text;
      body.directInput = text;
    }
    const pn = options.productName.trim();
    const tu = options.targetUser.trim();
    if (pn) body.productName = pn;
    if (tu) body.targetUser = tu;
  }
  if (options.usePrioritizedItem && options.prioritizationOutput) {
    body.prioritizationOutput = options.prioritizationOutput;
    if (options.selectedRankedItemId) {
      body.focusedOpportunityId = options.selectedRankedItemId;
      const selected = options.rankedItems.find((r) => r.id === options.selectedRankedItemId);
      if (selected?.title) body.selectedOpportunity = selected.title;
    }
  }
  if (options.previousPrd) body.specWriterOutput = options.previousPrd;
  if (options.refinementInstruction?.trim()) {
    body.refinementInstruction = options.refinementInstruction.trim();
  }
  return body;
}

export type IntakeWorkspace = {
  notes: string;
  setNotes: (v: string) => void;
  productName: string;
  setProductName: (v: string) => void;
  targetUser: string;
  setTargetUser: (v: string) => void;
  loading: boolean;
  result: IntakeAgentOutput | null;
  error: string | null;
  runIntake: () => Promise<void>;
};

export type SynthesisWorkspace = {
  rawInput: string;
  setRawInput: (v: string) => void;
  productName: string;
  setProductName: (v: string) => void;
  targetUser: string;
  setTargetUser: (v: string) => void;
  useIntakeInsights: boolean;
  setUseIntakeInsights: (v: boolean) => void;
  addOwnInsights: boolean;
  setAddOwnInsights: (v: boolean) => void;
  intakeAvailable: boolean;
  loading: boolean;
  result: SynthesisAgentOutput | null;
  error: string | null;
  canRun: boolean;
  runSynthesis: () => Promise<void>;
};

export type PrioritizationWorkspace = {
  rawInput: string;
  setRawInput: (v: string) => void;
  productName: string;
  setProductName: (v: string) => void;
  targetUser: string;
  setTargetUser: (v: string) => void;
  useSynthesisOpportunities: boolean;
  setUseSynthesisOpportunities: (v: boolean) => void;
  addOwnOpportunities: boolean;
  setAddOwnOpportunities: (v: boolean) => void;
  rerankInstruction: string;
  setRerankInstruction: (v: string) => void;
  synthesisAvailable: boolean;
  loading: boolean;
  rerankLoading: boolean;
  result: PrioritizationAgentOutput | null;
  error: string | null;
  canRun: boolean;
  canRerank: boolean;
  runPrioritization: () => Promise<void>;
  rerankPrioritization: () => Promise<void>;
};

export type SpecWriterWorkspace = {
  rawInput: string;
  setRawInput: (v: string) => void;
  productName: string;
  setProductName: (v: string) => void;
  targetUser: string;
  setTargetUser: (v: string) => void;
  usePrioritizedItem: boolean;
  setUsePrioritizedItem: (v: boolean) => void;
  addOwnIdea: boolean;
  setAddOwnIdea: (v: boolean) => void;
  selectedRankedItemId: string | null;
  setSelectedRankedItemId: (v: string | null) => void;
  refinementInstruction: string;
  setRefinementInstruction: (v: string) => void;
  rankedItems: ReturnType<typeof coercePrioritizationOutput>["rankedItems"];
  prioritizationAvailable: boolean;
  loading: boolean;
  refineLoading: boolean;
  result: SpecWriterAgentOutput | null;
  error: string | null;
  canRun: boolean;
  canRefine: boolean;
  runSpecWriter: () => Promise<void>;
  refinePrd: () => Promise<void>;
};

type PmCopilotWorkspaceContextValue = {
  intake: IntakeWorkspace;
  synthesis: SynthesisWorkspace;
  prioritization: PrioritizationWorkspace;
  specWriter: SpecWriterWorkspace;
};

const PmCopilotWorkspaceContext = createContext<PmCopilotWorkspaceContextValue | null>(null);

export function PmCopilotWorkspaceProvider({ children }: { children: ReactNode }) {
  const hydrated = useRef(false);
  const [persisted, setPersisted] = useState<PersistedWorkspaceState>(EMPTY_PERSISTED_WORKSPACE);
  const persistedRef = useRef(persisted);
  persistedRef.current = persisted;

  const [intakeLoading, setIntakeLoading] = useState(false);
  const [intakeError, setIntakeError] = useState<string | null>(null);
  const [synthesisLoading, setSynthesisLoading] = useState(false);
  const [synthesisError, setSynthesisError] = useState<string | null>(null);
  const [prioritizationLoading, setPrioritizationLoading] = useState(false);
  const [prioritizationRerankLoading, setPrioritizationRerankLoading] = useState(false);
  const [prioritizationError, setPrioritizationError] = useState<string | null>(null);
  const [specLoading, setSpecLoading] = useState(false);
  const [specRefineLoading, setSpecRefineLoading] = useState(false);
  const [specError, setSpecError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    if (isBrowserReload()) {
      clearPersistedWorkspace();
      return;
    }

    if (hasWorkspaceHandoff()) {
      setPersisted(loadPersistedWorkspace());
      stripWorkspaceHandoffFromUrl();
    }
  }, []);

  const flushToStorage = useCallback(() => {
    const snap = persistedRef.current;
    savePersistedWorkspace(
      snapshotFromWorkspaceState({
        intake: { ...snap.intake, error: intakeError },
        synthesis: { ...snap.synthesis, error: synthesisError },
        prioritization: { ...snap.prioritization, error: prioritizationError },
        spec: { ...snap.spec, error: specError },
      }),
    );
  }, [intakeError, synthesisError, prioritizationError, specError]);

  useEffect(() => {
    registerWorkspaceFlush(flushToStorage);
    return () => registerWorkspaceFlush(() => {});
  }, [flushToStorage]);

  useEffect(() => {
    if (!hydrated.current) return;
    const id = window.setTimeout(flushToStorage, 250);
    return () => window.clearTimeout(id);
  }, [persisted, flushToStorage]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== WORKSPACE_STORAGE_KEY || !event.newValue) return;
      try {
        setPersisted(loadPersistedWorkspace());
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const patchPersisted = useCallback(
    (patch: Partial<PersistedWorkspaceState>) => {
      setPersisted((prev) => ({
        ...prev,
        ...patch,
        intake: patch.intake ? { ...prev.intake, ...patch.intake } : prev.intake,
        synthesis: patch.synthesis ? { ...prev.synthesis, ...patch.synthesis } : prev.synthesis,
        prioritization: patch.prioritization
          ? { ...prev.prioritization, ...patch.prioritization }
          : prev.prioritization,
        spec: patch.spec ? { ...prev.spec, ...patch.spec } : prev.spec,
      }));
    },
    [],
  );

  const intakeResult = persisted.intake.result;
  const synthesisResult = persisted.synthesis.result;
  const prioritizationResult = persisted.prioritization.result;

  const runIntake = useCallback(async () => {
    setIntakeLoading(true);
    setIntakeError(null);
    const snap = persistedRef.current.intake;
    setPersisted((prev) => ({ ...prev, intake: { ...prev.intake, result: null } }));
    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: snap.notes,
          productName: snap.productName.trim() || undefined,
          targetUser: snap.targetUser.trim() || undefined,
        }),
      });
      const payloadUnknown = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof (payloadUnknown as { error?: string }).error === "string"
            ? (payloadUnknown as { error: string }).error
            : "Intake request failed",
        );
      }
      const result = coerceIntakeOutput(payloadUnknown);
      setPersisted((prev) => ({ ...prev, intake: { ...prev.intake, result } }));
    } catch (cause) {
      setIntakeError(cause instanceof Error ? cause.message : "Intake failed");
    } finally {
      setIntakeLoading(false);
    }
  }, []);

  const runSynthesis = useCallback(async () => {
    setSynthesisLoading(true);
    setSynthesisError(null);
    const snap = persistedRef.current;
    setPersisted((prev) => ({ ...prev, synthesis: { ...prev.synthesis, result: null } }));
    const body: Record<string, unknown> = {};
    if (snap.synthesis.addOwnInsights) {
      const text = snap.synthesis.rawInput.trim();
      if (text) {
        body.rawInput = text;
        body.directInput = text;
      }
      if (snap.synthesis.productName.trim()) body.productName = snap.synthesis.productName.trim();
      if (snap.synthesis.targetUser.trim()) body.targetUser = snap.synthesis.targetUser.trim();
    }
    if (snap.synthesis.useIntakeInsights && snap.intake.result) {
      body.intakeOutput = snap.intake.result;
    }
    try {
      const response = await fetch("/api/synthesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payloadUnknown = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof (payloadUnknown as { error?: string }).error === "string"
            ? (payloadUnknown as { error: string }).error
            : "Synthesis request failed",
        );
      }
      const result = coerceSynthesisOutput(payloadUnknown);
      setPersisted((prev) => ({ ...prev, synthesis: { ...prev.synthesis, result } }));
    } catch (cause) {
      setSynthesisError(cause instanceof Error ? cause.message : "Synthesis failed");
    } finally {
      setSynthesisLoading(false);
    }
  }, []);

  const postPrioritization = useCallback(async (body: Record<string, unknown>) => {
    const response = await fetch("/api/prioritization", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payloadUnknown = await response.json();
    if (!response.ok) {
      throw new Error(
        typeof (payloadUnknown as { error?: string }).error === "string"
          ? (payloadUnknown as { error: string }).error
          : "Prioritization request failed",
      );
    }
    return coercePrioritizationOutput(payloadUnknown);
  }, []);

  const runPrioritization = useCallback(async () => {
    setPrioritizationLoading(true);
    setPrioritizationError(null);
    const snap = persistedRef.current;
    setPersisted((prev) => ({
      ...prev,
      prioritization: { ...prev.prioritization, result: null, rerankInstruction: "" },
    }));
    try {
      const output = await postPrioritization(
        buildPrioritizationBody({
          rawInput: snap.prioritization.rawInput,
          productName: snap.prioritization.productName,
          targetUser: snap.prioritization.targetUser,
          useSynthesisOpportunities: snap.prioritization.useSynthesisOpportunities,
          addOwnOpportunities: snap.prioritization.addOwnOpportunities,
          synthesisOutput: snap.synthesis.result,
        }),
      );
      setPersisted((prev) => ({ ...prev, prioritization: { ...prev.prioritization, result: output } }));
    } catch (cause) {
      setPrioritizationError(
        cause instanceof Error ? cause.message : "Prioritization failed",
      );
    } finally {
      setPrioritizationLoading(false);
    }
  }, [postPrioritization]);

  const rerankPrioritization = useCallback(async () => {
    const snap = persistedRef.current;
    const prev = snap.prioritization.result;
    if (!prev || !snap.prioritization.rerankInstruction.trim()) return;
    setPrioritizationRerankLoading(true);
    setPrioritizationError(null);
    try {
      const output = await postPrioritization(
        buildPrioritizationBody({
          rawInput: snap.prioritization.rawInput,
          productName: snap.prioritization.productName,
          targetUser: snap.prioritization.targetUser,
          useSynthesisOpportunities: snap.prioritization.useSynthesisOpportunities,
          addOwnOpportunities: snap.prioritization.addOwnOpportunities,
          synthesisOutput: snap.synthesis.result,
          previousResult: prev,
          rerankInstruction: snap.prioritization.rerankInstruction,
        }),
      );
      setPersisted((prev) => ({ ...prev, prioritization: { ...prev.prioritization, result: output } }));
    } catch (cause) {
      setPrioritizationError(cause instanceof Error ? cause.message : "Rerank failed");
    } finally {
      setPrioritizationRerankLoading(false);
    }
  }, [postPrioritization]);

  const rankedItems = useMemo(() => {
    if (!prioritizationResult) return [];
    return [...prioritizationResult.rankedItems].sort((a, b) => a.rank - b.rank);
  }, [prioritizationResult]);

  useEffect(() => {
    setPersisted((prev) => {
      if (!rankedItems.length) {
        if (prev.spec.selectedRankedItemId === null) return prev;
        return { ...prev, spec: { ...prev.spec, selectedRankedItemId: null } };
      }
      const current = prev.spec.selectedRankedItemId;
      if (current && rankedItems.some((item) => item.id === current)) return prev;
      return {
        ...prev,
        spec: { ...prev.spec, selectedRankedItemId: rankedItems[0]?.id ?? null },
      };
    });
  }, [rankedItems]);

  const postSpecWriter = useCallback(async (body: Record<string, unknown>) => {
    const response = await fetch("/api/spec-writer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payloadUnknown = await response.json();
    if (!response.ok) {
      throw new Error(
        typeof (payloadUnknown as { error?: string }).error === "string"
          ? (payloadUnknown as { error: string }).error
          : "Spec Writer request failed",
      );
    }
    return coerceSpecWriterOutput(payloadUnknown);
  }, []);

  const runSpecWriter = useCallback(async () => {
    setSpecLoading(true);
    setSpecError(null);
    const snap = persistedRef.current;
    const items = snap.prioritization.result
      ? [...snap.prioritization.result.rankedItems].sort((a, b) => a.rank - b.rank)
      : [];
    setPersisted((prev) => ({
      ...prev,
      spec: { ...prev.spec, result: null, refinementInstruction: "" },
    }));
    try {
      const output = await postSpecWriter(
        buildSpecWriterBody({
          rawInput: snap.spec.rawInput,
          productName: snap.spec.productName,
          targetUser: snap.spec.targetUser,
          usePrioritizedItem: snap.spec.usePrioritizedItem,
          addOwnIdea: snap.spec.addOwnIdea,
          prioritizationOutput: snap.prioritization.result,
          selectedRankedItemId: snap.spec.selectedRankedItemId,
          rankedItems: items,
        }),
      );
      setPersisted((prev) => ({ ...prev, spec: { ...prev.spec, result: output } }));
    } catch (cause) {
      setSpecError(cause instanceof Error ? cause.message : "Spec Writer failed");
    } finally {
      setSpecLoading(false);
    }
  }, [postSpecWriter]);

  const refinePrd = useCallback(async () => {
    const snap = persistedRef.current;
    const prev = snap.spec.result;
    if (!prev || !snap.spec.refinementInstruction.trim()) return;
    const items = snap.prioritization.result
      ? [...snap.prioritization.result.rankedItems].sort((a, b) => a.rank - b.rank)
      : [];
    setSpecRefineLoading(true);
    setSpecError(null);
    try {
      const output = await postSpecWriter(
        buildSpecWriterBody({
          rawInput: snap.spec.rawInput,
          productName: snap.spec.productName,
          targetUser: snap.spec.targetUser,
          usePrioritizedItem: snap.spec.usePrioritizedItem,
          addOwnIdea: snap.spec.addOwnIdea,
          prioritizationOutput: snap.prioritization.result,
          selectedRankedItemId: snap.spec.selectedRankedItemId,
          rankedItems: items,
          previousPrd: prev,
          refinementInstruction: snap.spec.refinementInstruction,
        }),
      );
      setPersisted((prev) => ({ ...prev, spec: { ...prev.spec, result: output } }));
    } catch (cause) {
      setSpecError(cause instanceof Error ? cause.message : "Refine failed");
    } finally {
      setSpecRefineLoading(false);
    }
  }, [postSpecWriter]);

  const synthesisAvailable = Boolean(synthesisResult);
  const intakeAvailable = Boolean(intakeResult);
  const prioritizationAvailable = Boolean(prioritizationResult);

  const synthesisCanRun =
    (persisted.synthesis.useIntakeInsights || persisted.synthesis.addOwnInsights) &&
    ((persisted.synthesis.useIntakeInsights && intakeAvailable) ||
      (persisted.synthesis.addOwnInsights && persisted.synthesis.rawInput.trim().length > 0));

  const prioritizationCanRun =
    (persisted.prioritization.useSynthesisOpportunities ||
      persisted.prioritization.addOwnOpportunities) &&
    ((persisted.prioritization.useSynthesisOpportunities && synthesisAvailable) ||
      (persisted.prioritization.addOwnOpportunities &&
        persisted.prioritization.rawInput.trim().length > 0));

  const specCanRun =
    (persisted.spec.usePrioritizedItem || persisted.spec.addOwnIdea) &&
    ((persisted.spec.usePrioritizedItem &&
      prioritizationAvailable &&
      Boolean(persisted.spec.selectedRankedItemId)) ||
      (persisted.spec.addOwnIdea && persisted.spec.rawInput.trim().length > 0));

  const value = useMemo<PmCopilotWorkspaceContextValue>(
    () => ({
      intake: {
        notes: persisted.intake.notes,
        setNotes: (v) => patchPersisted({ intake: { ...persisted.intake, notes: v } }),
        productName: persisted.intake.productName,
        setProductName: (v) => patchPersisted({ intake: { ...persisted.intake, productName: v } }),
        targetUser: persisted.intake.targetUser,
        setTargetUser: (v) => patchPersisted({ intake: { ...persisted.intake, targetUser: v } }),
        loading: intakeLoading,
        result: intakeResult,
        error: intakeError,
        runIntake,
      },
      synthesis: {
        rawInput: persisted.synthesis.rawInput,
        setRawInput: (v) => patchPersisted({ synthesis: { ...persisted.synthesis, rawInput: v } }),
        productName: persisted.synthesis.productName,
        setProductName: (v) =>
          patchPersisted({ synthesis: { ...persisted.synthesis, productName: v } }),
        targetUser: persisted.synthesis.targetUser,
        setTargetUser: (v) =>
          patchPersisted({ synthesis: { ...persisted.synthesis, targetUser: v } }),
        useIntakeInsights: persisted.synthesis.useIntakeInsights,
        setUseIntakeInsights: (v) =>
          patchPersisted({ synthesis: { ...persisted.synthesis, useIntakeInsights: v } }),
        addOwnInsights: persisted.synthesis.addOwnInsights,
        setAddOwnInsights: (v) =>
          patchPersisted({ synthesis: { ...persisted.synthesis, addOwnInsights: v } }),
        intakeAvailable,
        loading: synthesisLoading,
        result: synthesisResult,
        error: synthesisError,
        canRun: synthesisCanRun,
        runSynthesis,
      },
      prioritization: {
        rawInput: persisted.prioritization.rawInput,
        setRawInput: (v) =>
          patchPersisted({ prioritization: { ...persisted.prioritization, rawInput: v } }),
        productName: persisted.prioritization.productName,
        setProductName: (v) =>
          patchPersisted({ prioritization: { ...persisted.prioritization, productName: v } }),
        targetUser: persisted.prioritization.targetUser,
        setTargetUser: (v) =>
          patchPersisted({ prioritization: { ...persisted.prioritization, targetUser: v } }),
        useSynthesisOpportunities: persisted.prioritization.useSynthesisOpportunities,
        setUseSynthesisOpportunities: (v) =>
          patchPersisted({
            prioritization: { ...persisted.prioritization, useSynthesisOpportunities: v },
          }),
        addOwnOpportunities: persisted.prioritization.addOwnOpportunities,
        setAddOwnOpportunities: (v) =>
          patchPersisted({
            prioritization: { ...persisted.prioritization, addOwnOpportunities: v },
          }),
        rerankInstruction: persisted.prioritization.rerankInstruction,
        setRerankInstruction: (v) =>
          patchPersisted({
            prioritization: { ...persisted.prioritization, rerankInstruction: v },
          }),
        synthesisAvailable,
        loading: prioritizationLoading,
        rerankLoading: prioritizationRerankLoading,
        result: prioritizationResult,
        error: prioritizationError,
        canRun: prioritizationCanRun,
        canRerank:
          Boolean(prioritizationResult) &&
          persisted.prioritization.rerankInstruction.trim().length > 0,
        runPrioritization,
        rerankPrioritization,
      },
      specWriter: {
        rawInput: persisted.spec.rawInput,
        setRawInput: (v) => patchPersisted({ spec: { ...persisted.spec, rawInput: v } }),
        productName: persisted.spec.productName,
        setProductName: (v) => patchPersisted({ spec: { ...persisted.spec, productName: v } }),
        targetUser: persisted.spec.targetUser,
        setTargetUser: (v) => patchPersisted({ spec: { ...persisted.spec, targetUser: v } }),
        usePrioritizedItem: persisted.spec.usePrioritizedItem,
        setUsePrioritizedItem: (v) =>
          patchPersisted({ spec: { ...persisted.spec, usePrioritizedItem: v } }),
        addOwnIdea: persisted.spec.addOwnIdea,
        setAddOwnIdea: (v) => patchPersisted({ spec: { ...persisted.spec, addOwnIdea: v } }),
        selectedRankedItemId: persisted.spec.selectedRankedItemId,
        setSelectedRankedItemId: (v) =>
          patchPersisted({ spec: { ...persisted.spec, selectedRankedItemId: v } }),
        refinementInstruction: persisted.spec.refinementInstruction,
        setRefinementInstruction: (v) =>
          patchPersisted({ spec: { ...persisted.spec, refinementInstruction: v } }),
        rankedItems,
        prioritizationAvailable,
        loading: specLoading,
        refineLoading: specRefineLoading,
        result: persisted.spec.result,
        error: specError,
        canRun: specCanRun,
        canRefine:
          Boolean(persisted.spec.result) &&
          persisted.spec.refinementInstruction.trim().length > 0,
        runSpecWriter,
        refinePrd,
      },
    }),
    [
      persisted,
      patchPersisted,
      intakeLoading,
      intakeError,
      intakeResult,
      runIntake,
      synthesisLoading,
      synthesisError,
      synthesisResult,
      synthesisCanRun,
      intakeAvailable,
      runSynthesis,
      prioritizationLoading,
      prioritizationRerankLoading,
      prioritizationError,
      prioritizationResult,
      prioritizationCanRun,
      synthesisAvailable,
      runPrioritization,
      rerankPrioritization,
      rankedItems,
      prioritizationAvailable,
      specLoading,
      specRefineLoading,
      specError,
      specCanRun,
      runSpecWriter,
      refinePrd,
    ],
  );

  return (
    <PmCopilotWorkspaceContext.Provider value={value}>
      {children}
    </PmCopilotWorkspaceContext.Provider>
  );
}

export function usePmCopilotWorkspace(): PmCopilotWorkspaceContextValue {
  const ctx = useContext(PmCopilotWorkspaceContext);
  if (!ctx) {
    throw new Error("usePmCopilotWorkspace must be used within PmCopilotWorkspaceProvider");
  }
  return ctx;
}
