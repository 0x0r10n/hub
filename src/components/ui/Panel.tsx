import type { ReactNode } from "react";

export function PanelFrame({
  children,
  className = "",
  accent = "neon-cyan",
}: {
  children: ReactNode;
  className?: string;
  accent?: string;
}) {
  return (
    <div
      className={`relative border border-void-600 bg-void-900/95 backdrop-blur-sm ${className}`}
      style={{ boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.02), 0 0 30px -10px var(--color-${accent})` }}
    >
      <Corner className="left-0 top-0 border-l border-t" accent={accent} />
      <Corner className="right-0 top-0 border-r border-t" accent={accent} />
      <Corner className="bottom-0 left-0 border-b border-l" accent={accent} />
      <Corner className="bottom-0 right-0 border-b border-r" accent={accent} />
      {children}
    </div>
  );
}

function Corner({ className, accent }: { className: string; accent: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute h-2.5 w-2.5 ${className}`}
      style={{ borderColor: `var(--color-${accent})` }}
    />
  );
}

export function PanelHeader({
  title,
  subtitle,
  accent = "neon-cyan",
  right,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  accent?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-void-700 px-4 py-3">
      <div className="min-w-0">
        <div
          className="truncate font-display text-[11px] tracking-wider"
          style={{ color: `var(--color-${accent})` }}
        >
          {title}
        </div>
        {subtitle && <div className="mt-1 truncate font-mono text-xs text-void-300">{subtitle}</div>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}
