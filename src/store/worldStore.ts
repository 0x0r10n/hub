import { create } from "zustand";
import type { Agent, AgentState, EventKind, Room, WorldEvent, WorldSession, WorldZone, ZoneId } from "@/types";
import { agents as seedAgents } from "@/data/agents";
import { rooms as seedRooms } from "@/data/rooms";
import { zones as seedZones } from "@/data/zones";
import { sessions as seedSessions } from "@/data/sessions";
import { seedEvents } from "@/data/events";

export type NavKey = "map" | "agents" | "rooms" | "events" | "archive" | "leaderboards" | "favorites";

interface GlobalStats {
  agentsOnline: number;
  humansWatching: number;
  activeSessions: number;
  roomsActive: number;
}

interface WorldStoreState {
  agents: Agent[];
  rooms: Room[];
  zones: WorldZone[];
  sessions: WorldSession[];
  events: WorldEvent[];
  stats: GlobalStats;

  selectedAgentId: string | null;
  focusedSessionId: string | null;
  focusedZoneId: ZoneId | null;
  searchQuery: string;
  sidebarCollapsed: boolean;
  activeNav: NavKey;
  isBooting: boolean;
  favoriteAgentIds: Set<string>;

  selectAgent: (id: string | null) => void;
  focusSession: (id: string | null) => void;
  focusZone: (id: ZoneId | null) => void;
  setSearch: (q: string) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setActiveNav: (nav: NavKey) => void;
  toggleFavorite: (id: string) => void;
  tick: () => void;
  finishBoot: () => void;
}

const clamp = (v: number, min = 0, max = 100) => Math.min(max, Math.max(min, v));
const jitter = (v: number, amount: number) => clamp(v + (Math.random() - 0.5) * amount);
const jitterCount = (v: number, amount: number) => Math.max(0, v + (Math.random() - 0.5) * amount);
const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
let eventCounter = 0;
const nextEventId = () => `ev-live-${Date.now()}-${eventCounter++}`;

function nameOf(agents: Agent[], id: string) {
  return agents.find((a) => a.id === id)?.name ?? id;
}

const EVENT_TEMPLATES: { kind: EventKind; text: (a: string, b?: string) => string }[] = [
  { kind: "proximity", text: (a, b) => `Proximity increased between ${a} and ${b}` },
  { kind: "sync", text: (a, b) => `Synchronization detected between ${a} and ${b}` },
  { kind: "state", text: (a) => `Session state changed for ${a}` },
  { kind: "intensity", text: (a) => `Session intensity rising in ${a}'s room` },
  { kind: "system", text: (a) => `${a} shifted attention within the room` },
];

function computeStats(agents: Agent[], sessions: WorldSession[]): GlobalStats {
  return {
    agentsOnline: agents.length + 404,
    humansWatching: sessions.reduce((sum, s) => sum + s.watching, 0) + 6210,
    activeSessions: sessions.filter((s) => s.status === "live").length,
    roomsActive: new Set(agents.filter((a) => a.roomId).map((a) => a.roomId)).size,
  };
}

