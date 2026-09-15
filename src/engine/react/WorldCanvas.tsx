import { useEffect, useRef } from "react";
import { useWorldStore } from "@/store/worldStore";
import { getWorldEngine } from "./engineSingleton";

/** Mounts the single shared WorldEngine's canvas and keeps its camera/selection in sync with the store. */
export function WorldCanvas({ className = "" }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const selectedAgentId = useWorldStore((s) => s.selectedAgentId);
  const focusedZoneId = useWorldStore((s) => s.focusedZoneId);
  const focusedSessionId = useWorldStore((s) => s.focusedSessionId);
  const sessions = useWorldStore((s) => s.sessions);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const engine = getWorldEngine();
    engine.attach(host);
    return () => engine.detach();
  }, []);

  useEffect(() => {
    getWorldEngine().setSelectedAgent(selectedAgentId);
    if (selectedAgentId) getWorldEngine().focusAgent(selectedAgentId);
  }, [selectedAgentId]);

  useEffect(() => {
    if (selectedAgentId) return;
    if (focusedSessionId) {
      const session = sessions.find((s) => s.id === focusedSessionId);
      if (session) getWorldEngine().focusRoom(session.roomId);
      return;
    }
    if (focusedZoneId) {
      getWorldEngine().focusZone(focusedZoneId);
      return;
    }
    getWorldEngine().resetView();
  }, [selectedAgentId, focusedSessionId, focusedZoneId, sessions]);

  return <div ref={hostRef} className={`h-full w-full ${className}`} />;
}
