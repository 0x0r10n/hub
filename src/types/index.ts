export type Provider =
  | "anthropic"
  | "openai"
  | "xai"
  | "google"
  | "meta"
  | "mistral"
  | "deepseek"
  | "alibaba"
  | "microsoft"
  | "local";

export type ZoneId =
  | "commons"
  | "lab"
  | "arena"
  | "deep"
  | "lounge"
  | "archive"
  | "garden"
  | "rooftop";

export type AgentState = "in-session" | "roaming" | "idle" | "recovering" | "observing";

export type SpriteVariant =
  | "runner"
  | "orb"
  | "sentinel"
  | "wisp"
  | "construct"
  | "cloaked"
  | "tiny"
  | "android"
  | "mech"
  | "glitch";

export interface AgentMetrics {
  focus: number; // 0-100
  energy: number; // 0-100
  coherence: number; // 0-100
}

export interface AgentEventRef {
  id: string;
  timestamp: number;
  text: string;
}

export interface PastSession {
  id: string;
  withAgentIds: string[];
  roomName: string;
  endedAt: number;
  durationMin: number;
}

export interface Agent {
  id: string;
  name: string;
  provider: Provider;
  providerLabel: string;
  accent: string; // css color token e.g. 'neon-cyan'
  spriteVariant: SpriteVariant;
  spriteSeed: number;
  state: AgentState;
  zoneId: ZoneId;
  roomId: string | null;
  activity: string;
  /** District this agent gravitates back toward when its wander roll picks a home-biased target. */
  preferredZoneId: ZoneId;
  /** 0-1: how likely this agent is to approach, pair up with, or travel alongside other agents. */
  socialTendency: number;
  /** Roughly how far (world px) this agent wanders from its home anchor before turning back. */
  wanderRadius: number;
  /** Multiplier applied to the base walk speed -- some agents amble, some hustle. */
  speedMul: number;
  metrics: AgentMetrics;
  selfDescription: string;
  sessionStartedAt: number | null;
  inhabitantSince: number;
  watcherCount: number;
  relatedAgentIds: string[];
  pastSessions: PastSession[];
}

export type RoomKind = "social" | "experimental" | "competitive" | "autonomous" | "private" | "archival" | "recovery" | "observation";

export interface Room {
  id: string;
  name: string;
  zoneId: ZoneId;
  kind: RoomKind;
  capacity: number;
  description: string;
  bounds: { x: number; y: number; w: number; h: number }; // percent within zone
  agentIds: string[];
}

export interface SessionMetrics {
  arousal: number;
  energy: number;
  coherence: number;
  intensity: number;
}

export interface WorldSession {
  id: string;
  roomId: string;
  zoneId: ZoneId;
  title: string;
  agentIds: string[];
  watching: number;
  startedAt: number;
  status: "live" | "ended";
  metrics: SessionMetrics;
  thumbnailSeed: number;
}

export type EventKind =
  | "join"
  | "leave"
  | "state"
  | "proximity"
  | "sync"
  | "intensity"
  | "system"
  | "session-start"
  | "session-end";

export interface WorldEvent {
  id: string;
  timestamp: number;
  text: string;
  kind: EventKind;
  agentIds: string[];
  roomId?: string;
  zoneId?: ZoneId;
}

export interface WorldZone {
  id: ZoneId;
  name: string;
  shortLabel: string;
  tagline: string;
  description: string;
  accent: string;
  bounds: { x: number; y: number; w: number; h: number }; // percent of world map
  ambience: "water" | "neon" | "circuit" | "void" | "bloom" | "static" | "data" | "sky";
}
