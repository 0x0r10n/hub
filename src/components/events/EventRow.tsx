import { motion } from "framer-motion";
import type { EventKind, WorldEvent } from "@/types";
import { formatClock, formatRelative } from "@/lib/time";

const KIND_ACCENT: Record<EventKind, string> = {
  join: "neon-green",
  "session-start": "neon-green",
  leave: "neon-red",
  "session-end": "neon-red",
  proximity: "neon-cyan",
  sync: "neon-violet",
  intensity: "neon-magenta",
  state: "neon-amber",
  system: "void-300",
};

export function EventRow({ event, showClock = true }: { event: WorldEvent; showClock?: boolean }) {
  const accent = KIND_ACCENT[event.kind];
  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -10, height: 0 }}
      animate={{ opacity: 1, x: 0, height: "auto" }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex items-start gap-2 border-b border-void-800/70 py-1.5 font-mono text-xs"
    >
      <span
        className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: `var(--color-${accent})`, boxShadow: `0 0 5px var(--color-${accent})` }}
      />
      <span className="shrink-0 text-void-500">{showClock ? formatClock(event.timestamp) : formatRelative(event.timestamp)}</span>
      <span className="text-void-200">{event.text}</span>
    </motion.li>
  );
}
