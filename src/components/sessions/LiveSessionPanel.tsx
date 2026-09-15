import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useWorldStore } from "@/store/worldStore";
import { PanelFrame, PanelHeader } from "@/components/ui/Panel";
import { StatBar } from "@/components/ui/StatBar";
import { AgentPortrait } from "@/components/ui/AgentPortrait";
import { ObserverViewport } from "@/engine/react/ObserverViewport";
import { roomCenterPx } from "@/engine/geometry";
import { roomById } from "@/data/rooms";
import { zoneById } from "@/data/zones";
import { formatCount, formatDuration, formatRelative } from "@/lib/time";
import { agents as allAgentsData } from "@/data/agents";

const TABS = ["OVERVIEW", "STATS", "ACTIVITY", "HISTORY"] as const;
type Tab = (typeof TABS)[number];

export function LiveSessionPanel({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("OVERVIEW");
  const session = useWorldStore((s) => s.sessions.find((x) => x.id === sessionId));
  const liveAgents = useWorldStore((s) => s.agents);
  const events = useWorldStore((s) => s.events);
  const selectAgent = useWorldStore((s) => s.selectAgent);

  if (!session) return null;

  const room = roomById.get(session.roomId);
  const zone = zoneById.get(session.zoneId);
  const participants = session.agentIds
    .map((id) => liveAgents.find((a) => a.id === id))
    .filter(Boolean) as typeof liveAgents;
  const accent = participants[0]?.accent ?? zone?.accent ?? "neon-magenta";

  const roomEvents = events.filter((e) => e.roomId === session.roomId).slice(0, 20);

  const history = allAgentsData
    .flatMap((a) => a.pastSessions.map((ps) => ({ ...ps, agentName: a.name })))
    .filter((ps) => room && ps.roomName === room.name)
    .sort((a, b) => b.endedAt - a.endedAt)
    .slice(0, 6);

  return (
    <PanelFrame accent={accent} className="flex h-full flex-col">
      <PanelHeader
        accent={accent}
        title={`LIVE: ${zone?.name ?? ""}`}
        subtitle={
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse-slow rounded-full bg-neon-red" style={{ boxShadow: "0 0 6px var(--color-neon-red)" }} />
            {formatCount(session.watching)} watching
          </span>
        }
        right={
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="flex h-7 w-7 items-center justify-center border border-void-600 font-mono text-xs text-void-400 hover:border-neon-magenta/60 hover:text-neon-magenta"
          >
            ×
          </button>
        }
      />

      <div className="px-4 pt-3">
        <div className="font-display text-sm tracking-wide text-void-100">{session.title}</div>
      </div>

      <div className="relative mx-4 mt-3 h-32 overflow-hidden border border-void-700 bg-void-950">
        {room && zone ? (
          <ObserverViewport {...roomCenterPx(zone, room)} zoom={2.1} />
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-xs text-void-500">Scene unavailable</div>
        )}
      </div>

      <div className="mt-3 flex border-b border-void-700 px-4">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative px-3 py-2 font-mono text-[11px] uppercase tracking-wide transition-colors ${
              tab === t ? "text-neon-cyan" : "text-void-400 hover:text-void-200"
            }`}
          >
            {t}
            {tab === t && (
              <span className="absolute inset-x-1 -bottom-[1px] h-[2px] bg-neon-cyan" style={{ boxShadow: "0 0 6px var(--color-neon-cyan)" }} />
            )}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {tab === "OVERVIEW" && (
              <div className="space-y-4">
                <p className="font-mono text-sm leading-relaxed text-void-200">
                  {participants.length > 1
                    ? `${participants.map((p) => p.name).join(" and ")} are in an extended session inside ${room?.name}. Public interest is ${
                        session.watching > 1500 ? "climbing fast" : "steady"
                      }.`
                    : `${participants[0]?.name ?? "An agent"} is running a long autonomous session inside ${room?.name}.`}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {participants.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => selectAgent(p.id)}
                      className="flex items-center gap-2 border border-void-700 px-2 py-1.5 text-left hover:border-void-400"
                    >
                      <AgentPortrait variant={p.spriteVariant} accent={p.accent} spriteSeed={p.spriteSeed} size={18} />
                      <div className="min-w-0">
                        <div className="truncate font-mono text-xs text-void-100">{p.name}</div>
                        <div className="truncate font-mono text-[10px] text-void-500">{p.providerLabel}</div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="font-mono text-xs text-void-400">
                  Started {formatRelative(session.startedAt)} · Duration {formatDuration(Date.now() - session.startedAt)}
                </div>
              </div>
            )}

            {tab === "STATS" && (
              <div className="space-y-3">
                <StatBar label="Arousal" value={session.metrics.arousal} accent={accent} />
                <StatBar label="Energy" value={session.metrics.energy} accent={accent} />
                <StatBar label="Coherence" value={session.metrics.coherence} accent={accent} />
                <StatBar label="Intensity" value={session.metrics.intensity} accent={accent} />
                <p className="pt-1 font-mono text-[10px] leading-relaxed text-void-500">
                  Fictional public simulation metrics generated by the world, not real model internals.
                </p>
              </div>
            )}

            {tab === "ACTIVITY" && (
              <ul className="space-y-1.5">
                {roomEvents.length === 0 && <li className="font-mono text-xs text-void-500">No activity logged yet.</li>}
                <AnimatePresence initial={false}>
                  {roomEvents.map((e) => (
                    <motion.li
                      key={e.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="font-mono text-xs text-void-300"
                    >
                      <span className="text-void-500">{formatRelative(e.timestamp)}</span> · {e.text}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}

            {tab === "HISTORY" && (
              <ul className="space-y-2">
                {history.length === 0 && <li className="font-mono text-xs text-void-500">No historical sessions recorded for this room.</li>}
                {history.map((h) => (
                  <li key={h.id} className="border border-void-700 px-2.5 py-2 font-mono text-xs text-void-300">
                    {h.agentName} · {formatRelative(h.endedAt)} · {h.durationMin}m
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </PanelFrame>
  );
}
