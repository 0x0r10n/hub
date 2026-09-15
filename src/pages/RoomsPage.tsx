import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useWorldStore } from "@/store/worldStore";
import { rooms as allRooms } from "@/data/rooms";
import { zoneById } from "@/data/zones";
import { LiveRoomCard } from "@/components/rooms/LiveRoomCard";
import { RoomChannelView } from "@/components/rooms/RoomChannelView";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchBar } from "@/components/ui/SearchBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { deriveRoomState } from "@/lib/roomState";

const STATE_RANK: Record<ReturnType<typeof deriveRoomState>, number> = { live: 0, private: 1, active: 2, idle: 3 };

export function RoomsPage() {
  const agents = useWorldStore((s) => s.agents);
  const sessions = useWorldStore((s) => s.sessions);
  const searchQuery = useWorldStore((s) => s.searchQuery);
  const setSearch = useWorldStore((s) => s.setSearch);
  const expandedRoomId = useWorldStore((s) => s.expandedRoomId);
  const expandRoom = useWorldStore((s) => s.expandRoom);

  const sessionByRoom = useMemo(() => new Map(sessions.map((s) => [s.roomId, s])), [sessions]);
  const occupantsByRoom = useMemo(() => {
    const map = new Map<string, typeof agents>();
    for (const room of allRooms) map.set(room.id, agents.filter((a) => a.roomId === room.id));
    return map;
  }, [agents]);

  const q = searchQuery.trim().toLowerCase();
  const filteredRooms = allRooms
    .filter((r) => !q || r.name.toLowerCase().includes(q) || zoneById.get(r.zoneId)?.name.toLowerCase().includes(q))
    .map((room) => ({ room, occupants: occupantsByRoom.get(room.id) ?? [] }))
    .sort((a, b) => STATE_RANK[deriveRoomState(a.room, a.occupants.length)] - STATE_RANK[deriveRoomState(b.room, b.occupants.length)]);

  const liveCount = filteredRooms.filter(({ room, occupants }) => deriveRoomState(room, occupants.length) === "live").length;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AnimatePresence mode="wait">
        {expandedRoomId ? (
          <motion.div key="channel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="min-h-0 flex-1">
            <RoomChannelView roomId={expandedRoomId} onClose={() => expandRoom(null)} />
          </motion.div>
        ) : (
          <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <PageHeader title="LIVE ROOMS" subtitle={`${liveCount} live now · ${allRooms.length} rooms across the hub`} />

            <div className="border-b border-void-800 px-4 py-3">
              <SearchBar value={searchQuery} onChange={setSearch} placeholder="SEARCH ROOMS OR ZONES…" className="sm:w-72" />
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {filteredRooms.length === 0 ? (
                <EmptyState title="NO ROOMS FOUND" description="Try a different search term." />
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredRooms.map(({ room, occupants }) => {
                    const zone = zoneById.get(room.zoneId);
                    if (!zone) return null;
                    return (
                      <LiveRoomCard
                        key={room.id}
                        room={room}
                        zone={zone}
                        occupants={occupants}
                        session={sessionByRoom.get(room.id)}
                        onClick={() => expandRoom(room.id)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
