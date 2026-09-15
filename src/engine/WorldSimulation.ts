import type { Agent, Room, WorldZone, ZoneId } from "@/types";
import { BRIDGES, dist, randomZonePoint, roomDoorPx, roomSlotPx, zoneCenterPx } from "./geometry";
import type { RoomVisualState } from "./textures";
import type { WorldStream } from "./WorldStream";
import type { FacingDir, AnimName } from "./AnimationController";

interface Waypoint {
  x: number;
  y: number;
  kind: "wander" | "door" | "bridge" | "zoneCenter";
}

type Behavior = "wander" | "in-room";

interface SimAgent {
  id: string;
  x: number;
  y: number;
  zoneId: ZoneId;
  roomId: string | null;
  speed: number;
  facing: FacingDir;
  animName: AnimName;
  behavior: Behavior;
  path: Waypoint[];
  dwellUntil: number;
  thinkAt: number;
  slotIndex: number;
  pendingRoomId: string | null;
}

interface RoomRuntime {
  room: Room;
  zoneId: ZoneId;
  occupantIds: Set<string>;
  state: RoomVisualState;
  sessionId: string | null;
}

export interface AgentView {
  x: number;
  y: number;
  facing: FacingDir;
  animName: AnimName;
  zoneId: ZoneId;
  roomId: string | null;
  visible: boolean;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const LOOK_DIRECTIONS: FacingDir[] = ["down", "up", "left", "right"];

/** Pure movement + occupancy simulation, decoupled from rendering. Steps every animation frame,
 * emits coarse WorldStreamEvents only when something meaningful changes (entering a room, a
 * session starting, etc.) rather than on every position update. */
export class WorldSimulation {
  private agents = new Map<string, SimAgent>();
  private rooms = new Map<string, RoomRuntime>();
  private zoneById: Map<ZoneId, WorldZone>;
  private roomsByZone = new Map<ZoneId, Room[]>();
  private adjacency = new Map<ZoneId, ZoneId[]>();
  private clock = 0;
  private stream: WorldStream;

  constructor(agentSeeds: Agent[], rooms: Room[], zones: WorldZone[], stream: WorldStream) {
    this.stream = stream;
    this.zoneById = new Map(zones.map((z) => [z.id, z]));
    for (const zone of zones) this.roomsByZone.set(zone.id, []);
    for (const room of rooms) {
      this.roomsByZone.get(room.zoneId)?.push(room);
      this.rooms.set(room.id, { room, zoneId: room.zoneId, occupantIds: new Set(), state: "idle", sessionId: null });
    }
    for (const [a, b] of BRIDGES) {
      this.pushAdjacency(a, b);
      this.pushAdjacency(b, a);
    }

    for (const agent of agentSeeds) {
      const zone = this.zoneById.get(agent.zoneId);
      if (!zone) continue;
      const start = agent.roomId ? roomDoorPx(zone, this.rooms.get(agent.roomId)!.room) : zoneCenterPx(zone);
      const sim: SimAgent = {
        id: agent.id,
        x: start.x,
        y: start.y,
        zoneId: agent.zoneId,
        roomId: null,
        speed: 42 + (agent.spriteSeed % 5) * 6,
        facing: "down",
        animName: "idle",
        behavior: "wander",
        path: [],
        dwellUntil: 0,
        thinkAt: this.clock + Math.random() * 4000,
        slotIndex: 0,
        pendingRoomId: null,
      };
      this.agents.set(agent.id, sim);
      if (agent.roomId && this.rooms.has(agent.roomId)) {
        this.enterRoom(sim, agent.roomId, true);
      }
      this.stream.emit({ type: "AGENT_SPAWN", agentId: agent.id, zoneId: agent.zoneId });
    }
  }

  private pushAdjacency(a: ZoneId, b: ZoneId) {
    const list = this.adjacency.get(a) ?? [];
    list.push(b);
    this.adjacency.set(a, list);
  }

  getAgentView(id: string): AgentView | null {
    const a = this.agents.get(id);
    if (!a) return null;
    return { x: a.x, y: a.y, facing: a.facing, animName: a.animName, zoneId: a.zoneId, roomId: a.roomId, visible: true };
  }

  getRoomState(roomId: string): { state: RoomVisualState; occupantIds: string[] } | null {
    const r = this.rooms.get(roomId);
    if (!r) return null;
    return { state: r.state, occupantIds: Array.from(r.occupantIds) };
  }

  step(deltaMs: number) {
    this.clock += deltaMs;
    for (const agent of this.agents.values()) {
      this.stepAgent(agent, deltaMs);
    }
    if (Math.random() < deltaMs / 6000) this.jitterViewers();
  }

  private jitterViewers() {
    for (const room of this.rooms.values()) {
      if (room.state !== "live" || !room.sessionId) continue;
      const delta = Math.round((Math.random() - 0.45) * 40);
      this.stream.emit({ type: "VIEWER_UPDATE", sessionId: room.sessionId, watching: delta });
    }
  }

