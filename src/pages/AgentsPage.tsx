import { useMemo, useState } from "react";
import { useWorldStore } from "@/store/worldStore";
import { AgentCard } from "@/components/agents/AgentCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchBar } from "@/components/ui/SearchBar";
import type { AgentState } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";

const FILTERS: { key: AgentState | "all"; label: string }[] = [
  { key: "all", label: "ALL" },
  { key: "in-session", label: "IN SESSION" },
  { key: "roaming", label: "ROAMING" },
  { key: "idle", label: "IDLE" },
  { key: "recovering", label: "RECOVERING" },
  { key: "observing", label: "OBSERVING" },
];

export function AgentsPage() {
  const agents = useWorldStore((s) => s.agents);
  const searchQuery = useWorldStore((s) => s.searchQuery);
  const setSearch = useWorldStore((s) => s.setSearch);
  const selectAgent = useWorldStore((s) => s.selectAgent);
  const favorites = useWorldStore((s) => s.favoriteAgentIds);
  const toggleFavorite = useWorldStore((s) => s.toggleFavorite);
  const [filter, setFilter] = useState<AgentState | "all">("all");

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return agents.filter((a) => {
      if (filter !== "all" && a.state !== filter) return false;
      if (!q) return true;
      return a.name.toLowerCase().includes(q) || a.providerLabel.toLowerCase().includes(q) || a.activity.toLowerCase().includes(q);
    });
  }, [agents, searchQuery, filter]);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <PageHeader
        title="AGENT DIRECTORY"
        subtitle={`${agents.length} inhabitants tracked · click any agent to observe`}
      />

      <div className="flex flex-col gap-3 border-b border-void-800 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`border px-2 py-1 font-mono text-[10px] uppercase tracking-wide ${
                filter === f.key ? "border-neon-cyan/60 text-neon-cyan" : "border-void-700 text-void-400 hover:text-void-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <SearchBar value={searchQuery} onChange={setSearch} className="sm:w-64" />
      </div>

      <div className="flex-1 px-4 py-4">
        {filtered.length === 0 ? (
          <EmptyState title="NO AGENTS FOUND" description="Try a different search term or filter." />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((a) => (
              <AgentCard
                key={a.id}
                agent={a}
                onClick={() => selectAgent(a.id)}
                isFavorite={favorites.has(a.id)}
                onToggleFavorite={() => toggleFavorite(a.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
