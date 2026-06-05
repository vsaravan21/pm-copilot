"use client";

import { useEffect, useState } from "react";

type HealthPayload = {
  provider?: string;
  model?: string;
};

export function LlmStatusBadge() {
  const [status, setStatus] = useState<HealthPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/health")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: HealthPayload | null) => {
        if (!cancelled && data) setStatus(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!status?.provider) return null;

  const label =
    status.provider === "openai" && status.model
      ? `LLM: openai · ${status.model}`
      : `LLM: ${status.provider}`;

  return (
    <span
      className="inline-flex rounded-md border border-pm-border bg-pm-panel/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-pm-muted"
      title="Active server LLM provider (no API key shown)"
    >
      {label}
    </span>
  );
}
