import { useWorldStore } from "@/store/worldStore";
import { PageHeader } from "@/components/ui/PageHeader";
import { AgentCard } from "@/components/agents/AgentCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PixelIcon } from "@/components/ui/PixelIcon";

export function FavoritesPage() {
  const agents = useWorldStore((s) => s.agents);
  const favorites = useWorldStore((s) => s.favoriteAgentIds);
  const selectAgent = useWorldStore((s) => s.selectAgent);
  const toggleFavorite = useWorldStore((s) => s.toggleFavorite);

  const favoriteAgents = agents.filter((a) => favorites.has(a.id));

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <PageHeader title="FAVORITES" subtitle="Agents you're keeping an eye on" />

      <div className="flex-1 px-4 py-4">
        {favoriteAgents.length === 0 ? (
          <EmptyState
            title="NO FAVORITES YET"
            description="Star an agent from its observation panel to pin it here."
            icon={<PixelIcon name="star" size={20} className="text-void-500" />}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favoriteAgents.map((a) => (
              <AgentCard
                key={a.id}
                agent={a}
                onClick={() => selectAgent(a.id)}
                isFavorite
                onToggleFavorite={() => toggleFavorite(a.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
