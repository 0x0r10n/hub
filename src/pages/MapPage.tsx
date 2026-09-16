import { AnimatePresence, motion } from "framer-motion";
import { useWorldStore } from "@/store/worldStore";
import { WorldMap } from "@/components/map/WorldMap";
import { NowLiveCarousel } from "@/components/sessions/NowLiveCarousel";
import { GlobalStats } from "@/components/stats/GlobalStats";
import { EventFeed } from "@/components/events/EventFeed";
import { AgentInspector } from "@/components/agents/AgentInspector";
import { LiveSessionPanel } from "@/components/sessions/LiveSessionPanel";
import { LiveMonitorPreview } from "@/components/sessions/LiveMonitorPreview";

export function MapPage() {
  const selectedAgentId = useWorldStore((s) => s.selectedAgentId);
  const focusedSessionId = useWorldStore((s) => s.focusedSessionId);
  const selectAgent = useWorldStore((s) => s.selectAgent);
  const focusSession = useWorldStore((s) => s.focusSession);
  const sessions = useWorldStore((s) => s.sessions);

  const hasOverlay = Boolean(selectedAgentId || focusedSessionId);
  const topSession = [...sessions].filter((s) => s.status === "live").sort((a, b) => b.watching - a.watching)[0];

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1">
          <WorldMap />
        </div>
        <NowLiveCarousel className="hidden md:block" />
      </div>

      <div className="hidden w-[380px] shrink-0 flex-col border-l border-void-700 md:flex">
        <AnimatePresence mode="wait">
          {selectedAgentId ? (
            <motion.div
              key={`agent-${selectedAgentId}`}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2 }}
              className="min-h-0 flex-1"
            >
              <AgentInspector agentId={selectedAgentId} onClose={() => selectAgent(null)} />
            </motion.div>
          ) : focusedSessionId ? (
            <motion.div
              key={`session-${focusedSessionId}`}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2 }}
              className="min-h-0 flex-1"
            >
              <LiveSessionPanel sessionId={focusedSessionId} onClose={() => focusSession(null)} />
            </motion.div>
          ) : (
            <motion.div key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-h-0 flex-1 flex-col">
              {topSession && <LiveMonitorPreview session={topSession} onExpand={() => focusSession(topSession.id)} />}
              <GlobalStats />
              <div className="min-h-0 flex-1">
                <EventFeed />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="md:hidden">
        <AnimatePresence>
          {hasOverlay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-void-950/70 backdrop-blur-sm"
              onClick={() => {
                selectAgent(null);
                focusSession(null);
              }}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {hasOverlay && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-16 z-40 h-[75dvh] overflow-hidden"
            >
              {selectedAgentId ? (
                <AgentInspector agentId={selectedAgentId} onClose={() => selectAgent(null)} />
              ) : focusedSessionId ? (
                <LiveSessionPanel sessionId={focusedSessionId} onClose={() => focusSession(null)} />
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
        <NowLiveCarousel className="fixed inset-x-0 bottom-16 z-20" />
      </div>
    </div>
  );
}
