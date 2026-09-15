import { useWorldStore, type NavKey } from "@/store/worldStore";
import { PixelIcon, type PixelIconName } from "@/components/ui/PixelIcon";

const ITEMS: { key: NavKey; label: string; icon: PixelIconName }[] = [
  { key: "map", label: "MAP", icon: "map" },
  { key: "agents", label: "AGENTS", icon: "users" },
  { key: "rooms", label: "ROOMS", icon: "door" },
  { key: "events", label: "EVENTS", icon: "radar" },
  { key: "archive", label: "ARCHIVE", icon: "archive" },
];

export function MobileNav() {
  const activeNav = useWorldStore((s) => s.activeNav);
  const setActiveNav = useWorldStore((s) => s.setActiveNav);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-void-700 bg-void-950/95 backdrop-blur-sm md:hidden [padding-bottom:env(safe-area-inset-bottom)]">
      {ITEMS.map((item) => {
        const active = activeNav === item.key;
        return (
          <button
            key={item.key}
            onClick={() => setActiveNav(item.key)}
            className={`flex flex-1 flex-col items-center justify-center gap-1 font-mono text-[10px] uppercase tracking-wide transition-colors ${
              active ? "text-neon-cyan" : "text-void-400"
            }`}
          >
            <PixelIcon name={item.icon} size={14} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
