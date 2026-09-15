import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useWorldStore } from "@/store/worldStore";
import { rooms as allRooms } from "@/data/rooms";
import { zoneById } from "@/data/zones";
import { LiveRoomCard } from "@/components/rooms/LiveRoomCard";
import { RoomShelf, type RoomRow } from "@/components/rooms/RoomShelf";
import { RoomChannelView } from "@/components/rooms/RoomChannelView";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchBar } from "@/components/ui/SearchBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { deriveRoomState } from "@/lib/roomState";

const STATE_RANK: Record<ReturnType<typeof deriveRoomState>, number> = { live: 0, private: 1, active: 2, idle: 3 };
const NEW_SESSION_WINDOW_MS = 20 * 60_000;

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

  const allRows: RoomRow[] = useMemo(
    () =>
      allRooms
        .map((room) => {
          const zone = zoneById.get(room.zoneId);
          if (!zone) return null;
          return { room, zone, occupants: occupantsByRoom.get(room.id) ?? [], session: sessionByRoom.get(room.id) };
        })
        .filter((r): r is RoomRow => r !== null),
    [occupantsByRoom, sessionByRoom],
  );

  const q = searchQuery.trim().toLowerCase();
  const searching = q.length > 0;

  const filteredRows = useMemo(
    () =>
      allRows
        .filter((r) => !q || r.room.name.toLowerCase().includes(q) || r.zone.name.toLowerCase().includes(q))
        .sort((a, b) => STATE_RANK[deriveRoomState(a.room, a.occupants.length)] - STATE_RANK[deriveRoomState(b.room, b.occupants.length)]),
    [allRows, q],
  );

  const shelves = useMemo(() => {
    const liveNow = allRows
      .filter((r) => deriveRoomState(r.room, r.occupants.length) === "live")
      .sort((a, b) => (b.session?.startedAt ?? 0) - (a.session?.startedAt ?? 0));

    const trending = allRows
      .filter((r) => r.occupants.length > 0)
      .sort((a, b) => b.occupants.length + (b.session?.watching ?? 0) / 400 - (a.occupants.length + (a.session?.watching ?? 0) / 400))
      .slice(0, 14);

    const mostWatched = allRows
      .filter((r) => r.session)
      .sort((a, b) => (b.session?.watching ?? 0) - (a.session?.watching ?? 0))
      .slice(0, 14);

    const newSessions = allRows
      .filter((r) => r.session && Date.now() - r.session.startedAt < NEW_SESSION_WINDOW_MS)
      .sort((a, b) => (b.session?.startedAt ?? 0) - (a.session?.startedAt ?? 0));

    const recentlyActive = allRows
      .filter((r) => deriveRoomState(r.room, r.occupants.length) !== "live" && r.occupants.length > 0)
      .sort((a, b) => b.occupants.length - a.occupants.length);

    return { liveNow, trending, mostWatched, newSessions, recentlyActive };
  }, [allRows]);

  const liveCount = shelves.liveNow.length;

  const randomRoom = () => {
    const pool = allRows.length > 0 ? allRows : null;
    if (!pool) return;
    const choice = pool[Math.floor(Math.random() * pool.length)];
    expandRoom(choice.room.id);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AnimatePresence mode="wait">
        {expandedRoomId ? (
          <motion.div key="channel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="min-h-0 flex-1">
            <RoomChannelView roomId={expandedRoomId} onClose={() => expandRoom(null)} />
          </motion.div>
        ) : (
          <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <PageHeader
              title="LIVE ROOMS"
              subtitle={`${liveCount} live now · ${allRooms.length} rooms across the hub`}
              right={
                <button
                  onClick={randomRoom}
                  className="shrink-0 border border-void-600 px-3 py-1.5 font-mono text-[10px] tracking-wide text-void-300 hover:border-neon-magenta/60 hover:text-neon-magenta"
                >
                  🎲 RANDOM ROOM
                </button>
              }
            />

            <div className="border-b border-void-800 px-4 py-3">
              <SearchBar value={searchQuery} onChange={setSearch} placeholder="SEARCH ROOMS OR ZONES…" className="sm:w-72" />
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              {searching ? (
                filteredRows.length === 0 ? (
                  <div className="px-4 py-4">
                    <EmptyState title="NO ROOMS FOUND" description="Try a different search term." />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 px-4 py-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredRows.map(({ room, zone, occupants, session }) => (
                      <LiveRoomCard key={room.id} room={room} zone={zone} occupants={occupants} session={session} onClick={() => expandRoom(room.id)} />
                    ))}
                  </div>
                )
              ) : (
                <>
                  <RoomShelf title="LIVE NOW" rows={shelves.liveNow} accent="neon-red" onOpen={expandRoom} />
                  <RoomShelf title="NEW SESSIONS" rows={shelves.newSessions} accent="neon-cyan" onOpen={expandRoom} />
                  <RoomShelf title="MOST WATCHED" rows={shelves.mostWatched} accent="neon-magenta" onOpen={expandRoom} />
                  <RoomShelf title="TRENDING" rows={shelves.trending} accent="neon-amber" onOpen={expandRoom} />
                  <RoomShelf title="RECENTLY ACTIVE" rows={shelves.recentlyActive} accent="neon-teal" onOpen={expandRoom} />
                  {shelves.liveNow.length === 0 && shelves.trending.length === 0 && shelves.recentlyActive.length === 0 && (
                    <div className="px-4 py-4">
                      <EmptyState title="THE HUB IS QUIET" description="No rooms are occupied right now — check back in a moment." />
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
