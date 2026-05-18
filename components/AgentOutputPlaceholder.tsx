export function AgentOutputPlaceholder({ bullets }: { bullets: string[] }) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-pm-muted">
        Placeholder surface
      </p>
      <ul className="space-y-2 border-l border-pm-border pl-3.5 text-[13px] leading-relaxed text-pm-subtle">
        {bullets.map((line) => (
          <li key={line} className="relative">
            <span className="absolute -left-[15px] top-2 size-1 rounded-full bg-pm-violet/50" aria-hidden />
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
