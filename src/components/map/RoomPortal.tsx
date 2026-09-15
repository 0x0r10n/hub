import type { Room, WorldSession } from "@/types";

export function RoomPortal({
  room,
  session,
  accent,
  onFocus,
}: {
  room: Room;
  session: WorldSession | undefined;
  accent: string;
  onFocus: () => void;
}) {
  const live = session?.status === "live";
  const cx = room.bounds.x + room.bounds.w / 2;
  const cy = room.bounds.y + room.bounds.h / 2;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onFocus();
      }}
      className="group absolute z-0 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${cx}%`, top: `${cy}%` }}
      title={room.name}
    >
      <div
        className={`h-3 w-3 rotate-45 border transition-transform group-hover:scale-125 ${live ? "animate-pulse-slow" : ""}`}
        style={{
          borderColor: `var(--color-${accent})`,
          backgroundColor: live ? `color-mix(in oklab, var(--color-${accent}) 35%, transparent)` : "transparent",
        }}
      />
      <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap rounded-sm border border-void-600 bg-void-900/95 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-void-200 opacity-0 transition-opacity group-hover:opacity-100">
        {room.name}
        {live && <span style={{ color: `var(--color-${accent})` }}> · LIVE</span>}
      </div>
    </button>
  );
}
