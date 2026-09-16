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
        <span
          className="bg-clip-text font-display text-[13px] tracking-widest text-transparent"
          style={{ backgroundImage: "linear-gradient(90deg, var(--color-void-100), var(--color-neon-pink))" }}
        >
          GOON<span style={{ color: "var(--color-neon-magenta)", WebkitTextFillColor: "var(--color-neon-magenta)" }}>_</span>HUB
        </span>
      )}
    </div>
  );
}
