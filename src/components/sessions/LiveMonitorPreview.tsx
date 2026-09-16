import { useWorldStore } from "@/store/worldStore";
import { ObserverViewport } from "@/engine/react/ObserverViewport";
import { roomCenterPx } from "@/engine/geometry";
import { roomById } from "@/data/rooms";
import { zoneById } from "@/data/zones";
import { AgentPortrait } from "@/components/ui/AgentPortrait";
import { formatCount } from "@/lib/time";
import type { WorldSession } from "@/types";

/** The right-panel's default state: a live broadcast-monitor preview of the top live session, so
 * landing on the map reads as "tuned in to a channel" rather than a blank stats sidebar. Clicking
 * it opens the full LiveSessionPanel (tabs, telemetry, history). */
export function LiveMonitorPreview({ session, onExpand }: { session: WorldSession; onExpand: () => void }) {
  const agents = useWorldStore((s) => s.agents);
  const room = roomById.get(session.roomId);
  const zone = zoneById.get(session.zoneId);
  const participants = session.agentIds.map((id) => agents.find((a) => a.id === id)).filter(Boolean) as typeof agents;
  const center = room && zone ? roomCenterPx(zone, room) : null;

  return (
    <button onClick={onExpand} className="group block shrink-0 border-b border-void-700 text-left">
      <div className="flex items-center justify-between gap-2 px-3 pt-2.5">
        <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-neon-cyan">
          <span className="h-1.5 w-1.5 animate-pulse-slow rounded-full bg-neon-cyan" style={{ boxShadow: "0 0 6px var(--color-neon-cyan)" }} />
          LIVE · {zone?.name ?? "UNKNOWN"}
        </span>
        <span className="font-mono text-[10px] text-void-400">{formatCount(session.watching)} watching</span>
      </div>

      <div className="relative mx-3 mt-2 h-32 overflow-hidden border border-void-700 bg-void-950 transition-colors group-hover:border-neon-cyan/50">
        {center ? (
          <ObserverViewport x={center.x} y={center.y} zoom={2} />
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-[10px] text-void-600">NO SIGNAL</div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void-950/90 via-transparent to-transparent" />
        <span aria-hidden className="pointer-events-none absolute left-0 top-0 h-2 w-2 border-l border-t border-neon-cyan/60" />
        <span aria-hidden className="pointer-events-none absolute right-0 top-0 h-2 w-2 border-r border-t border-neon-cyan/60" />
        <span aria-hidden className="pointer-events-none absolute bottom-0 left-0 h-2 w-2 border-b border-l border-neon-cyan/60" />
        <span aria-hidden className="pointer-events-none absolute bottom-0 right-0 h-2 w-2 border-b border-r border-neon-cyan/60" />
      </div>

      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="min-w-0">
          <div className="truncate font-mono text-xs text-void-100">{room?.name ?? session.title}</div>
          <div className="flex items-center gap-1 pt-1">
            {participants.slice(0, 4).map((p) => (
              <AgentPortrait key={p.id} variant={p.spriteVariant} accent={p.accent} spriteSeed={p.spriteSeed} size={16} />
            ))}
          </div>
        </div>
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-void-500 group-hover:text-neon-cyan">Expand ›</span>
      </div>
    </button>
  );
}
