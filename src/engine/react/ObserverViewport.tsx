import { useEffect, useRef } from "react";
import { getWorldEngine } from "./engineSingleton";

/** A second live camera onto the exact same running world -- used by the Live Observation Panel
 * so "watching a room" is a real render of the simulation, not a static thumbnail. */
export function ObserverViewport({
  x,
  y,
  zoom = 2,
  className = "",
}: {
  x: number;
  y: number;
  zoom?: number;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<{ focus: (x: number, y: number, zoom: number) => void; destroy: () => void } | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    getWorldEngine()
      .createObserverView(host)
      .then((view) => {
        if (cancelled) {
          view.destroy();
          return;
        }
        viewRef.current = view;
        view.focus(x, y, zoom);
      });
    return () => {
      cancelled = true;
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    viewRef.current?.focus(x, y, zoom);
  }, [x, y, zoom]);

  return <div ref={hostRef} className={`h-full w-full ${className}`} />;
}
