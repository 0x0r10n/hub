import type { Agent, Room, WorldSession, WorldZone } from "@/types";
import { ObserverViewport } from "@/engine/react/ObserverViewport";
import { roomCenterPx } from "@/engine/geometry";
import { AgentPortrait } from "@/components/ui/AgentPortrait";
import { formatCount } from "@/lib/time";
import { deriveRoomState } from "@/lib/roomState";

const STATE_LABEL: Record<ReturnType<typeof deriveRoomState>, string> = {
  idle: "IDLE",
  active: "ACTIVE",
  live: "LIVE",
  private: "PRIVATE",
};

const STATE_ACCENT: Record<ReturnType<typeof deriveRoomState>, string> = {
  idle: "void-400",
  active: "neon-amber",
  live: "neon-cyan",
  private: "neon-violet",
};

/** A channel tile in the live-rooms grid. The thumbnail is not an image -- it's a real second
 * camera into the running PixiJS world, rendered by the same engine as the main map. */
export function LiveRoomCard({
  room,
  zone,
  occupants,
  session,
  onClick,
}: {
  room: Room;
  zone: WorldZone;
  occupants: Agent[];
  session: WorldSession | undefined;
  onClick: () => void;
}) {
  const state = deriveRoomState(room, occupants.length);
  const center = roomCenterPx(zone, room);
  const accent = STATE_ACCENT[state];

  return (
    <button
      onClick={onClick}
      className={`group relative flex w-full flex-col overflow-hidden border bg-void-950 text-left transition-colors ${
        state === "idle" ? "border-void-800 hover:border-void-600" : "border-void-700 hover:border-void-400"
      }`}
    >
      <div className="relative h-32 overflow-hidden bg-void-950 sm:h-36">
        <ObserverViewport x={center.x} y={center.y} zoom={1.7} />
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-t from-void-950/95 via-transparent to-transparent ${state === "idle" ? "opacity-90" : "opacity-70"}`} />

        <span
          className="absolute left-2 top-2 flex items-center gap-1 border bg-void-950/85 px-1.5 py-0.5 font-mono text-[9px]"
          style={{ borderColor: `color-mix(in oklab, var(--color-${accent}) 55%, transparent)`, color: `var(--color-${accent})` }}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${state !== "idle" ? "animate-pulse-slow" : ""}`}
            style={{ backgroundColor: `var(--color-${accent})`, boxShadow: state !== "idle" ? `0 0 6px var(--color-${accent})` : undefined }}
          />
          {STATE_LABEL[state]}
        </span>

        {session?.status === "live" && (
          <span className="absolute right-2 top-2 border border-void-700 bg-void-950/85 px-1.5 py-0.5 font-mono text-[9px] text-void-200">
            {formatCount(session.watching)} watching
          </span>
        )}

        <div className="absolute bottom-1.5 left-2 flex items-center gap-1">
          {occupants.slice(0, 4).map((a) => (
            <AgentPortrait key={a.id} variant={a.spriteVariant} accent={a.accent} spriteSeed={a.spriteSeed} size={20} />
          ))}
          {occupants.length === 0 && <span className="font-mono text-[9px] text-void-600">Empty</span>}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-void-800 px-3 py-2">
        <div className="min-w-0">
          <div className="truncate font-mono text-sm text-void-100">{room.name}</div>
          <div className="truncate font-mono text-[10px] text-void-500">{zone.name}</div>
        </div>
        <span className="shrink-0 font-mono text-[10px] text-void-500">
          {occupants.length}
          {room.capacity > 0 ? `/${room.capacity}` : ""}
        </span>
      </div>
    </button>
  );
}
