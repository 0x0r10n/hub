import type { WorldSession, Agent, WorldZone } from "@/types";
import { ObserverViewport } from "@/engine/react/ObserverViewport";
import { roomCenterPx } from "@/engine/geometry";
import { roomById } from "@/data/rooms";
import { AgentPortrait } from "@/components/ui/AgentPortrait";
import { formatCount } from "@/lib/time";

/** A "now live" channel card for the bottom carousel -- the preview is a real second camera into
 * the running world (via ObserverViewport), not a static portrait row or icon. */
export function SessionCard({
  session,
  participants,
  zone,
  active,
  onClick,
}: {
  session: WorldSession;
  participants: Agent[];
  zone: WorldZone | undefined;
  active: boolean;
  onClick: () => void;
}) {
  const accent = participants[0]?.accent ?? zone?.accent ?? "neon-cyan";
  const room = roomById.get(session.roomId);
  const center = room && zone ? roomCenterPx(zone, room) : null;

  return (
    <button
      onClick={onClick}
      className={`group relative flex w-56 shrink-0 snap-start flex-col overflow-hidden border bg-void-900/80 text-left transition-all duration-150 sm:w-64 ${
        active ? "border-neon-cyan scale-[1.02]" : "border-void-700 hover:border-neon-cyan/60 hover:scale-[1.01]"
      }`}
      style={{
        boxShadow: active
          ? "0 0 22px -2px var(--color-neon-cyan), inset 0 0 0 1px rgba(255,45,166,0.3)"
          : "0 0 10px -6px var(--color-neon-cyan)",
      }}
    >
      <span aria-hidden className={`pointer-events-none absolute left-0 top-0 h-2.5 w-2.5 border-l border-t ${active ? "border-neon-cyan" : "border-void-500 group-hover:border-neon-cyan/70"}`} />
      <span aria-hidden className={`pointer-events-none absolute right-0 top-0 h-2.5 w-2.5 border-r border-t ${active ? "border-neon-cyan" : "border-void-500 group-hover:border-neon-cyan/70"}`} />

      <div className="relative h-24 overflow-hidden bg-void-950 sm:h-28">
        {center ? (
          <ObserverViewport x={center.x} y={center.y} zoom={1.9} />
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-[10px] text-void-600">NO SIGNAL</div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void-950/95 via-transparent to-transparent" />

        <span className="absolute left-1.5 top-1.5 flex items-center gap-1 border border-neon-cyan/50 bg-void-950/85 px-1.5 py-0.5 font-mono text-[9px] text-neon-cyan">
          <span className="h-1.5 w-1.5 animate-pulse-slow rounded-full bg-neon-cyan" style={{ boxShadow: "0 0 6px var(--color-neon-cyan)" }} />
          LIVE
        </span>
        <span className="absolute right-1.5 top-1.5 flex items-center gap-1 border border-void-700 bg-void-950/85 px-1.5 py-0.5 font-mono text-[9px] text-void-200">
          {formatCount(session.watching)} <span aria-hidden>👁</span>
        </span>

        <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1">
          {participants.slice(0, 3).map((p) => (
            <AgentPortrait key={p.id} variant={p.spriteVariant} accent={p.accent} spriteSeed={p.spriteSeed} size={18} />
          ))}
        </div>
      </div>

      <div className="min-w-0 border-t border-void-800 px-2.5 py-2">
        <div className="truncate font-mono text-xs text-void-100">{session.title}</div>
        <div className="mt-0.5 flex items-center justify-between font-mono text-[10px] text-void-400">
          <span className="truncate">{room?.name ?? "Unknown room"}</span>
          <span className="shrink-0" style={{ color: `var(--color-${accent})` }}>{zone?.shortLabel}</span>
        </div>
      </div>
    </button>
  );
}
