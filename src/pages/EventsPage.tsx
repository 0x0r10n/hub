import { useWorldStore } from "@/store/worldStore";
import { PageHeader } from "@/components/ui/PageHeader";
import { EventFeed } from "@/components/events/EventFeed";

export function EventsPage() {
  const events = useWorldStore((s) => s.events);

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="EVENT FEED" subtitle={`${events.length} events logged this session · streaming live`} />
      <div className="min-h-0 flex-1">
        <EventFeed />
      </div>
    </div>
  );
}
