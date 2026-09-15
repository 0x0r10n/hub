export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <div
        className="flex h-7 w-7 items-center justify-center border border-neon-cyan/50 bg-void-900 font-display text-[9px] text-neon-cyan"
        style={{ boxShadow: "0 0 10px -2px var(--color-neon-cyan)" }}
      >
        G
      </div>
      {!compact && (
        <span className="font-display text-[13px] tracking-widest text-void-100">
          GOON<span className="text-neon-magenta">_</span>HUB
        </span>
      )}
    </div>
  );
}
