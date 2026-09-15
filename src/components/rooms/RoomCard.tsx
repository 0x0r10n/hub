import type { Agent, Room, WorldSession, WorldZone } from "@/types";
import { PixelSprite } from "@/components/map/PixelSprite";
import { formatCount } from "@/lib/time";

const KIND_LABEL: Record<Room["kind"], string> = {
  social: "SOCIAL",
  experimental: "EXPERIMENTAL",
  competitive: "COMPETITIVE",
  autonomous: "AUTONOMOUS",
  private: "PRIVATE",
  archival: "ARCHIVAL",
  recovery: "RECOVERY",
  observation: "OBSERVATION",
};

export function RoomCard({
  room,
  zone,
  occupants,
  session,
  onClick,
}: {
  room: Room;
  zone: WorldZone | undefined;
  occupants: Agent[];
  session: WorldSession | undefined;
  onClick: () => void;
}) {
  const live = session?.status === "live";
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-2.5 border border-void-700 bg-void-900/60 p-3 text-left transition-colors hover:border-void-400"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-mono text-sm text-void-100">{room.name}</div>
          <div className="truncate font-mono text-[10px] text-void-500">{zone?.name}</div>
        </div>
        {live && (
          <span className="flex shrink-0 items-center gap-1 border border-neon-red/40 bg-neon-red/10 px-1.5 py-0.5 font-mono text-[9px] text-neon-red">
            <span className="h-1 w-1 animate-pulse-slow rounded-full bg-neon-red" />
            LIVE
          </span>
        )}
      </div>

      <div className="flex min-h-6 items-center gap-1.5">
        {occupants.slice(0, 5).map((a) => (
          <PixelSprite key={a.id} variant={a.spriteVariant} accent={a.accent} size={16} />
        ))}
        {occupants.length === 0 && <span className="font-mono text-[10px] text-void-600">Empty</span>}
      </div>

      <div className="flex items-center justify-between font-mono text-[10px] text-void-500">
        <span
          className="border border-void-600 px-1.5 py-0.5"
          style={{ color: `var(--color-${zone?.accent ?? "void-300"})` }}
        >
          {KIND_LABEL[room.kind]}
        </span>
        <span>
          {occupants.length}
          {room.capacity > 0 ? `/${room.capacity}` : ""} here{session ? ` · ${formatCount(session.watching)}w` : ""}
        </span>
      </div>
    </button>
  );
}
