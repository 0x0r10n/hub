import type { WorldSession, Agent, WorldZone } from "@/types";
import { PixelSprite } from "@/components/map/PixelSprite";
import { formatCount } from "@/lib/time";

export function SessionCard({
  session,
  participants,
  zone,
  active,
  onClick,
}: {
  session: WorldSession;
  participants: Agent[];
  zone: WorldZone | undefined;
  active: boolean;
  onClick: () => void;
}) {
  const accent = participants[0]?.accent ?? zone?.accent ?? "neon-cyan";

  return (
    <button
      onClick={onClick}
      className={`group relative flex w-44 shrink-0 snap-start flex-col gap-2 border bg-void-900/80 px-3 py-2.5 text-left transition-all sm:w-52 ${
        active ? "border-neon-cyan/70" : "border-void-700 hover:border-void-500"
      }`}
      style={active ? { boxShadow: "0 0 16px -4px var(--color-neon-cyan)" } : undefined}
    >
      <div className="flex items-center justify-center gap-2 rounded-sm bg-void-950/60 py-2">
        {participants.slice(0, 2).map((p) => (
          <PixelSprite key={p.id} variant={p.spriteVariant} accent={p.accent} size={22} facing={p.facing} />
        ))}
        {participants.length === 0 && <span className="font-mono text-[10px] text-void-500">—</span>}
      </div>

      <div className="min-w-0">
        <div className="truncate font-mono text-xs text-void-100">{session.title}</div>
        <div className="mt-0.5 flex items-center justify-between font-mono text-[10px] text-void-400">
          <span className="flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-neon-red" style={{ boxShadow: "0 0 4px var(--color-neon-red)" }} />
            {formatCount(session.watching)} watching
          </span>
          <span style={{ color: `var(--color-${accent})` }}>{zone?.shortLabel}</span>
        </div>
      </div>
    </button>
  );
}
