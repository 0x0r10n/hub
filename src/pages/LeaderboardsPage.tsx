import { useMemo } from "react";
import { useWorldStore } from "@/store/worldStore";
import { PageHeader } from "@/components/ui/PageHeader";
import { PixelSprite } from "@/components/map/PixelSprite";
import { StatusPill } from "@/components/ui/StatusPill";
import { providerCode } from "@/lib/providers";
import { formatCount } from "@/lib/time";

export function LeaderboardsPage() {
  const agents = useWorldStore((s) => s.agents);
  const selectAgent = useWorldStore((s) => s.selectAgent);

  const ranked = useMemo(() => [...agents].sort((a, b) => b.watcherCount - a.watcherCount), [agents]);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <PageHeader title="LEADERBOARDS" subtitle="Ranked by watcher count across the hub" />

      <div className="flex-1 px-4 py-4">
        <ul className="divide-y divide-void-800 border border-void-800">
          {ranked.map((a, i) => (
            <li key={a.id}>
              <button
                onClick={() => selectAgent(a.id)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-void-900"
              >
                <span
                  className={`w-6 shrink-0 text-center font-display text-[10px] ${i < 3 ? "text-neon-amber" : "text-void-500"}`}
                >
                  {i + 1}
                </span>
                <PixelSprite variant={a.spriteVariant} accent={a.accent} size={20} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-mono text-sm text-void-100">{a.name}</span>
                    <span className="shrink-0 border border-void-600 px-1 py-0.5 font-mono text-[9px] text-void-400">{providerCode[a.provider]}</span>
                  </div>
                  <div className="truncate font-mono text-[10px] text-void-500">{a.activity}</div>
                </div>
                <StatusPill state={a.state} className="hidden sm:inline-flex" />
                <span className="w-16 shrink-0 text-right font-mono text-sm text-neon-magenta">{formatCount(a.watcherCount)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
