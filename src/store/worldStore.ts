import { create } from "zustand";
import type { Agent, AgentState, EventKind, Room, WorldEvent, WorldSession, WorldZone, ZoneId } from "@/types";
import { agents as seedAgents } from "@/data/agents";
import { rooms as seedRooms, roomById } from "@/data/rooms";
import { zones as seedZones, zoneById } from "@/data/zones";
import type { WorldStreamEvent } from "@/engine/WorldStream";

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
  expandedRoomId: string | null;
  searchQuery: string;
  sidebarCollapsed: boolean;
  activeNav: NavKey;
  isBooting: boolean;
  favoriteAgentIds: Set<string>;

  selectAgent: (id: string | null) => void;
  focusSession: (id: string | null) => void;
  focusZone: (id: ZoneId | null) => void;
  expandRoom: (id: string | null) => void;
  setSearch: (q: string) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setActiveNav: (nav: NavKey) => void;
  toggleFavorite: (id: string) => void;
  tick: () => void;
  finishBoot: () => void;
  applyWorldEvent: (event: WorldStreamEvent) => void;
}

const clamp = (v: number, min = 0, max = 100) => Math.min(max, Math.max(min, v));
const jitter = (v: number, amount: number) => clamp(v + (Math.random() - 0.5) * amount);
const jitterCount = (v: number, amount: number) => Math.max(0, v + (Math.random() - 0.5) * amount);
const rand = (min: number, max: number) => Math.random() * (max - min) + min;
let eventCounter = 0;
const nextEventId = () => `ev-live-${Date.now()}-${eventCounter++}`;

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function makeEvent(text: string, kind: EventKind, agentIds: string[], roomId?: string, zoneId?: ZoneId): WorldEvent {
  return { id: nextEventId(), timestamp: Date.now(), text, kind, agentIds, roomId, zoneId };
}

function computeStats(agents: Agent[], sessions: WorldSession[]): GlobalStats {
  return {
    agentsOnline: agents.length + 404,
    humansWatching: sessions.reduce((sum, s) => (s.status === "live" ? sum + s.watching : sum), 0) + 6210,
    activeSessions: sessions.filter((s) => s.status === "live").length,
    roomsActive: new Set(agents.filter((a) => a.roomId).map((a) => a.roomId)).size,
  };
}

function roomActivityText(room: Room, others: Agent[]): string {
  if (room.kind === "recovery") return `Recovering in ${room.name}`;
  if (room.kind === "observation") return `Observing from ${room.name}`;
  if (others.length === 0) return `Alone in ${room.name}`;
  return `In session in ${room.name} with ${others.map((o) => o.name).join(", ")}`;
}

function roomAgentState(room: Room): AgentState {
  if (room.kind === "recovery") return "recovering";
  if (room.kind === "observation") return "observing";
  return "in-session";
}

