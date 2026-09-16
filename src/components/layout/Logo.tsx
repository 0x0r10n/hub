export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <img
        src="/logo.png"
        alt=""
        className="h-8 w-8 shrink-0 rounded-full object-cover"
        style={{ filter: "drop-shadow(0 0 6px var(--color-neon-cyan))" }}
      />
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
