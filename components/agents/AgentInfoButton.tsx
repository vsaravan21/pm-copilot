"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

import type { DashboardAgentId } from "@/components/DashboardAgentCard";
import { AGENT_GUIDES } from "@/lib/agentGuides";

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

type PanelPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

function computePanelPosition(anchor: HTMLElement, panelWidth: number): PanelPosition {
  const rect = anchor.getBoundingClientRect();
  const margin = 12;
  const gap = 8;
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const width = Math.min(panelWidth, viewportW - margin * 2);

  let left = rect.right - width;
  left = Math.max(margin, Math.min(left, viewportW - width - margin));

  const spaceBelow = viewportH - rect.bottom - gap - margin;
  const spaceAbove = rect.top - gap - margin;
  const preferBelow = spaceBelow >= 200 || spaceBelow >= spaceAbove;

  const maxHeight = Math.min(420, preferBelow ? spaceBelow : spaceAbove);
  const top = preferBelow ? rect.bottom + gap : Math.max(margin, rect.top - gap - maxHeight);

  return { top, left, width, maxHeight };
}

function AgentGuidePanel({
  guide,
  panelId,
  position,
  panelRef,
}: {
  guide: (typeof AGENT_GUIDES)[DashboardAgentId];
  panelId: string;
  position: PanelPosition;
  panelRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      id={panelId}
      ref={panelRef}
      role="dialog"
      aria-label={`${guide.title} guide`}
      className="fixed z-[200] flex flex-col overflow-hidden rounded-[14px] border border-pm-border bg-pm-card p-4 shadow-[0_24px_64px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
        maxHeight: position.maxHeight,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <p className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-pm-violet/90">
        {guide.title}
      </p>

      <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1 text-[13px] leading-relaxed">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-pm-muted">
            Input source
          </p>
          <p className="mt-1 font-medium text-pm-text">{guide.inputLead}</p>
          <p className="mt-1 text-pm-subtle">{guide.inputDetail}</p>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-pm-muted">
            How it works
          </p>
          <p className="mt-1 text-pm-subtle">{guide.howItWorks}</p>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-pm-muted">
            Full output preview
          </p>
          <ul className="mt-2 space-y-1.5 border-l border-pm-border pl-3 text-pm-subtle">
            {guide.outputPreview.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        <div className="space-y-2 rounded-[10px] border border-pm-border/80 bg-pm-panel/60 px-3 py-2.5 text-[12px] text-pm-muted">
          <p>
            <span className="font-semibold text-pm-subtle">Standalone: </span>
            {guide.standaloneNote}
          </p>
          <p>
            <span className="font-semibold text-pm-subtle">Pipeline: </span>
            {guide.pipelineNote}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AgentInfoButton({ agentId }: { agentId: DashboardAgentId }) {
  const guide = AGENT_GUIDES[agentId];
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<PanelPosition | null>(null);
  const panelId = useId();
  const anchorRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const PANEL_WIDTH = 320;

  const close = useCallback(() => setOpen(false), []);

  const updatePosition = useCallback(() => {
    if (!anchorRef.current) return;
    setPosition(computePanelPosition(anchorRef.current, PANEL_WIDTH));
  }, []);

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    function onPointer(e: MouseEvent) {
      const target = e.target as Node;
      if (anchorRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      close();
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open, close]);

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={`How ${guide.title} works`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex size-7 items-center justify-center rounded-md border border-pm-border bg-pm-panel text-pm-muted transition hover:border-pm-border-active/40 hover:bg-pm-card-hover hover:text-pm-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pm-accent/30"
      >
        <InfoIcon />
      </button>

      {mounted &&
        open &&
        position &&
        createPortal(
          <AgentGuidePanel
            guide={guide}
            panelId={panelId}
            position={position}
            panelRef={panelRef}
          />,
          document.body,
        )}
    </>
  );
}
