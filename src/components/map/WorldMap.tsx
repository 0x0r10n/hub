import { useWorldStore } from "@/store/worldStore";
import { WorldCanvas } from "@/engine/react/WorldCanvas";
import { PixelIcon } from "@/components/ui/PixelIcon";

export function WorldMap({ className = "" }: { className?: string }) {
  const sessions = useWorldStore((s) => s.sessions);
  const focusedZoneId = useWorldStore((s) => s.focusedZoneId);
  const focusedSessionId = useWorldStore((s) => s.focusedSessionId);
  const selectAgent = useWorldStore((s) => s.selectAgent);
  const focusZone = useWorldStore((s) => s.focusZone);
  const focusSession = useWorldStore((s) => s.focusSession);

  const hasFocus = Boolean(focusedZoneId || focusedSessionId);
  const liveZoneCount = new Set(sessions.filter((s) => s.status === "live").map((s) => s.zoneId)).size;

  return (
    <div className={`relative flex h-full flex-col ${className}`}>
      <div className="flex items-center justify-between gap-2 border-b border-void-700 bg-void-950/80 px-3 py-2">
        <div className="flex items-center gap-2 font-display text-[10px] tracking-wider text-void-200">
          <PixelIcon name="map" size={12} className="text-neon-cyan" />
          WORLD MAP
        </div>
        <div className="flex items-center gap-2">
          {hasFocus && (
            <button
              onClick={() => {
                focusZone(null);
                focusSession(null);
                selectAgent(null);
              }}
              className="border border-void-600 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-void-300 hover:border-neon-cyan/60 hover:text-neon-cyan"
            >
              ⤢ Reset view
            </button>
          )}
          <span className="font-mono text-[10px] text-void-400">{liveZoneCount} zones active</span>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden bg-void-950">
        <WorldCanvas />
        <div className="pointer-events-none absolute bottom-2 left-2 font-mono text-[9px] text-void-500 sm:bottom-3 sm:left-3">
          DRAG TO PAN · SCROLL TO ZOOM · CLICK A DISTRICT, BUILDING, OR AGENT TO OBSERVE
        </div>
      </div>
    </div>
  );
}
