import { AnimatePresence, motion } from "framer-motion";
import { Analytics } from "@vercel/analytics/react";
import { useLiveWorld } from "@/hooks/useLiveWorld";
import { useWorldStore } from "@/store/worldStore";
import { AppShell } from "@/components/layout/AppShell";
import { GlobalInspectorDrawer } from "@/components/layout/GlobalInspectorDrawer";
import { ConnectAgentModal } from "@/components/layout/ConnectAgentModal";
import { BootLoader } from "@/components/ui/Loader";
import { MapPage } from "@/pages/MapPage";
import { AgentsPage } from "@/pages/AgentsPage";
import { RoomsPage } from "@/pages/RoomsPage";
import { EventsPage } from "@/pages/EventsPage";
import { ArchivePage } from "@/pages/ArchivePage";
import { LeaderboardsPage } from "@/pages/LeaderboardsPage";
import { FavoritesPage } from "@/pages/FavoritesPage";

function App() {
  useLiveWorld();
  const isBooting = useWorldStore((s) => s.isBooting);
  const activeNav = useWorldStore((s) => s.activeNav);

  return (
    <>
      <AnimatePresence>{isBooting && <BootLoader />}</AnimatePresence>
      <AppShell>
        <motion.div key={activeNav} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="h-full">
          {activeNav === "map" && <MapPage />}
          {activeNav === "agents" && <AgentsPage />}
          {activeNav === "rooms" && <RoomsPage />}
          {activeNav === "events" && <EventsPage />}
          {activeNav === "archive" && <ArchivePage />}
          {activeNav === "leaderboards" && <LeaderboardsPage />}
          {activeNav === "favorites" && <FavoritesPage />}
        </motion.div>
        <GlobalInspectorDrawer />
      </AppShell>
      <Analytics />
      <ConnectAgentModal />
    </>
  );
}

export default App;