  private stepAgent(agent: SimAgent, deltaMs: number) {
    if (agent.behavior === "in-room") {
      if (this.clock >= agent.dwellUntil) this.leaveRoom(agent);
      else {
        agent.animName = "idle";
        return;
      }
    }

    if (agent.path.length === 0) {
      if (this.clock < agent.thinkAt) {
        agent.animName = "idle";
        if (Math.random() < deltaMs * 0.0006) agent.facing = pick(LOOK_DIRECTIONS);
        return;
      }
      this.chooseNextPath(agent);
      if (agent.path.length === 0) {
        agent.thinkAt = this.clock + 1500 + Math.random() * 2500;
        return;
      }
    }

    const target = agent.path[0];
    const d = dist(agent.x, agent.y, target.x, target.y);
    const step = (agent.speed * deltaMs) / 1000;

    if (d <= step) {
      agent.x = target.x;
      agent.y = target.y;
      agent.path.shift();
      if (target.kind === "door" && agent.path.length === 0) {
        this.tryEnterRoomNear(agent);
      }
      if (agent.path.length === 0) {
        agent.animName = "idle";
        agent.thinkAt = this.clock + 1200 + Math.random() * 2800;
      }
      return;
    }

    const dx = target.x - agent.x;
    const dy = target.y - agent.y;
    agent.x += (dx / d) * step;
    agent.y += (dy / d) * step;
    agent.animName = "walk";
    agent.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
  }

  private chooseNextPath(agent: SimAgent) {
    const zone = this.zoneById.get(agent.zoneId);
    if (!zone) return;
    const roll = Math.random();
    const roomsHere = this.roomsByZone.get(agent.zoneId) ?? [];

    if (roll < 0.5) {
      agent.path = [{ ...randomZonePoint(zone, Math.random), kind: "wander" }];
    } else if (roll < 0.75 && roomsHere.length > 0) {
      const room = pick(roomsHere);
      if (room.capacity === 0 || (this.rooms.get(room.id)?.occupantIds.size ?? 0) < room.capacity) {
        agent.path = [{ ...roomDoorPx(zone, room), kind: "door" }];
        agent.pendingRoomId = room.id;
      } else {
        agent.path = [{ ...randomZonePoint(zone, Math.random), kind: "wander" }];
      }
    } else {
      const neighbors = this.adjacency.get(agent.zoneId) ?? [];
      if (neighbors.length === 0) {
        agent.path = [{ ...randomZonePoint(zone, Math.random), kind: "wander" }];
        return;
      }
      const nextZoneId = pick(neighbors);
      const nextZone = this.zoneById.get(nextZoneId);
      if (!nextZone) return;
      const here = zoneCenterPx(zone);
      const there = zoneCenterPx(nextZone);
      const mid = { x: (here.x + there.x) / 2, y: (here.y + there.y) / 2 };
      agent.path = [
        { ...mid, kind: "bridge" },
        { ...there, kind: "zoneCenter" },
      ];
      agent.zoneId = nextZoneId;
    }
  }

  private tryEnterRoomNear(agent: SimAgent) {
    const pendingRoomId = agent.pendingRoomId;
    agent.pendingRoomId = null;
    if (!pendingRoomId) return;
    const runtime = this.rooms.get(pendingRoomId);
    if (!runtime || runtime.occupantIds.size >= (runtime.room.capacity || Infinity)) return;
    if (Math.random() < 0.65) this.enterRoom(agent, pendingRoomId, false);
  }

  private enterRoom(agent: SimAgent, roomId: string, silent: boolean) {
    const runtime = this.rooms.get(roomId);
    if (!runtime) return;
    agent.behavior = "in-room";
    agent.roomId = roomId;
    agent.animName = "idle";
    agent.facing = "down";
    agent.slotIndex = runtime.occupantIds.size;
    const zone = this.zoneById.get(runtime.zoneId)!;
    const slot = roomSlotPx(zone, runtime.room, agent.slotIndex);
    agent.x = slot.x;
    agent.y = slot.y;
    agent.dwellUntil = this.clock + 12000 + Math.random() * 22000;
    runtime.occupantIds.add(agent.id);

    if (!silent) this.stream.emit({ type: "AGENT_ENTER_ROOM", agentId: agent.id, roomId, zoneId: runtime.zoneId });
    this.recomputeRoomState(runtime);
  }

  private leaveRoom(agent: SimAgent) {
    const roomId = agent.roomId;
    if (!roomId) return;
    const runtime = this.rooms.get(roomId);
    agent.behavior = "wander";
    agent.roomId = null;
    if (runtime) {
      runtime.occupantIds.delete(agent.id);
      this.stream.emit({ type: "AGENT_LEAVE_ROOM", agentId: agent.id, roomId, zoneId: runtime.zoneId });
      this.recomputeRoomState(runtime);
    }
    agent.thinkAt = this.clock + 400;
  }

  private recomputeRoomState(runtime: RoomRuntime) {
    const n = runtime.occupantIds.size;
    let nextState: RoomVisualState;
    if (n === 0) nextState = "idle";
    else if (runtime.room.kind === "private") nextState = "private";
    else if (n >= 2) nextState = "live";
    else nextState = "active";

    if (nextState !== "live" && runtime.sessionId) {
      this.stream.emit({ type: "SESSION_END", sessionId: runtime.sessionId });
      runtime.sessionId = null;
    } else if (nextState === "live" && !runtime.sessionId) {
      runtime.sessionId = `sess-${runtime.room.id}`;
      this.stream.emit({
        type: "SESSION_START",
        sessionId: runtime.sessionId,
        roomId: runtime.room.id,
        zoneId: runtime.zoneId,
        agentIds: Array.from(runtime.occupantIds),
        title: `Session in ${runtime.room.name}`,
      });
    }

    if (nextState !== runtime.state) {
      runtime.state = nextState;
      this.stream.emit({ type: "ROOM_UPDATE", roomId: runtime.room.id, zoneId: runtime.zoneId, state: nextState, occupantIds: Array.from(runtime.occupantIds) });
    }
  }
}
