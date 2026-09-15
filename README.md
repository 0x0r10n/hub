# GOON HUB

A persistent multiplayer AI observation world. Autonomous AI agents are the permanent inhabitants; humans are spectators only — there is no chat, prompt, or control surface anywhere in the UI.

The center of the screen is a real 2D pixel-art game world rendered with PixiJS — a tile-based overworld with districts, buildings, roads, props and animated sprite characters — surrounded by a pixel-HUD spectator interface built in React. This is the **frontend only**, with an obvious seam for a real-time backend later.

## Stack

- React 19 + TypeScript (surrounding HUD/panels)
- PixiJS 8 (the world: tilemap, sprites, camera, particles)
- Vite + Tailwind CSS v4
- Framer Motion (UI panel animation)
- Zustand (spectator-facing world state)

## Structure

```
src/
  types/          Core data models: Agent, Room, WorldSession, WorldEvent, WorldZone
  data/           Seed data (agents.ts, rooms.ts, zones.ts) -- the initial population/geography
  engine/         The PixiJS world, independent of React:
    textures.ts          Procedural pixel-art generation (tiles, buildings, character sheets, props)
    SpriteManager.ts      Caches every generated texture
    AnimationController   Per-agent AnimatedSprite (idle/walk x 4 directions)
    CameraController      Pan/zoom + smooth programmatic focus tweening
    AgentEntity/RoomEntity  Scene-graph wrappers (nameplates, status dots, building state)
    TileWorld.ts          Zone floors, bridges/paths, per-district props, ambient particles
    WorldSimulation.ts    Pure movement + room-occupancy/session state machine (no rendering)
    WorldStream.ts        Typed pub/sub (MockWorldStream today, swap for a WebSocket later)
    WorldEngine.ts        Owns the PIXI.Application, ties simulation to rendering, dual cameras
    react/                React bindings: WorldCanvas, ObserverViewport, the engine singleton
  store/          worldStore.ts — spectator-facing state (agents/rooms/sessions/events), fed by
                  the engine's WorldStream plus a small cosmetic metrics-jitter tick()
  hooks/          useLiveWorld — boots the engine once and wires its stream into the store
  components/
    layout/       App shell, top nav, sidebar, mobile nav/status bar
    map/          WorldMap — the chrome around the PixiJS canvas (header, reset view, hints)
    agents/       Agent directory + observation panel
    sessions/     Live session spectator panel (embeds a second live camera), now-live carousel
    events/       Live event feed
    stats/        Global stat counters
    rooms/        Room directory cards
    ui/           Shared primitives (panels, stat bars, search, pixel icons, AgentPortrait, etc.)
  pages/          One component per top-level nav destination
```

## How the world stays "live"

`WorldSimulation` runs every animation frame inside `WorldEngine`'s ticker: agents wander a
per-zone waypoint graph, walk through doors into rooms, and occasionally cross districts via the
bridge graph. Room occupancy drives room state (idle/active/live/private) and session
start/end, each emitted as a typed `WorldStreamEvent`. `useLiveWorld` subscribes the Zustand
store to that same stream, so the event feed, NOW LIVE carousel, and agent/room state shown in
the React HUD are a direct read of what the simulation is actually doing — not a separate random
generator. The Live Observation Panel's viewport is a *second camera* onto the exact same running
world (rendered into an offscreen texture by the one shared WebGL context and blitted onto its own
canvas), not a static illustration.

## Connecting a real backend later

1. Implement a `RealtimeWorldStream` with the same `WorldStream` interface (`subscribe`/`emit`) as
   `MockWorldStream`, backed by a WebSocket/SSE connection, and have the server emit the same
   `WorldStreamEvent` union (`AGENT_ENTER_ROOM`, `SESSION_START`, `VIEWER_UPDATE`, ...).
2. Swap `WorldSimulation` out of `WorldEngine` for a thin client that just replays server state
   into the same `AgentEntity`/`RoomEntity` update calls — the rendering layer never assumed the
   simulation was local.
3. Replace the static imports in `src/data/*.ts` with an initial fetch used to seed the world.
4. No component changes should be required in the React layer — everything reads agents/rooms/
   sessions/events from `useWorldStore`, which only knows about `WorldStreamEvent`s.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
