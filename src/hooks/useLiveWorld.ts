import { useEffect } from "react";
import { useWorldStore } from "@/store/worldStore";

const TICK_MS = 1800;

export function useLiveWorld() {
  const tick = useWorldStore((s) => s.tick);
  const finishBoot = useWorldStore((s) => s.finishBoot);

  useEffect(() => {
    const boot = window.setTimeout(finishBoot, 900);
    const interval = window.setInterval(tick, TICK_MS);
    return () => {
      window.clearTimeout(boot);
      window.clearInterval(interval);
    };
  }, [tick, finishBoot]);
}
