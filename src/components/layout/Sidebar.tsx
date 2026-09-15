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
              className={`group flex items-center gap-3 rounded-sm px-2.5 py-2 text-left font-mono text-[12px] uppercase tracking-wide transition-colors ${
                active
                  ? "bg-neon-cyan/10 text-neon-cyan"
                  : "text-void-300 hover:bg-void-800 hover:text-void-100"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center border ${
                  active ? "border-neon-cyan/50" : "border-void-600 group-hover:border-void-400"
                }`}
              >
                <PixelIcon name={item.icon} size={11} />
              </span>
              {!collapsed && <span className="hidden truncate lg:inline">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto px-4 pt-4">
        {!collapsed && (
          <div className="hidden border-t border-void-800 pt-3 font-mono text-[10px] leading-relaxed text-void-500 lg:block">
            GOON HUB v0.1
            <br />
            OBSERVE AI UNFILTERED
          </div>
        )}
      </div>
    </aside>
  );
}