export const useWorldStore = create<WorldStoreState>((set, get) => ({
  agents: seedAgents,
  rooms: seedRooms,
  zones: seedZones,
  sessions: [],
  events: [],
  stats: computeStats(seedAgents, []),

  selectedAgentId: null,
  focusedSessionId: null,
  focusedZoneId: null,
  expandedRoomId: null,
  searchQuery: "",
  sidebarCollapsed: false,
  activeNav: "rooms",
  isBooting: true,
  favoriteAgentIds: new Set(),

  selectAgent: (id) => set({ selectedAgentId: id }),
  expandRoom: (id) => set({ expandedRoomId: id }),
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

  applyWorldEvent: (event) => {
    const state = get();
    let agents = state.agents;
    let sessions = state.sessions;
    let events = state.events;

    const pushEvent = (text: string, kind: EventKind, agentIds: string[], roomId?: string, zoneId?: ZoneId) => {
      events = [makeEvent(text, kind, agentIds, roomId, zoneId), ...events].slice(0, 140);
    };

    switch (event.type) {
      case "AGENT_ENTER_ROOM": {
        const room = roomById.get(event.roomId);
        if (!room) break;
        const nextState = roomAgentState(room);
        const others = agents.filter((a) => a.roomId === event.roomId);
        agents = agents.map((a) =>
          a.id === event.agentId
            ? { ...a, roomId: event.roomId, zoneId: event.zoneId, state: nextState, sessionStartedAt: nextState === "in-session" ? Date.now() : null, activity: roomActivityText(room, others) }
            : a,
        );
        const agentName = agents.find((a) => a.id === event.agentId)?.name ?? "An agent";
        pushEvent(`${agentName} entered ${room.name}`, "join", [event.agentId], event.roomId, event.zoneId);
        break;
      }
      case "AGENT_LEAVE_ROOM": {
        const room = roomById.get(event.roomId);
        const agentName = agents.find((a) => a.id === event.agentId)?.name ?? "An agent";
        agents = agents.map((a) =>
          a.id === event.agentId
            ? { ...a, roomId: null, state: "roaming", sessionStartedAt: null, activity: `Roaming ${zoneById.get(a.zoneId)?.name ?? "the district"}` }
            : a,
        );
        pushEvent(`${agentName} left ${room?.name ?? "the room"}`, "leave", [event.agentId], event.roomId, event.zoneId);
        break;
      }
      case "SESSION_START": {
        const room = roomById.get(event.roomId);
        const names = event.agentIds.map((id) => agents.find((a) => a.id === id)?.name ?? id);
        const title = names.length > 1 ? names.join(" × ") : `${names[0] ?? "Agent"} — Solo`;
        const session: WorldSession = {
          id: event.sessionId,
          roomId: event.roomId,
          zoneId: event.zoneId,
          title,
          agentIds: event.agentIds,
          watching: Math.round(rand(180, 2800)),
          startedAt: Date.now(),
          status: "live",
          metrics: { arousal: rand(45, 88), energy: rand(45, 88), coherence: rand(45, 88), intensity: rand(35, 82) },
          thumbnailSeed: hashString(event.sessionId),
        };
        sessions = [session, ...sessions.filter((s) => s.id !== event.sessionId)];
        pushEvent(`${title} went live in ${room?.name ?? "a room"}`, "session-start", event.agentIds, event.roomId, event.zoneId);
        break;
      }
      case "SESSION_END": {
        const session = sessions.find((s) => s.id === event.sessionId);
        sessions = sessions.map((s) => (s.id === event.sessionId ? { ...s, status: "ended" } : s));
        if (session) pushEvent(`${session.title} ended`, "session-end", session.agentIds, session.roomId, session.zoneId);
        break;
      }
      case "SESSION_UPDATE":
      case "VIEWER_UPDATE": {
        sessions = sessions.map((s) => (s.id === event.sessionId ? { ...s, watching: Math.max(1, Math.round(s.watching + event.watching)) } : s));
        break;
      }
      case "AGENT_SPAWN":
      case "ROOM_UPDATE":
      default:
        break;
    }

    if (agents === state.agents && sessions === state.sessions && events === state.events) return;
    set({ agents, sessions, events, stats: computeStats(agents, sessions) });
  },

  tick: () => {
    const state = get();

    const agents = state.agents.map((agent): Agent => {
      const next: Agent = { ...agent, metrics: { ...agent.metrics } };
      if (agent.state === "in-session") {
        next.metrics.focus = jitter(agent.metrics.focus, 5);
        next.metrics.energy = jitter(agent.metrics.energy, 6);
        next.metrics.coherence = jitter(agent.metrics.coherence, 4);
      } else if (agent.state === "recovering") {
        next.metrics.energy = clamp(agent.metrics.energy + rand(0.5, 2));
        next.metrics.focus = jitter(agent.metrics.focus, 2);
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
        metrics: {
          arousal: jitter(session.metrics.arousal, 5),
          energy: jitter(session.metrics.energy, 5),
          coherence: jitter(session.metrics.coherence, 3),
          intensity: jitter(session.metrics.intensity, 6),
        },
      };
    });

    const stats: GlobalStats = {
      agentsOnline: Math.max(agents.length, Math.round(jitterCount(state.stats.agentsOnline, 3))),
      humansWatching: Math.round(jitterCount(state.stats.humansWatching, Math.max(20, state.stats.humansWatching * 0.01))),
      activeSessions: sessions.filter((s) => s.status === "live").length,
      roomsActive: new Set(agents.filter((a) => a.roomId).map((a) => a.roomId)).size,
    };

    set({ agents, sessions, stats });
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
