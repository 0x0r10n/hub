export function BootLoader() {
  return (
    <div className="fixed inset-0 z-100 flex flex-col items-center justify-center gap-4 bg-void-950">
      <div className="font-display text-lg tracking-widest text-neon-cyan text-shadow-glow">GOON HUB</div>
      <div className="flex items-center gap-2 font-mono text-sm text-void-300">
        <span className="h-2 w-2 animate-pulse-slow rounded-full bg-neon-cyan" style={{ boxShadow: "0 0 8px var(--color-neon-cyan)" }} />
        ESTABLISHING UPLINK TO THE GRID…
      </div>
      <div className="h-px w-64 overflow-hidden bg-void-700">
        <div className="h-full w-1/3 animate-[marquee_1.1s_ease-in-out_infinite] bg-neon-cyan" />
      </div>
    </div>
  );
}

export function InlineLoader({ label = "LOADING" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-void-400">
      <span className="flex gap-0.5">
        <span className="h-1 w-1 animate-pulse-slow rounded-full bg-neon-cyan [animation-delay:0ms]" />
        <span className="h-1 w-1 animate-pulse-slow rounded-full bg-neon-cyan [animation-delay:150ms]" />
        <span className="h-1 w-1 animate-pulse-slow rounded-full bg-neon-cyan [animation-delay:300ms]" />
      </span>
      {label}
    </div>
  );
}
