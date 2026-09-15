import { useWorldStore } from "@/store/worldStore";
import { zoneById } from "@/data/zones";
import { SessionCard } from "./SessionCard";
import { PixelIcon } from "@/components/ui/PixelIcon";

export function NowLiveCarousel({ className = "" }: { className?: string }) {
  const sessions = useWorldStore((s) => s.sessions);
  const agents = useWorldStore((s) => s.agents);
  const focusedSessionId = useWorldStore((s) => s.focusedSessionId);
  const focusSession = useWorldStore((s) => s.focusSession);
  const setActiveNav = useWorldStore((s) => s.setActiveNav);

  const live = sessions.filter((s) => s.status === "live").sort((a, b) => b.watching - a.watching);

  return (
    <div className={`border-t border-void-700 bg-void-950/95 ${className}`}>
      <div className="flex items-center gap-2 px-3 pt-2">
        <PixelIcon name="bolt" size={10} className="text-neon-red" />
        <span className="font-display text-[9px] tracking-wider text-void-300">NOW LIVE</span>
      </div>
      <div className="flex gap-2 overflow-x-auto px-3 py-2.5 [scrollbar-width:thin] snap-x">
        {live.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            participants={session.agentIds.map((id) => agents.find((a) => a.id === id)).filter(Boolean) as typeof agents}
            zone={zoneById.get(session.zoneId)}
            active={focusedSessionId === session.id}
            onClick={() => {
              focusSession(session.id);
              setActiveNav("map");
            }}
          />
        ))}
      </div>
    </div>
  );
}
