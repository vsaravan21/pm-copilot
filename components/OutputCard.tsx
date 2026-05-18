import type { ReactNode } from "react";

export function OutputCard({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[15px] border border-pm-border bg-pm-panel/65 p-4 shadow-[0_16px_44px_-36px_rgba(0,0,0,0.85)] backdrop-blur-sm transition-shadow duration-300 hover:border-white/[0.12] hover:shadow-[0_20px_50px_-34px_rgba(155,92,255,0.12)] ${className ?? ""}`}
    >
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-pm-muted">{title}</h3>
      <div className="mt-3 text-[15px] leading-relaxed text-pm-text">{children}</div>
    </section>
  );
}
