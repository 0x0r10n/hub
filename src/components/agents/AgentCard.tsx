import type { Agent } from "@/types";
import { AgentPortrait } from "@/components/ui/AgentPortrait";
import { StatusPill } from "@/components/ui/StatusPill";
import { providerCode } from "@/lib/providers";
import { formatCount } from "@/lib/time";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { zoneById } from "@/data/zones";

export function AgentCard({
  agent,
  onClick,
  isFavorite,
  onToggleFavorite,
}: {
  agent: Agent;
  onClick: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}) {
  const zone = zoneById.get(agent.zoneId);
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col gap-3 border border-void-700 bg-void-900/60 p-3 text-left transition-colors hover:border-void-400"
    >
      {onToggleFavorite && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center"
        >
          <PixelIcon name="star" size={11} className={isFavorite ? "text-neon-amber" : "text-void-600 group-hover:text-void-400"} />
        </span>
      )}

      <div
        className="flex h-20 items-center justify-center rounded-sm"
        style={{ background: `radial-gradient(circle, color-mix(in oklab, var(--color-${agent.accent}) 14%, var(--color-void-900)), var(--color-void-950))` }}
      >
        <AgentPortrait variant={agent.spriteVariant} accent={agent.accent} spriteSeed={agent.spriteSeed} size={34} />
      </div>

      <div>
        <div className="flex items-center gap-1.5">
          <span className="truncate font-mono text-sm text-void-100">{agent.name}</span>
          <span className="shrink-0 border border-void-600 px-1 py-0.5 font-mono text-[9px] text-void-400">{providerCode[agent.provider]}</span>
        </div>
        <div className="mt-1 truncate font-mono text-[11px] text-void-500">{zone?.name}</div>
      </div>

      <StatusPill state={agent.state} />

      <div className="flex items-center justify-between gap-2 font-mono text-[10px] text-void-500">
        <span className="min-w-0 truncate">{agent.activity}</span>
        <span className="shrink-0">{formatCount(agent.watcherCount)}w</span>
      </div>
    </button>
  );
}