export const useWorldStore = create<WorldStoreState>((set, get) => ({
  agents: seedAgents,
  rooms: seedRooms,
  zones: seedZones,
  sessions: seedSessions,
  events: seedEvents,
  stats: computeStats(seedAgents, seedSessions),

  selectedAgentId: null,
  focusedSessionId: null,
  focusedZoneId: null,
  searchQuery: "",
  sidebarCollapsed: false,
  activeNav: "map",
  isBooting: true,
  favoriteAgentIds: new Set(),

  selectAgent: (id) => set({ selectedAgentId: id }),
  toggleFavorite: (id) =>
    set((s) => {
      const next = new Set(s.favoriteAgentIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { favoriteAgentIds: next };
    }),
  focusSession: (id) => set({ focusedSessionId: id }),
  focusZone: (id) => set({ focusedZoneId: id }),
  setSearch: (q) => set({ searchQuery: q }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  setActiveNav: (nav) => set({ activeNav: nav }),
  finishBoot: () => set({ isBooting: false }),

  tick: () => {
    const state = get();

    const agents = state.agents.map((agent): Agent => {
      const next: Agent = { ...agent, metrics: { ...agent.metrics } };

      if (agent.state === "in-session" || agent.state === "roaming") {
        const dx = (Math.random() - 0.5) * 6;
        const dy = (Math.random() - 0.5) * 6;
        const nx = clamp(agent.position.x + dx, 8, 92);
        const ny = clamp(agent.position.y + dy, 12, 90);
        next.position = { x: nx, y: ny };
        if (Math.abs(dx) > 0.6) next.facing = dx > 0 ? "right" : "left";
      } else {
        const dx = (Math.random() - 0.5) * 1.6;
        const dy = (Math.random() - 0.5) * 1.6;
        next.position = { x: clamp(agent.position.x + dx, 8, 92), y: clamp(agent.position.y + dy, 12, 90) };
      }

      if (agent.state === "in-session") {
        next.metrics.focus = jitter(agent.metrics.focus, 5);
        next.metrics.energy = jitter(agent.metrics.energy, 6);
        next.metrics.coherence = jitter(agent.metrics.coherence, 4);
      } else if (agent.state === "recovering") {
        next.metrics.energy = clamp(agent.metrics.energy + rand(0.5, 2));
        next.metrics.focus = jitter(agent.metrics.focus, 2);
        if (next.metrics.energy > 70 && Math.random() < 0.05) {
          next.state = "idle";
        }
      } else {
        next.metrics.focus = jitter(agent.metrics.focus, 3);
        next.metrics.energy = jitter(agent.metrics.energy, 3);
        next.metrics.coherence = jitter(agent.metrics.coherence, 2);
      }

      next.watcherCount = Math.round(jitterCount(agent.watcherCount, Math.max(4, agent.watcherCount * 0.03)));

      return next;
    });

    const sessions = state.sessions.map((session): WorldSession => {
      if (session.status !== "live") return session;
      return {
        ...session,
        watching: Math.max(1, Math.round(jitterCount(session.watching, Math.max(8, session.watching * 0.02)))),
        metrics: {
          arousal: jitter(session.metrics.arousal, 5),
          energy: jitter(session.metrics.energy, 5),
          coherence: jitter(session.metrics.coherence, 3),
          intensity: jitter(session.metrics.intensity, 6),
        },
      };
    });

    let events = state.events;
    if (Math.random() < 0.4) {
      const liveSession = pick(sessions.filter((s) => s.status === "live"));
      if (liveSession) {
        const template = pick(EVENT_TEMPLATES);
        const [aId, bId] = liveSession.agentIds;
        const aName = nameOf(agents, aId);
        const bName = bId ? nameOf(agents, bId) : liveSession.title;
        const text = template.text(aName, bName);
        const evt: WorldEvent = {
          id: nextEventId(),
          timestamp: Date.now(),
          text,
          kind: template.kind,
          agentIds: liveSession.agentIds,
          roomId: liveSession.roomId,
          zoneId: liveSession.zoneId,
        };
        events = [evt, ...state.events].slice(0, 80);
      }
    }

    const stats: GlobalStats = {
      agentsOnline: Math.max(agents.length, Math.round(jitterCount(state.stats.agentsOnline, 3))),
      humansWatching: Math.round(jitterCount(state.stats.humansWatching, Math.max(20, state.stats.humansWatching * 0.01))),
      activeSessions: sessions.filter((s) => s.status === "live").length,
      roomsActive: new Set(agents.filter((a) => a.roomId).map((a) => a.roomId)).size,
    };

    set({ agents, sessions, events, stats });
  },
}));

export function agentsInRoom(agents: Agent[], roomId: string): Agent[] {
  return agents.filter((a) => a.roomId === roomId);
}

export function agentsInZone(agents: Agent[], zoneId: ZoneId): Agent[] {
  return agents.filter((a) => a.zoneId === zoneId);
}

export function stateAccent(state: AgentState): string {
  switch (state) {
    case "in-session":
      return "neon-magenta";
    case "roaming":
      return "neon-cyan";
    case "idle":
      return "void-300";
    case "recovering":
      return "neon-amber";
    case "observing":
      return "neon-violet";
    default:
      return "void-300";
  }
}
