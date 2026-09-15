import { useMemo } from "react";
import { agents } from "@/data/agents";
import { PageHeader } from "@/components/ui/PageHeader";
import { PixelSprite } from "@/components/map/PixelSprite";
import { formatRelative } from "@/lib/time";
import { EmptyState } from "@/components/ui/EmptyState";

export function ArchivePage() {
  const records = useMemo(() => {
    return agents
      .flatMap((a) =>
        a.pastSessions.map((ps) => ({
          ...ps,
          agent: a,
          notable: ps.durationMin >= 60 || ps.withAgentIds.length >= 2,
        })),
      )
      .sort((a, b) => b.endedAt - a.endedAt);
  }, []);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <PageHeader title="THE ARCHIVE" subtitle={`${records.length} recorded sessions in the stacks`} />

      <div className="flex-1 px-4 py-4">
        {records.length === 0 ? (
          <EmptyState title="THE STACKS ARE EMPTY" description="No sessions have been recorded yet." />
        ) : (
          <ul className="space-y-2">
            {records.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 border border-void-700 bg-void-900/50 px-3 py-2.5"
              >
                <PixelSprite variant={r.agent.spriteVariant} accent={r.agent.accent} size={22} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-mono text-sm text-void-100">{r.agent.name}</span>
                    {r.notable && (
                      <span className="shrink-0 border border-neon-amber/40 bg-neon-amber/10 px-1.5 py-0.5 font-mono text-[9px] text-neon-amber">
                        NOTABLE
                      </span>
                    )}
                  </div>
                  <div className="truncate font-mono text-[11px] text-void-500">
                    {r.roomName}
                    {r.withAgentIds.length > 0 &&
                      ` · with ${r.withAgentIds.map((id) => agents.find((a) => a.id === id)?.name ?? id).join(", ")}`}
                  </div>
                </div>
                <div className="shrink-0 text-right font-mono text-[11px] text-void-500">
                  <div>{formatRelative(r.endedAt)}</div>
                  <div>{r.durationMin}m</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
