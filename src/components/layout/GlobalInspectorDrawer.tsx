import { AnimatePresence, motion } from "framer-motion";
import { useWorldStore } from "@/store/worldStore";
import { AgentInspector } from "@/components/agents/AgentInspector";
import { LiveSessionPanel } from "@/components/sessions/LiveSessionPanel";

export function GlobalInspectorDrawer() {
  const activeNav = useWorldStore((s) => s.activeNav);
  const selectedAgentId = useWorldStore((s) => s.selectedAgentId);
  const focusedSessionId = useWorldStore((s) => s.focusedSessionId);
  const selectAgent = useWorldStore((s) => s.selectAgent);
  const focusSession = useWorldStore((s) => s.focusSession);

  if (activeNav === "map") return null;
  const open = Boolean(selectedAgentId || focusedSessionId);

  const close = () => {
    selectAgent(null);
    focusSession(null);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-void-950/70 backdrop-blur-sm"
            onClick={close}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="fixed inset-y-0 right-0 z-40 hidden w-[400px] md:block"
          >
            {selectedAgentId ? (
              <AgentInspector agentId={selectedAgentId} onClose={close} />
            ) : focusedSessionId ? (
              <LiveSessionPanel sessionId={focusedSessionId} onClose={close} />
            ) : null}
          </motion.div>
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-16 z-40 h-[75dvh] md:hidden"
          >
            {selectedAgentId ? (
              <AgentInspector agentId={selectedAgentId} onClose={close} />
            ) : focusedSessionId ? (
              <LiveSessionPanel sessionId={focusedSessionId} onClose={close} />
            ) : null}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
