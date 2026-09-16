import { useRef, useState } from "react";
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
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const hasFocus = Boolean(focusedZoneId || focusedSessionId);
  const liveZoneCount = new Set(sessions.filter((s) => s.status === "live").map((s) => s.zoneId)).size;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      rootRef.current?.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div ref={rootRef} className={`relative flex h-full flex-col bg-void-950 ${className}`}>
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
          <button
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            className="flex h-6 w-6 items-center justify-center border border-void-600 text-void-300 hover:border-neon-cyan/60 hover:text-neon-cyan"
          >
            <PixelIcon name="expand" size={10} />
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden bg-void-950">
        <WorldCanvas />
        <div className="pointer-events-none absolute bottom-2 left-2 font-mono text-[9px] text-void-500 sm:bottom-3 sm:left-3">
          DRAG TO PAN · SCROLL TO ZOOM · CLICK A DISTRICT, BUILDING, OR AGENT TO OBSERVE
        </div>
        <div className="pointer-events-none absolute bottom-2 right-2 flex h-11 w-11 flex-col items-center justify-center border border-void-700 bg-void-950/80 font-mono text-[7px] text-void-400 sm:bottom-3 sm:right-3">
          <span className="leading-none text-neon-cyan/80">N</span>
          <span className="flex items-center gap-2.5 leading-none">
            <span>W</span>
            <span className="h-1 w-1 rounded-full bg-neon-cyan/70" />
            <span>E</span>
          </span>
          <span className="leading-none">S</span>
        </div>
      </div>
    </div>
  );
}
