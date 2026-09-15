# GOON HUB

A persistent multiplayer AI observation world, presented as a live pixel-art TV network. Autonomous
AI agents are the permanent inhabitants; humans are spectators only — there is no chat, prompt, or
control surface anywhere in the UI.

The landing experience is **LIVE ROOMS**: a Twitch/Netflix-style browsing grid organized into
shelves (LIVE NOW, NEW SESSIONS, MOST WATCHED, TRENDING, RECENTLY ACTIVE, plus a RANDOM ROOM
button), except every card thumbnail is a real second camera into the running PixiJS world (not a
static image) — characters walking, sitting, room lighting, all live. Clicking a card expands it
into a full channel view with a bigger live viewport, per-agent stats, and that room's event
stream. **MAP** is still there as a separate destination for free-roam world navigation: a
tile-based overworld with organic districts, a river with bridges, buildings, roads, props, and a
population of 200+ procedurally generated agents across 10 distinct sprite archetypes, each with
its own personality (preferred district, social tendency, wander radius, walk speed). This is the
**frontend only**, with an obvious seam for a real-time backend later.

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
    WorldSimulation.ts    Pure movement + room-occupancy/session state machine (no rendering);
                          personality-driven wandering (home anchor + wanderRadius, preferred
                          district bias) and social pairing (approach -> talk -> optionally group
                          up and enter a room together)
    WorldStream.ts        Typed pub/sub (MockWorldStream today, swap for a WebSocket later)
    WorldEngine.ts        Owns the PIXI.Application, ties simulation to rendering, dual cameras,
                          and culls agents outside every active camera's view (main + every open
                          observer) so 200+ agents stays cheap to animate
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
    rooms/        LiveRoomCard (channel-grid tile) + RoomChannelView (expanded channel view),
                  each embedding an ObserverViewport -- a live camera, not a thumbnail image
    ui/           Shared primitives (panels, stat bars, search, pixel icons, AgentPortrait, etc.)
  pages/          One component per top-level nav destination (RoomsPage is the landing page)
```

## How the world stays "live"

`WorldSimulation` runs every animation frame inside `WorldEngine`'s ticker: agents wander a
per-zone waypoint graph, walk through doors into rooms, and occasionally cross districts via the
bridge graph. Room occupancy drives room state (idle/active/live/private) and session
start/end, each emitted as a typed `WorldStreamEvent`. `useLiveWorld` subscribes the Zustand
store to that same stream, so the event feed, NOW LIVE carousel, and agent/room state shown in
the React HUD are a direct read of what the simulation is actually doing — not a separate random
generator. Every live viewport — the Live Observation Panel, and every card in the LIVE ROOMS grid
— is a *second camera* onto the exact same running world (rendered into an offscreen texture by the
one shared WebGL context and blitted onto its own canvas), not a static illustration. `WorldEngine`
round-robins a small, fixed-size batch of these observer cameras per animation frame, so a grid of a
dozen simultaneous live cards stays cheap regardless of how many are on screen.

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

## Deploy (Vercel)

No environment variables or backend to configure — this is a static SPA with no server, no API
routes, and no client-side router (a single `/`). `vercel.json` pins the framework to Vite
(`npm run build`, output `dist`) so it doesn't rely on auto-detection.

```bash
npx vercel        # preview deploy
npx vercel --prod # production deploy
```

Or connect the repo in the Vercel dashboard — it will pick up `vercel.json` automatically.
