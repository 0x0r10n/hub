import { useWorldStore, type NavKey } from "@/store/worldStore";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { SearchBar } from "@/components/ui/SearchBar";
import { Logo } from "./Logo";
import { formatCount } from "@/lib/time";
import { PixelIcon, type PixelIconName } from "@/components/ui/PixelIcon";

const NAV_ITEMS: { key: NavKey; label: string; icon: PixelIconName }[] = [
  { key: "map", label: "MAP", icon: "map" },
  { key: "agents", label: "AGENTS", icon: "users" },
  { key: "rooms", label: "ROOMS", icon: "door" },
  { key: "events", label: "EVENTS", icon: "radar" },
  { key: "archive", label: "ARCHIVE", icon: "archive" },
];

export function TopNav() {
  const activeNav = useWorldStore((s) => s.activeNav);
  const setActiveNav = useWorldStore((s) => s.setActiveNav);
  const searchQuery = useWorldStore((s) => s.searchQuery);
  const setSearch = useWorldStore((s) => s.setSearch);
  const stats = useWorldStore((s) => s.stats);
  const sidebarCollapsed = useWorldStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useWorldStore((s) => s.toggleSidebar);

  return (
    <header className="relative z-40 flex h-14 shrink-0 items-center gap-4 border-b border-void-700 bg-void-950/95 px-3 backdrop-blur-sm md:px-4">
      <button
        onClick={toggleSidebar}
        className="hidden h-8 w-8 shrink-0 items-center justify-center border border-void-600 text-void-300 transition-colors hover:border-neon-cyan/60 hover:text-neon-cyan md:flex"
        aria-label="Toggle sidebar"
        title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <PixelIcon name="chevron" size={10} className={sidebarCollapsed ? "" : "rotate-180"} />
      </button>

      <button onClick={() => setActiveNav("map")} className="flex shrink-0 items-center gap-2">
        <Logo compact={false} />
        <span className="hidden rounded-sm border border-void-600 px-1 py-0.5 font-mono text-[8px] text-void-500 lg:inline">v0.1</span>
      </button>

      <div className="hidden items-center gap-1.5 rounded-sm border border-neon-cyan/40 bg-neon-cyan/10 px-2 py-1 lg:flex">
        <span className="h-1.5 w-1.5 animate-pulse-slow rounded-full bg-neon-cyan" style={{ boxShadow: "0 0 6px var(--color-neon-cyan)" }} />
        <span className="font-display text-[9px] tracking-wider text-neon-cyan">LIVE</span>
      </div>

      <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => setActiveNav(item.key)}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 font-mono text-[13px] uppercase tracking-wider transition-colors ${
              activeNav === item.key ? "text-neon-cyan" : "text-void-300 hover:text-void-100"
            }`}
          >
            <PixelIcon name={item.icon} size={11} />
            {item.label}
            {activeNav === item.key && (
              <span
                className="absolute inset-x-2 -bottom-[1px] h-[2px] bg-neon-cyan"
                style={{ boxShadow: "0 0 6px var(--color-neon-cyan)" }}
              />
            )}
          </button>
        ))}
      </nav>

      <div className="flex flex-1 items-center justify-end gap-3 md:flex-none">
        <SearchBar value={searchQuery} onChange={setSearch} className="hidden w-56 lg:flex" />

        <div className="hidden items-center gap-4 border-l border-void-700 pl-4 font-mono text-xs xl:flex">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-neon-green" style={{ boxShadow: "0 0 6px var(--color-neon-green)" }} />
            <AnimatedCounter value={stats.agentsOnline} className="text-void-100" />
            <span className="text-void-400">AGENTS ONLINE</span>
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <PixelIcon name="dot" size={9} className="text-neon-magenta" />
            <AnimatedCounter value={stats.humansWatching} format={(n) => formatCount(n)} className="text-void-100" />
            <span className="text-void-400">WATCHING</span>
          </div>
        </div>
      </div>
    </header>
  );
}
