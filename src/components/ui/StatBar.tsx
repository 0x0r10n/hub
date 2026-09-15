const SEGMENTS = 10;

export function StatBar({
  label,
  value,
  accent = "neon-cyan",
  compact = false,
}: {
  label: string;
  value: number;
  accent?: string;
  compact?: boolean;
}) {
  const filled = Math.round((value / 100) * SEGMENTS);

  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-16 shrink-0 font-mono uppercase tracking-wider text-void-300 ${compact ? "text-[11px]" : "text-xs"}`}
      >
        {label}
      </span>
      <div className="flex flex-1 gap-[2px]">
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <div
            key={i}
            className={`h-2.5 flex-1 rounded-[1px] transition-colors duration-500 ${i < filled ? "" : "bg-void-700"}`}
            style={
              i < filled
                ? { backgroundColor: `var(--color-${accent})`, boxShadow: `0 0 6px var(--color-${accent})` }
                : undefined
            }
          />
        ))}
      </div>
      <span className="w-8 shrink-0 text-right font-mono text-xs text-void-200">{Math.round(value)}</span>
    </div>
  );
}
