import { useState } from "react";
import { useWorldStore } from "@/store/worldStore";
import { Logo } from "./Logo";
import { SearchBar } from "@/components/ui/SearchBar";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { formatCount } from "@/lib/time";
import { PixelIcon } from "@/components/ui/PixelIcon";

export function MobileStatusBar() {
  const stats = useWorldStore((s) => s.stats);
  const searchQuery = useWorldStore((s) => s.searchQuery);
  const setSearch = useWorldStore((s) => s.setSearch);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex flex-col border-b border-void-700 bg-void-950/95 backdrop-blur-sm md:hidden">
      <div className="flex h-12 items-center gap-2 px-3">
        <Logo />
        <div className="flex items-center gap-1 rounded-sm border border-neon-cyan/40 bg-neon-cyan/10 px-1.5 py-0.5">
          <span className="h-1.5 w-1.5 animate-pulse-slow rounded-full bg-neon-cyan" style={{ boxShadow: "0 0 6px var(--color-neon-cyan)" }} />
          <span className="font-display text-[8px] text-neon-cyan">LIVE</span>
        </div>
        <div className="ml-auto flex items-center gap-3 font-mono text-[11px] text-void-300">
          <span className="flex items-center gap-1">
            <PixelIcon name="dot" size={8} className="text-neon-magenta" />
            <AnimatedCounter value={stats.humansWatching} format={formatCount} className="text-void-100" />
          </span>
          <button
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Toggle search"
            className={`flex h-7 w-7 items-center justify-center border ${searchOpen ? "border-neon-cyan/60 text-neon-cyan" : "border-void-600 text-void-300"}`}
          >
            <PixelIcon name="search" size={10} />
          </button>
        </div>
      </div>
      {searchOpen && (
        <div className="px-3 pb-2">
          <SearchBar value={searchQuery} onChange={setSearch} />
        </div>
      )}
    </header>
  );
}
