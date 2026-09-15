import { useEffect } from "react";
import { roomById } from "@/data/rooms";
import { getWorldEngine } from "@/engine/react/engineSingleton";
import { useWorldStore } from "@/store/worldStore";

const TICK_MS = 1800;

/** Boots the world simulation once for the whole app, wires its event stream into the store
 * (agent/room/session state, the live event feed), and keeps the cosmetic metric jitter running. */
export function useLiveWorld() {
  const tick = useWorldStore((s) => s.tick);
  const finishBoot = useWorldStore((s) => s.finishBoot);
  const applyWorldEvent = useWorldStore((s) => s.applyWorldEvent);
  const selectAgent = useWorldStore((s) => s.selectAgent);
  const focusSession = useWorldStore((s) => s.focusSession);
  const focusZone = useWorldStore((s) => s.focusZone);

  useEffect(() => {
    const engine = getWorldEngine();
    engine.setCallbacks({
      onSelectAgent: (id) => selectAgent(id),
      onFocusRoom: (roomId) => {
        const room = roomById.get(roomId);
        const liveSession = useWorldStore.getState().sessions.find((s) => s.roomId === roomId && s.status === "live");
        if (liveSession) focusSession(liveSession.id);
        else if (room) focusZone(room.zoneId);
      },
      onFocusZone: (zoneId) => focusZone(zoneId),
      onDeselect: () => {
        selectAgent(null);
        focusSession(null);
      },
    });

    const unsubscribe = engine.stream.subscribe(applyWorldEvent);
    const boot = window.setTimeout(finishBoot, 900);
    const interval = window.setInterval(tick, TICK_MS);
    return () => {
      window.clearTimeout(boot);
      window.clearInterval(interval);
      unsubscribe();
    };
  }, [tick, finishBoot, applyWorldEvent, selectAgent, focusSession, focusZone]);
}
