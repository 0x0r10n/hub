import { useMemo } from "react";
import type { ZoneId } from "@/types";
import { useWorldStore } from "@/store/worldStore";
import { zones as allZones } from "@/data/zones";
import { rooms as allRooms } from "@/data/rooms";
import { ZoneArea } from "./ZoneArea";
import { PixelIcon } from "@/components/ui/PixelIcon";

const BRIDGES: [ZoneId, ZoneId][] = [
  ["rooftop", "commons"],
  ["commons", "lab"],
  ["commons", "arena"],
  ["commons", "lounge"],
  ["commons", "garden"],
  ["lab", "deep"],
  ["arena", "lounge"],
  ["deep", "archive"],
  ["garden", "archive"],
  ["lounge", "archive"],
];

function center(z: (typeof allZones)[number]) {
  return { x: z.bounds.x + z.bounds.w / 2, y: z.bounds.y + z.bounds.h / 2 };
}

export function WorldMap({ className = "" }: { className?: string }) {
  const agents = useWorldStore((s) => s.agents);
  const sessions = useWorldStore((s) => s.sessions);
  const selectedAgentId = useWorldStore((s) => s.selectedAgentId);
  const focusedZoneId = useWorldStore((s) => s.focusedZoneId);
  const focusedSessionId = useWorldStore((s) => s.focusedSessionId);
  const selectAgent = useWorldStore((s) => s.selectAgent);
  const focusZone = useWorldStore((s) => s.focusZone);
  const focusSession = useWorldStore((s) => s.focusSession);

  const effectiveFocusZone = useMemo(() => {
    if (focusedZoneId) return focusedZoneId;
    if (focusedSessionId) {
      const s = sessions.find((s) => s.id === focusedSessionId);
      return s?.zoneId ?? null;
    }
    return null;
  }, [focusedZoneId, focusedSessionId, sessions]);

  const zoneById = useMemo(() => new Map(allZones.map((z) => [z.id, z])), []);
  const origin = effectiveFocusZone
    ? (() => {
        const c = center(zoneById.get(effectiveFocusZone)!);
        return `${c.x}% ${c.y}%`;
      })()
    : "50% 50%";
  const zoom = effectiveFocusZone ? 1.85 : 1;

  const liveZoneIds = useMemo(() => new Set(sessions.filter((s) => s.status === "live").map((s) => s.zoneId)), [sessions]);

  return (
    <div className={`relative flex h-full flex-col ${className}`}>
      <div className="flex items-center justify-between gap-2 border-b border-void-700 bg-void-950/80 px-3 py-2">
        <div className="flex items-center gap-2 font-display text-[10px] tracking-wider text-void-200">
          <PixelIcon name="map" size={12} className="text-neon-cyan" />
          WORLD MAP
        </div>
        <div className="flex items-center gap-2">
          {effectiveFocusZone && (
            <button
              onClick={() => {
                focusZone(null);
                focusSession(null);
              }}
              className="border border-void-600 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-void-300 hover:border-neon-cyan/60 hover:text-neon-cyan"
            >
              ⤢ Reset view
            </button>
          )}
          <span className="font-mono text-[10px] text-void-400">{liveZoneIds.size} zones active</span>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden bg-void-950 crt-noise">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div
          className="absolute inset-2 transition-transform duration-700 ease-out sm:inset-4"
          style={{ transformOrigin: origin, transform: `scale(${zoom})` }}
          onClick={() => selectAgent(null)}
        >
          <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-30" preserveAspectRatio="none" viewBox="0 0 100 100">
            {BRIDGES.map(([a, b]) => {
              const za = zoneById.get(a);
              const zb = zoneById.get(b);
              if (!za || !zb) return null;
              const ca = center(za);
              const cb = center(zb);
              return (
                <line
                  key={`${a}-${b}`}
                  x1={ca.x}
                  y1={ca.y}
                  x2={cb.x}
                  y2={cb.y}
                  stroke="var(--color-void-400)"
                  strokeWidth={0.25}
                  strokeDasharray="1.5 1.5"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>

          {allZones.map((zone) => (
            <ZoneArea
              key={zone.id}
              zone={zone}
              rooms={allRooms.filter((r) => r.zoneId === zone.id)}
              agents={agents.filter((a) => a.zoneId === zone.id)}
              sessions={sessions}
              dimmed={effectiveFocusZone !== null && effectiveFocusZone !== zone.id}
              selectedAgentId={selectedAgentId}
              onSelectAgent={selectAgent}
              onSelectZone={() => focusZone(zone.id)}
              onFocusRoom={(roomId) => {
                const s = sessions.find((sess) => sess.roomId === roomId && sess.status === "live");
                if (s) focusSession(s.id);
                else focusZone(zone.id);
              }}
            />
          ))}
        </div>

        <div className="pointer-events-none absolute bottom-2 left-2 font-mono text-[9px] text-void-500 sm:bottom-3 sm:left-3">
          CLICK A ZONE TO ZOOM · CLICK AN AGENT TO OBSERVE
        </div>
      </div>
    </div>
  );
}
