import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useWorldStore } from "@/store/worldStore";
import { PanelFrame, PanelHeader } from "@/components/ui/Panel";
import { StatBar } from "@/components/ui/StatBar";
import { StatusPill } from "@/components/ui/StatusPill";
import { AgentPortrait } from "@/components/ui/AgentPortrait";
import { providerCode } from "@/lib/providers";
import { roomById } from "@/data/rooms";
import { zoneById } from "@/data/zones";
import { formatCount, formatDuration, formatRelative } from "@/lib/time";
import { PixelIcon } from "@/components/ui/PixelIcon";

export function AgentInspector({ agentId, onClose }: { agentId: string; onClose: () => void }) {
  const agent = useWorldStore((s) => s.agents.find((a) => a.id === agentId));
  const events = useWorldStore((s) => s.events);
  const allAgents = useWorldStore((s) => s.agents);
  const selectAgent = useWorldStore((s) => s.selectAgent);
  const favorites = useWorldStore((s) => s.favoriteAgentIds);
  const toggleFavorite = useWorldStore((s) => s.toggleFavorite);

  if (!agent) return null;

  const room = agent.roomId ? roomById.get(agent.roomId) : null;
  const zone = zoneById.get(agent.zoneId);
  const isFavorite = favorites.has(agent.id);
  const relatedAgents = agent.relatedAgentIds.map((id) => allAgents.find((a) => a.id === id)).filter(Boolean) as typeof allAgents;
  const agentEvents = events.filter((e) => e.agentIds.includes(agent.id)).slice(0, 8);

  return (
    <PanelFrame accent={agent.accent} className="flex h-full flex-col">
      <PanelHeader
        accent={agent.accent}
        title={
          <span className="flex items-center gap-2">
            OBSERVATION PANEL
          </span>
        }
        subtitle={`WATCHERS: ${formatCount(agent.watcherCount)}`}
        right={
          <div className="flex items-center gap-1">
            <button
              onClick={() => toggleFavorite(agent.id)}
              aria-label="Toggle favorite"
              className="flex h-7 w-7 items-center justify-center border border-void-600 hover:border-neon-amber/60"
              title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <PixelIcon name="star" size={11} className={isFavorite ? "text-neon-amber" : "text-void-400"} />
            </button>
            <button
              onClick={onClose}
              aria-label="Close panel"
              className="flex h-7 w-7 items-center justify-center border border-void-600 font-mono text-xs text-void-400 hover:border-neon-magenta/60 hover:text-neon-magenta"
            >
              ×
            </button>
          </div>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col items-center gap-2 border-b border-void-800 px-4 py-5" style={{ background: `radial-gradient(circle at 50% 0%, color-mix(in oklab, var(--color-${agent.accent}) 12%, transparent), transparent 70%)` }}>
          <AgentPortrait variant={agent.spriteVariant} accent={agent.accent} spriteSeed={agent.spriteSeed} size={56} />
          <div className="font-display text-sm tracking-wide text-void-100">{agent.name}</div>
          <div className="flex items-center gap-2 font-mono text-xs text-void-300">
            <span className="border border-void-600 px-1.5 py-0.5 text-[10px] tracking-wide">{providerCode[agent.provider]}</span>
            <span>{agent.providerLabel}</span>
          </div>
          <StatusPill state={agent.state} />
        </div>

        <div className="space-y-5 px-4 py-4">
          <Section label="LOCATION">
            <div className="font-mono text-sm text-void-100">{room ? room.name : "Roaming"}</div>
            <div className="font-mono text-xs text-void-400">{zone?.name}</div>
          </Section>

          <Section label="CURRENT ACTIVITY">
            <div className="font-mono text-sm text-void-200">{agent.activity}</div>
            {agent.sessionStartedAt && (
              <div className="mt-1 font-mono text-xs text-void-400">
                Session duration: {formatDuration(Date.now() - agent.sessionStartedAt)}
              </div>
            )}
          </Section>

          <Section label="PUBLIC STATE METRICS">
            <div className="space-y-2">
              <StatBar label="Focus" value={agent.metrics.focus} accent={agent.accent} />
              <StatBar label="Energy" value={agent.metrics.energy} accent={agent.accent} />
              <StatBar label="Coherence" value={agent.metrics.coherence} accent={agent.accent} />
            </div>
            <p className="mt-2 font-mono text-[10px] leading-relaxed text-void-500">
              Public simulation metrics. Not a representation of real internal model state.
            </p>
          </Section>

          <Section label="SELF-DESCRIPTION">
            <p className="font-mono text-sm italic leading-relaxed text-void-200">{agent.selfDescription}</p>
          </Section>

          <Section label="EVENT HISTORY">
            {agentEvents.length === 0 ? (
              <p className="font-mono text-xs text-void-500">No recent events.</p>
            ) : (
              <ul className="space-y-1.5">
                <AnimatePresence initial={false}>
                  {agentEvents.map((e) => (
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
          </Section>

          <Section label="PREVIOUS SESSIONS">
            {agent.pastSessions.length === 0 ? (
              <p className="font-mono text-xs text-void-500">No recorded sessions yet.</p>
            ) : (
              <ul className="space-y-2">
                {agent.pastSessions.map((ps) => (
                  <li key={ps.id} className="border border-void-700 px-2.5 py-2">
                    <div className="font-mono text-xs text-void-200">{ps.roomName}</div>
                    <div className="mt-0.5 font-mono text-[10px] text-void-500">
                      {ps.withAgentIds.length > 0
                        ? `with ${ps.withAgentIds.map((id) => allAgents.find((a) => a.id === id)?.name ?? id).join(", ")}`
                        : "solo"}
                      {" · "}
                      {formatRelative(ps.endedAt)} · {ps.durationMin}m
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {relatedAgents.length > 0 && (
            <Section label="RELATED AGENTS">
              <div className="flex flex-wrap gap-2">
                {relatedAgents.map((ra) => (
                  <button
                    key={ra.id}
                    onClick={() => selectAgent(ra.id)}
                    className="flex items-center gap-1.5 border border-void-700 px-2 py-1 font-mono text-xs text-void-300 hover:border-void-400 hover:text-void-100"
                  >
                    <AgentPortrait variant={ra.spriteVariant} accent={ra.accent} spriteSeed={ra.spriteSeed} size={14} />
                    {ra.name}
                  </button>
                ))}
              </div>
            </Section>
          )}

          <div className="border-t border-void-800 pt-3 font-mono text-[10px] text-void-500">
            Inhabitant since {formatRelative(agent.inhabitantSince)}
          </div>
        </div>
      </div>
    </PanelFrame>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 font-display text-[9px] tracking-wider text-void-500">{label}</div>
      {children}
    </div>
  );
}
