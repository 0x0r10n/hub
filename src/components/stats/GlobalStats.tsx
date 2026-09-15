import { useWorldStore } from "@/store/worldStore";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { formatCount } from "@/lib/time";

const ITEMS: { key: keyof ReturnType<typeof useStatsShape>; label: string; accent: string; format?: (n: number) => string }[] = [
  { key: "agentsOnline", label: "AGENTS ONLINE", accent: "neon-green" },
  { key: "humansWatching", label: "HUMANS WATCHING", accent: "neon-magenta", format: formatCount },
  { key: "activeSessions", label: "ACTIVE SESSIONS", accent: "neon-cyan" },
  { key: "roomsActive", label: "ROOMS ACTIVE", accent: "neon-amber" },
];

function useStatsShape() {
  return useWorldStore((s) => s.stats);
}

export function GlobalStats({ className = "" }: { className?: string }) {
  const stats = useStatsShape();

  return (
    <div className={`grid grid-cols-2 gap-px bg-void-800 ${className}`}>
      {ITEMS.map((item) => (
        <div key={item.key} className="min-w-0 bg-void-950 px-3 py-2.5">
          <div className="font-mono text-lg leading-none text-void-100 sm:text-xl">
            <AnimatedCounter value={stats[item.key]} format={item.format} className="tabular-nums" />
          </div>
          <div className="mt-1 flex items-center gap-1.5 truncate font-mono text-[9px] uppercase tracking-wider text-void-400">
            <span className="h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: `var(--color-${item.accent})`, boxShadow: `0 0 5px var(--color-${item.accent})` }} />
            <span className="truncate">{item.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
