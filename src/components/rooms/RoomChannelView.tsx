import { AnimatePresence, motion } from "framer-motion";
import { useWorldStore } from "@/store/worldStore";
import { ObserverViewport } from "@/engine/react/ObserverViewport";
import { roomCenterPx } from "@/engine/geometry";
import { roomById } from "@/data/rooms";
import { zoneById } from "@/data/zones";
import { AgentPortrait } from "@/components/ui/AgentPortrait";
import { StatBar } from "@/components/ui/StatBar";
import { EventRow } from "@/components/events/EventRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCount, formatDuration } from "@/lib/time";
import { deriveRoomState } from "@/lib/roomState";

const STATE_ACCENT: Record<ReturnType<typeof deriveRoomState>, string> = {
  idle: "void-400",
  active: "neon-amber",
  live: "neon-red",
  private: "neon-violet",
};

/** The "now playing" view for a single room -- a large live camera into the world plus the same
 * telemetry a spectator would want from a stream: who's in it, their public stats, and what's
 * been happening. */
export function RoomChannelView({ roomId, onClose }: { roomId: string; onClose: () => void }) {
  const agents = useWorldStore((s) => s.agents);
  const sessions = useWorldStore((s) => s.sessions);
  const events = useWorldStore((s) => s.events);
  const selectAgent = useWorldStore((s) => s.selectAgent);

  const room = roomById.get(roomId);
  const zone = room ? zoneById.get(room.zoneId) : undefined;
  if (!room || !zone) return null;

  const occupants = agents.filter((a) => a.roomId === roomId);
  const session = sessions.find((s) => s.roomId === roomId && s.status === "live");
  const state = deriveRoomState(room, occupants.length);
  const accent = STATE_ACCENT[state];
  const center = roomCenterPx(zone, room);
  const roomEvents = events.filter((e) => e.roomId === roomId).slice(0, 30);
  const earliestStart = occupants.reduce<number | null>((min, a) => {
    if (!a.sessionStartedAt) return min;
    return min === null ? a.sessionStartedAt : Math.min(min, a.sessionStartedAt);
  }, null);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex items-center justify-between gap-3 border-b border-void-700 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onClose}
            aria-label="Back to live rooms"
            className="flex h-7 w-7 shrink-0 items-center justify-center border border-void-600 font-mono text-xs text-void-400 hover:border-neon-cyan/60 hover:text-neon-cyan"
          >
            ←
          </button>
          <span
            className="flex shrink-0 items-center gap-1.5 border px-2 py-1 font-mono text-[10px]"
            style={{ borderColor: `color-mix(in oklab, var(--color-${accent}) 55%, transparent)`, color: `var(--color-${accent})` }}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${state !== "idle" ? "animate-pulse-slow" : ""}`}
              style={{ backgroundColor: `var(--color-${accent})`, boxShadow: state !== "idle" ? `0 0 6px var(--color-${accent})` : undefined }}
            />
            {state.toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="truncate font-display text-sm tracking-wide text-void-100">{room.name}</div>
            <div className="truncate font-mono text-[11px] text-void-500">{zone.name}</div>
          </div>
        </div>
        {session && (
          <div className="shrink-0 font-mono text-xs text-neon-magenta">{formatCount(session.watching)} WATCHING</div>
        )}
      </div>

      <div className="relative h-[42vh] min-h-64 shrink-0 overflow-hidden border-b border-void-800 bg-void-950 sm:h-[50vh]">
        <ObserverViewport x={center.x} y={center.y} zoom={2.3} />
      </div>

      <div className="grid flex-1 grid-cols-1 gap-px bg-void-800 lg:grid-cols-2">
        <div className="min-h-0 bg-void-950 px-4 py-4">
          <div className="mb-3 font-display text-[10px] tracking-wider text-void-400">AGENTS</div>
          {occupants.length === 0 ? (
            <p className="font-mono text-xs text-void-500">This room is empty right now.</p>
          ) : (
            <ul className="space-y-3">
              {occupants.map((a) => (
                <li key={a.id}>
                  <button
                    onClick={() => selectAgent(a.id)}
                    className="mb-1.5 flex w-full items-center gap-2 text-left hover:text-neon-cyan"
                  >
                    <AgentPortrait variant={a.spriteVariant} accent={a.accent} spriteSeed={a.spriteSeed} size={20} />
                    <span className="truncate font-mono text-sm text-void-100">{a.name}</span>
                  </button>
                  <StatBar label="ENERGY" value={a.metrics.energy} accent={a.accent} compact />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="min-h-0 bg-void-950 px-4 py-4">
          <div className="mb-3 font-display text-[10px] tracking-wider text-void-400">LIVE DATA</div>
          <dl className="mb-5 space-y-1.5 font-mono text-xs">
            <Row label="state" value={state.toUpperCase()} accent={accent} />
            <Row label="kind" value={room.kind.toUpperCase()} />
            <Row label="capacity" value={room.capacity > 0 ? `${occupants.length}/${room.capacity}` : `${occupants.length}`} />
            <Row label="duration" value={earliestStart ? formatDuration(Date.now() - earliestStart) : "—"} />
            <Row label="events logged" value={String(roomEvents.length)} />
          </dl>

          <div className="mb-2 font-display text-[10px] tracking-wider text-void-400">RECENT ACTIVITY</div>
          {roomEvents.length === 0 ? (
            <EmptyState title="NO ACTIVITY YET" description="Nothing logged in this room yet." />
          ) : (
            <ul>
              <AnimatePresence initial={false}>
                {roomEvents.slice(0, 10).map((e) => (
                  <EventRow key={e.id} event={e} showClock={false} />
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between border-b border-void-800/70 pb-1.5">
      <span className="text-void-500">{label}</span>
      <span style={accent ? { color: `var(--color-${accent})` } : undefined} className={accent ? "" : "text-void-200"}>
        {value}
      </span>
    </motion.div>
  );
}
