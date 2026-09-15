import { useMemo } from "react";
import { useWorldStore } from "@/store/worldStore";
import { rooms as allRooms } from "@/data/rooms";
import { zones, zoneById } from "@/data/zones";
import { RoomCard } from "@/components/rooms/RoomCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchBar } from "@/components/ui/SearchBar";
import { EmptyState } from "@/components/ui/EmptyState";

export function RoomsPage() {
  const agents = useWorldStore((s) => s.agents);
  const sessions = useWorldStore((s) => s.sessions);
  const searchQuery = useWorldStore((s) => s.searchQuery);
  const setSearch = useWorldStore((s) => s.setSearch);
  const focusSession = useWorldStore((s) => s.focusSession);
  const focusZone = useWorldStore((s) => s.focusZone);
  const setActiveNav = useWorldStore((s) => s.setActiveNav);

  const sessionByRoom = useMemo(() => new Map(sessions.map((s) => [s.roomId, s])), [sessions]);

  const q = searchQuery.trim().toLowerCase();
  const filteredRooms = allRooms.filter((r) => !q || r.name.toLowerCase().includes(q) || zoneById.get(r.zoneId)?.name.toLowerCase().includes(q));

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <PageHeader title="ROOMS" subtitle={`${allRooms.length} rooms across ${zones.length} zones`} />

      <div className="border-b border-void-800 px-4 py-3">
        <SearchBar value={searchQuery} onChange={setSearch} placeholder="SEARCH ROOMS OR ZONES…" className="sm:w-72" />
      </div>

      <div className="flex-1 space-y-6 px-4 py-4">
        {filteredRooms.length === 0 ? (
          <EmptyState title="NO ROOMS FOUND" description="Try a different search term." />
        ) : (
          zones.map((zone) => {
            const zoneRooms = filteredRooms.filter((r) => r.zoneId === zone.id);
            if (zoneRooms.length === 0) return null;
            return (
              <div key={zone.id}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-1.5 w-1.5" style={{ backgroundColor: `var(--color-${zone.accent})`, boxShadow: `0 0 6px var(--color-${zone.accent})` }} />
                  <h2 className="font-display text-[10px] tracking-wider text-void-300">{zone.name}</h2>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {zoneRooms.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      zone={zone}
                      occupants={agents.filter((a) => a.roomId === room.id)}
                      session={sessionByRoom.get(room.id)}
                      onClick={() => {
                        const s = sessionByRoom.get(room.id);
                        if (s?.status === "live") focusSession(s.id);
                        else focusZone(zone.id);
                        setActiveNav("map");
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
