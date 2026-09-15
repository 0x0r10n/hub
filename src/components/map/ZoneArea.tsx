import type { Agent, Room, WorldSession, WorldZone } from "@/types";
import { AmbientLayer } from "./AmbientLayer";
import { RoomPortal } from "./RoomPortal";
import { AgentSprite } from "./AgentSprite";

export function ZoneArea({
  zone,
  rooms,
  agents,
  sessions,
  dimmed,
  selectedAgentId,
  onSelectAgent,
  onSelectZone,
  onFocusRoom,
}: {
  zone: WorldZone;
  rooms: Room[];
  agents: Agent[];
  sessions: WorldSession[];
  dimmed: boolean;
  selectedAgentId: string | null;
  onSelectAgent: (id: string) => void;
  onSelectZone: () => void;
  onFocusRoom: (roomId: string) => void;
}) {
  const sessionByRoom = new Map(sessions.map((s) => [s.roomId, s]));

  return (
    <div
      className={`absolute cursor-pointer border transition-opacity duration-500 ${dimmed ? "opacity-25" : "opacity-100"}`}
      style={{
        left: `${zone.bounds.x}%`,
        top: `${zone.bounds.y}%`,
        width: `${zone.bounds.w}%`,
        height: `${zone.bounds.h}%`,
        borderColor: `color-mix(in oklab, var(--color-${zone.accent}) 35%, transparent)`,
        background: `linear-gradient(160deg, color-mix(in oklab, var(--color-${zone.accent}) 7%, var(--color-void-900)), var(--color-void-950))`,
      }}
      onClick={onSelectZone}
    >
      <AmbientLayer zone={zone} />

      <div className="pointer-events-none absolute left-1.5 top-1.5 z-20 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5" style={{ backgroundColor: `var(--color-${zone.accent})`, boxShadow: `0 0 6px var(--color-${zone.accent})` }} />
        <span className="font-display text-[8px] tracking-wider sm:text-[9px]" style={{ color: `var(--color-${zone.accent})` }}>
          {zone.shortLabel}
        </span>
      </div>

      {rooms.map((room) => (
        <RoomPortal
          key={room.id}
          room={room}
          session={sessionByRoom.get(room.id)}
          accent={zone.accent}
          onFocus={() => onFocusRoom(room.id)}
        />
      ))}

      {agents.map((agent) => (
        <AgentSprite
          key={agent.id}
          agent={agent}
          selected={selectedAgentId === agent.id}
          onSelect={() => onSelectAgent(agent.id)}
        />
      ))}
    </div>
  );
}
