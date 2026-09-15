import type { Agent, Room, WorldSession, WorldZone } from "@/types";
import { LiveRoomCard } from "@/components/rooms/LiveRoomCard";

export interface RoomRow {
  room: Room;
  zone: WorldZone;
  occupants: Agent[];
  session: WorldSession | undefined;
}

/** A single horizontally-scrolling shelf of channel cards, TV-network style (LIVE NOW, TRENDING,
 * ...). Every card is still a real live viewport -- shelves only change how they're browsed. */
export function RoomShelf({ title, rows, accent, onOpen }: { title: string; rows: RoomRow[]; accent?: string; onOpen: (roomId: string) => void }) {
  if (rows.length === 0) return null;
  return (
    <section className="py-3">
      <div className="mb-2 flex items-center gap-2 px-4">
        {accent && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: `var(--color-${accent})`, boxShadow: `0 0 6px var(--color-${accent})` }} />}
        <h2 className="font-display text-[11px] tracking-wider text-void-300">{title}</h2>
        <span className="font-mono text-[10px] text-void-600">{rows.length}</span>
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pb-2" style={{ scrollbarWidth: "thin" }}>
        {rows.map(({ room, zone, occupants, session }) => (
          <div key={room.id} className="w-60 shrink-0">
            <LiveRoomCard room={room} zone={zone} occupants={occupants} session={session} onClick={() => onOpen(room.id)} />
          </div>
        ))}
      </div>
    </section>
  );
}
