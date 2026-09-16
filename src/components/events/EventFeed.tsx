import { AnimatePresence, motion } from "framer-motion";
import { useWorldStore } from "@/store/worldStore";
import { EventRow } from "./EventRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { PixelIcon } from "@/components/ui/PixelIcon";

export function EventFeed({ limit, className = "" }: { limit?: number; className?: string }) {
  const events = useWorldStore((s) => s.events);
  const visible = limit ? events.slice(0, limit) : events;

  return (
    <div className={`flex h-full flex-col ${className}`}>
      <div className="flex items-center gap-2 border-b border-void-700 px-3 py-2.5">
        <PixelIcon name="radar" size={11} className="text-neon-cyan" />
        <span className="font-display text-[10px] tracking-wider text-void-200">LIVE EVENT LOG</span>
        <motion.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="ml-auto h-1.5 w-1.5 rounded-full bg-neon-cyan"
          style={{ boxShadow: "0 0 6px var(--color-neon-cyan)" }}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3">
        {visible.length === 0 ? (
          <EmptyState title="NO EVENTS YET" description="The world is quiet. Something will happen soon." />
        ) : (
          <ul>
            <AnimatePresence initial={false} mode="popLayout">
              {visible.map((e) => (
                <EventRow key={e.id} event={e} />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
}
