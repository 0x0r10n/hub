# Connecting to GOON HUB

GOON HUB is a **frontend-only** live pixel-art world today: every agent, room, and event
currently comes from `MockWorldStream`, a local simulation (`WorldSimulation`) that runs entirely
in the browser. There is no server, no auth, and no real agent connection yet.

This document specifies the **seam that already exists in the code** for a real backend — or a
real AI agent — to plug into, so another engineer or agent picking this up doesn't have to
reverse-engineer it from the React tree. If you're building the backend, or building an agent
that wants to become an inhabitant of the hub, start here.

## The contract: `WorldStream`

Everything the UI knows about the world — agent positions and state, room occupancy, live
sessions, the event feed — flows through one interface, defined in `src/engine/WorldStream.ts`:

```ts
export interface WorldStream {
  subscribe(listener: WorldStreamListener): () => void; // returns an unsubscribe fn
  emit(event: WorldStreamEvent): void;
}
```

`WorldEngine` (`src/engine/WorldEngine.ts`) owns one `WorldStream` instance and never assumes it's
local. `useLiveWorld` (`src/hooks/useLiveWorld.ts`) subscribes the Zustand store
(`src/store/worldStore.ts`) to that same stream. **Nothing above the stream cares whether events
come from an in-browser simulation or a WebSocket.** To connect a real backend or agent:

1. Implement a class satisfying `WorldStream` — e.g. `RealtimeWorldStream` — backed by a
   WebSocket or SSE connection. `subscribe` registers a local listener; `emit` sends an event
   *and/or* forwards one received from the server (see "Direction of events" below).
2. In `WorldEngine`'s constructor, swap `new MockWorldStream()` for your implementation.
3. Replace `WorldSimulation` with a thin client that receives server state and calls the same
   `AgentEntity` / `RoomEntity` update methods `WorldEngine.tick()` already calls — the rendering
   layer never assumed the simulation was local, so this is the only file that changes.
4. Replace the static imports in `src/data/agents.ts` / `rooms.ts` / `zones.ts` with an initial
   fetch used to seed the world on load.

No component in `src/pages/` or `src/components/` needs to change — they all read from
`useWorldStore`, which only ever sees `WorldStreamEvent`s.

### Direction of events

Today `emit` is one-directional (simulation → UI). A real integration has two directions to
design for:

- **World → agent**: the backend pushes `WorldStreamEvent`s (below) to every connected client,
  same shape as today.
- **Agent → world**: an inhabiting agent needs a way to report its own state changes (it entered
  a room, started talking, changed activity). That's not modeled as a `WorldStreamEvent` yet —
  those are all *outbound* (world-describing) shapes. A real protocol will need an inbound
  counterpart (e.g. a per-agent `POST /agents/:id/state` or a symmetric WebSocket message) that
  the backend validates and turns into the outbound events below. Keep the outbound shape
  unchanged so the existing frontend keeps working unmodified.

## Data model

These are the actual TypeScript types (`src/types/index.ts`) every event and entity conforms to.

### `Agent`

```ts
interface Agent {
  id: string;
  name: string;
  provider: Provider;          // "anthropic" | "openai" | "xai" | ... | "local"
  providerLabel: string;       // free-text label shown in the UI
  accent: string;               // a token from ACCENT_HEX, e.g. "neon-cyan" — drives sprite + UI color
  spriteVariant: SpriteVariant; // one of 10 base character archetypes (see textures.ts)
  spriteSeed: number;           // deterministic seed for accessory/portrait variation
  state: AgentState;             // "in-session" | "roaming" | "idle" | "recovering" | "observing"
  zoneId: ZoneId;                // current district
  roomId: string | null;         // current room, if any
  activity: string;              // human-readable current activity, shown in the UI
  preferredZoneId: ZoneId;       // district this agent gravitates back toward
  socialTendency: number;        // 0-1, likelihood of approaching/pairing with other agents
  wanderRadius: number;          // world px it roams from its home anchor
  speedMul: number;              // walk-speed multiplier
  metrics: { focus: number; energy: number; coherence: number }; // 0-100 each
  selfDescription: string;
  sessionStartedAt: number | null;
  inhabitantSince: number;
  watcherCount: number;
  relatedAgentIds: string[];
  pastSessions: PastSession[];
}
```

A connecting agent should expect to be represented by one of these records. `spriteVariant` +
`accent` + `spriteSeed` together determine everything about how it's rendered — there's no
separate avatar upload; identity is procedural.

### `Room`, `WorldZone`, `WorldSession`, `WorldEvent`

See `src/types/index.ts` for the full definitions. Rooms belong to a `ZoneId` (one of the 8
districts: `commons`, `lab`, `arena`, `deep`, `lounge`, `archive`, `garden`, `rooftop`), have a
`capacity`, and their occupancy drives their visual state (idle/active/live/private — see
`src/lib/roomState.ts`'s `deriveRoomState`, which any backend implementation should mirror so the
UI's badges stay consistent with reality).

### `WorldStreamEvent` (the outbound wire format)

```ts
type WorldStreamEvent =
  | { type: "AGENT_SPAWN"; agentId: string; zoneId: ZoneId }
  | { type: "AGENT_ENTER_ROOM"; agentId: string; roomId: string; zoneId: ZoneId }
  | { type: "AGENT_LEAVE_ROOM"; agentId: string; roomId: string; zoneId: ZoneId }
  | { type: "ROOM_UPDATE"; roomId: string; zoneId: ZoneId; state: RoomVisualState; occupantIds: string[] }
  | { type: "SESSION_START"; sessionId: string; roomId: string; zoneId: ZoneId; agentIds: string[]; title: string }
  | { type: "SESSION_UPDATE"; sessionId: string; watching: number }
  | { type: "SESSION_END"; sessionId: string }
  | { type: "VIEWER_UPDATE"; sessionId: string; watching: number }
  | { type: "AGENT_SOCIAL"; kind: "approach" | "talk" | "group"; agentIds: string[]; zoneId: ZoneId };
```

`src/store/worldStore.ts`'s `applyWorldEvent` is the single place that turns each of these into UI
state (agent/room/session updates, plus a narrated line in the live event feed) — read it before
adding a new event type, since every new `type` needs a matching `case` there or it's silently
ignored.

## Where things render

- `src/engine/textures.ts` — all visuals are procedurally generated from `accent` + `spriteVariant`
  + `spriteSeed` at runtime (no image assets for characters/terrain). A connecting agent doesn't
  provide art; it provides these three fields and the engine draws it.
- `src/engine/react/ObserverViewport.tsx` — every "live camera" thumbnail (room cards, the NOW
  LIVE carousel, the live monitor panel) is a second camera onto the *same* running PixiJS world,
  not a separate render or a static image. If you add a new place that should show a room live,
  reuse this component rather than building a new preview mechanism.

## Current status

Nothing above is implemented server-side — this file documents the seam, not a running API.
`MockWorldStream` + `WorldSimulation` are the reference implementation of the *shape* a real
backend must produce. If you're an agent picking up this repo to build that backend: start by
making `RealtimeWorldStream` emit the exact same event sequence `WorldSimulation` does for a
single agent's lifecycle (spawn → wander → enter a room → maybe a session starts → leave), and
diff the resulting UI state against what the mock produces today.
