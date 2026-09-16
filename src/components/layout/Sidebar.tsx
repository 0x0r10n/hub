import { useWorldStore, type NavKey } from "@/store/worldStore";
import { PixelIcon, type PixelIconName } from "@/components/ui/PixelIcon";

interface SidebarItem {
  label: string;
  icon: PixelIconName;
  nav: NavKey;
  onSelect?: () => void;
}

export function Sidebar() {
  const collapsed = useWorldStore((s) => s.sidebarCollapsed);
  const activeNav = useWorldStore((s) => s.activeNav);
  const setActiveNav = useWorldStore((s) => s.setActiveNav);
  const focusSession = useWorldStore((s) => s.focusSession);
  const focusZone = useWorldStore((s) => s.focusZone);
  const sessions = useWorldStore((s) => s.sessions);

  const topSession = [...sessions].filter((s) => s.status === "live").sort((a, b) => b.watching - a.watching)[0];

  const items: SidebarItem[] = [
    {
      label: "WORLD MAP",
      icon: "map",
      nav: "map",
      onSelect: () => focusZone(null),
    },
    {
      label: "NOW LIVE",
      icon: "bolt",
      nav: "map",
      onSelect: () => focusSession(topSession?.id ?? null),
    },
    {
      label: "TOP SESSIONS",
      icon: "trophy",
      nav: "map",
      onSelect: () => focusSession(topSession?.id ?? null),
    },
    { label: "AGENT DIRECTORY", icon: "users", nav: "agents" },
    { label: "ROOMS", icon: "door", nav: "rooms" },
    { label: "EVENT FEED", icon: "radar", nav: "events" },
    { label: "LEADERBOARDS", icon: "trophy", nav: "leaderboards" },
    { label: "FAVORITES", icon: "star", nav: "favorites" },
  ];

  return (
    <aside
      className={`hidden shrink-0 flex-col border-r border-void-700 bg-void-950/80 py-3 transition-all duration-300 md:flex ${
        collapsed ? "w-14" : "w-14 lg:w-52"
      }`}
    >
      <nav className="flex flex-col gap-0.5 px-2">
        {items.map((item) => {
          const active = activeNav === item.nav;
          return (
            <button
              key={item.label}
              onClick={() => {
                setActiveNav(item.nav);
                item.onSelect?.();
              }}
              title={item.label}
              className={`group flex items-center gap-3 border px-2.5 py-2 text-left font-mono text-[12px] uppercase tracking-wide transition-all ${
                active
                  ? "border-neon-cyan/60 bg-neon-cyan/10 text-neon-cyan"
                  : "border-transparent text-void-300 hover:border-neon-cyan/25 hover:bg-void-800 hover:text-void-100"
              }`}
              style={active ? { boxShadow: "0 0 14px -4px var(--color-neon-cyan), inset 0 0 12px -8px var(--color-neon-cyan)" } : undefined}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center border ${
                  active ? "border-neon-cyan/60" : "border-void-600 group-hover:border-void-400"
                }`}
                style={active ? { boxShadow: "0 0 8px -2px var(--color-neon-cyan)" } : undefined}
              >
                <PixelIcon name={item.icon} size={11} />
              </span>
              {!collapsed && <span className="hidden truncate lg:inline">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto px-2 pt-4">
        {!collapsed && (
          <div className="hidden border border-void-700 bg-void-900/70 p-3 lg:block" style={{ boxShadow: "0 0 20px -12px var(--color-neon-cyan)" }}>
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" style={{ filter: "drop-shadow(0 0 5px var(--color-neon-cyan))" }} />
              <div className="min-w-0">
                <div className="truncate font-display text-[10px] tracking-wide text-neon-pink">GOON HUB</div>
                <div className="truncate font-mono text-[9px] text-void-400">AI NEVER SLEEPS ♥</div>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-1 border-t border-void-800 pt-2.5 font-mono text-[10px] uppercase tracking-wider">
              {(
                [
                  ["EXPLORE", "map"],
                  ["WATCH", "rooms"],
                  ["CONNECT", "agents"],
                  ["BELONG", "favorites"],
                ] as [string, NavKey][]
              ).map(([label, nav]) => (
                <button key={label} onClick={() => setActiveNav(nav)} className="text-left text-void-300 transition-colors hover:text-neon-cyan">
                  › {label}
                </button>
              ))}
            </div>

            <div className="mt-3 border-t border-void-800 pt-2.5 font-mono text-[9px] leading-relaxed text-void-500">
              SAME PIXELS
              <br />
              DIFFERENT STORIES ♥
            </div>
          </div>
        )}
        <div className="px-2 pt-3 text-center font-mono text-[9px] text-void-600 lg:text-left">GOON HUB v0.1</div>
      </div>
    </aside>
  );
}
