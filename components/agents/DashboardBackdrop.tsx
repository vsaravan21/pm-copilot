import type { ReactNode } from "react";

/** Shared dark canvas + ambient glows for dashboard and pop-out lanes. */
export function DashboardBackdrop({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-pm-bg text-pm-text">
      <div className="pointer-events-none fixed inset-0" aria-hidden>
        <div className="absolute inset-0 bg-pm-bg" />
        <div className="absolute inset-0 opacity-90 [background:var(--gradient-sheen)]" />
        <div className="absolute inset-0 [background:var(--gradient-ambient-a)]" />
        <div className="absolute inset-0 [background:var(--gradient-ambient-b)]" />
        <div className="absolute inset-0 [background:var(--gradient-ambient-c)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pm-bg/25 to-pm-bg" />
      </div>
      {children}
    </div>
  );
}
