import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-void-700 px-4 py-4">
      <div>
        <h1 className="font-display text-sm tracking-wider text-void-100">{title}</h1>
        {subtitle && <p className="mt-1.5 font-mono text-xs text-void-400">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}
