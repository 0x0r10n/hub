import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      {icon ?? (
        <div className="flex h-12 w-12 items-center justify-center border border-dashed border-void-600 font-mono text-void-400">
          ?
        </div>
      )}
      <div className="font-display text-[11px] tracking-wider text-void-200">{title}</div>
      {description && <p className="max-w-xs font-mono text-sm text-void-400">{description}</p>}
    </div>
  );
}
