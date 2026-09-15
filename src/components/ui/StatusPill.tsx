import type { AgentState } from "@/types";
import { stateAccent } from "@/store/worldStore";

const LABELS: Record<AgentState, string> = {
  "in-session": "IN SESSION",
  roaming: "ROAMING",
  idle: "IDLE",
  recovering: "RECOVERING",
  observing: "OBSERVING",
};

export function StatusPill({ state, className = "" }: { state: AgentState; className?: string }) {
  const accent = stateAccent(state);
  const pulsing = state === "in-session" || state === "roaming";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wider ${className}`}
      style={{
        borderColor: `color-mix(in oklab, var(--color-${accent}) 45%, transparent)`,
        color: `var(--color-${accent})`,
        backgroundColor: `color-mix(in oklab, var(--color-${accent}) 12%, transparent)`,
      }}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${pulsing ? "animate-pulse-slow" : ""}`}
        style={{ backgroundColor: `var(--color-${accent})`, boxShadow: `0 0 6px var(--color-${accent})` }}
      />
      {LABELS[state]}
    </span>
  );
}
