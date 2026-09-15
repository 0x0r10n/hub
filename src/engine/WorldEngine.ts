import { Application, Container, Graphics, RenderTexture } from "pixi.js";
import type { Agent, Room, WorldZone, ZoneId } from "@/types";
import { AgentEntity } from "./AgentEntity";
import { CameraController } from "./CameraController";
import { WORLD_HEIGHT, WORLD_WIDTH, roomBoundsPx, zoneCenterPx } from "./geometry";
import { RoomEntity } from "./RoomEntity";
import { SpriteManager } from "./SpriteManager";
import { TileWorld } from "./TileWorld";
import { resolveAccentHex } from "./textures";
import { WorldSimulation } from "./WorldSimulation";
import { MockWorldStream, type WorldStream, type WorldStreamListener } from "./WorldStream";

export interface WorldEngineCallbacks {
  onSelectAgent: (id: string) => void;
  onFocusRoom: (roomId: string) => void;
  onFocusZone: (zoneId: ZoneId) => void;
  onDeselect: () => void;
}

interface ObserverView {
  renderTexture: RenderTexture;
  camera: CameraController;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  resizeObserver: ResizeObserver;
}

/** Owns the single PIXI.Application, the simulation, and every visual entity. Rendering (this file
 * and its Entity/TileWorld/Camera helpers) never drives world logic directly -- it only reads the
 * latest state from WorldSimulation each frame and reflects it. */
export class WorldEngine {
  readonly app = new Application();
  readonly stream: WorldStream = new MockWorldStream();
  private ready: Promise<void>;
  private sprites = new SpriteManager();
  private simulation: WorldSimulation;
  private tileWorld!: TileWorld;
  private worldRoot = new Container();
  private cameraContainer = new Container();
  private roomLayer = new Container();
  private agentLayer = new Container({ isRenderGroup: true });
  private camera!: CameraController;
  private agentEntities = new Map<string, AgentEntity>();
  private roomEntities = new Map<string, RoomEntity>();
  private roomWatching = new Map<string, number>();
  private sessionRoom = new Map<string, string>();
  private zoneById: Map<ZoneId, WorldZone>;
  private mountEl: HTMLDivElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private observers = new Set<ObserverView>();
  private observerFrame = 0;
  private dragging = false;
  private lastPointer = { x: 0, y: 0 };
  private moved = 0;
  private callbacks: WorldEngineCallbacks;

  constructor(agents: Agent[], rooms: Room[], zones: WorldZone[], callbacks: WorldEngineCallbacks) {
    this.callbacks = callbacks;
    this.zoneById = new Map(zones.map((z) => [z.id, z]));
    this.simulation = new WorldSimulation(agents, rooms, zones, this.stream);
    this.ready = this.boot(agents, rooms, zones);
  }

  private async boot(agents: Agent[], rooms: Room[], zones: WorldZone[]) {
    await this.app.init({
      background: 0x050609,
      antialias: false,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });

    this.cameraContainer.addChild(this.worldRoot);
    this.app.stage.addChild(this.cameraContainer);

    const backgroundHit = new Graphics().rect(0, 0, WORLD_WIDTH, WORLD_HEIGHT).fill({ color: 0x000000, alpha: 0.001 });
    backgroundHit.eventMode = "static";
    backgroundHit.on("pointertap", () => this.callbacks.onDeselect());

    this.tileWorld = new TileWorld(zones, this.sprites, (zoneId) => this.callbacks.onFocusZone(zoneId));
    this.worldRoot.addChild(backgroundHit, this.tileWorld.view, this.roomLayer, this.agentLayer);

    for (const room of rooms) {
      const zone = this.zoneById.get(room.zoneId);
      if (!zone) continue;
      const bounds = roomBoundsPx(zone, room);
      const entity = new RoomEntity(room, bounds, resolveAccentHex(zone.accent), this.sprites, hashSeed(room.id), (roomId) => this.callbacks.onFocusRoom(roomId));
      this.roomLayer.addChild(entity.view);
      this.roomEntities.set(room.id, entity);
    }

    for (const agent of agents) {
      const zone = this.zoneById.get(agent.zoneId);
      if (!zone) continue;
      const accentHex = resolveAccentHex(agent.accent);
      const set = this.sprites.getCharacterSet(agent.spriteVariant, accentHex);
      const entity = new AgentEntity(agent, accentHex, set, (id) => this.callbacks.onSelectAgent(id));
      this.agentLayer.addChild(entity.view);
      this.agentEntities.set(agent.id, entity);
    }
    this.agentLayer.sortableChildren = true;

    const start = zoneCenterPx(zones.find((z) => z.id === "commons") ?? zones[0]);
    this.camera = new CameraController(this.cameraContainer, () => ({ width: this.app.screen.width || 1, height: this.app.screen.height || 1 }), start.x, start.y, 0.55);

    this.app.canvas.style.touchAction = "none";
    this.app.canvas.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
    this.app.canvas.addEventListener("wheel", this.onWheel, { passive: false });

    this.stream.subscribe(this.handleStreamEvent);
    this.app.ticker.add(this.tick);

    if (this.mountEl) this.attach(this.mountEl);
  }

  private handleStreamEvent: WorldStreamListener = (event) => {
    switch (event.type) {
      case "AGENT_ENTER_ROOM":
        this.agentEntities.get(event.agentId)?.setState("in-session");
        break;
      case "AGENT_LEAVE_ROOM":
        this.agentEntities.get(event.agentId)?.setState("roaming");
        break;
      case "ROOM_UPDATE":
        this.roomEntities.get(event.roomId)?.setState(event.state, this.roomWatching.get(event.roomId));
        break;
      case "SESSION_START": {
        const watching = 180 + Math.floor(Math.random() * 2600);
        this.sessionRoom.set(event.sessionId, event.roomId);
        this.roomWatching.set(event.roomId, watching);
        this.roomEntities.get(event.roomId)?.setState("live", watching);
        break;
      }
      case "SESSION_END": {
        const roomId = this.sessionRoom.get(event.sessionId);
        this.sessionRoom.delete(event.sessionId);
        if (roomId) this.roomWatching.delete(roomId);
        break;
      }
      case "VIEWER_UPDATE": {
        const roomId = this.sessionRoom.get(event.sessionId);
        if (!roomId) break;
        const next = Math.max(20, (this.roomWatching.get(roomId) ?? 200) + event.watching);
        this.roomWatching.set(roomId, next);
        this.roomEntities.get(roomId)?.setState("live", next);
        break;
      }
      default:
        break;
    }
  };

  private onPointerDown = (e: PointerEvent) => {
    this.dragging = true;
    this.moved = 0;
    this.lastPointer = { x: e.clientX, y: e.clientY };
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.dragging) return;
    const dx = e.clientX - this.lastPointer.x;
    const dy = e.clientY - this.lastPointer.y;
    this.lastPointer = { x: e.clientX, y: e.clientY };
    this.moved += Math.abs(dx) + Math.abs(dy);
    if (this.moved > 3) this.camera?.pan(dx, dy);
  };

  private onPointerUp = () => {
    this.dragging = false;
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (!this.camera) return;
    const rect = this.app.canvas.getBoundingClientRect();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    this.camera.zoomAt(e.clientX - rect.left, e.clientY - rect.top, factor);
  };

  private tick = () => {
    const deltaMs = this.app.ticker.deltaMS;
    this.simulation.step(deltaMs);

    for (const [id, entity] of this.agentEntities) {
      const view = this.simulation.getAgentView(id);
      if (!view) continue;
      entity.setPosition(view.x, view.y);
      entity.setAnimation(view.facing, view.animName);
      entity.view.zIndex = view.y;
    }
    this.agentLayer.sortChildren();

    for (const entity of this.roomEntities.values()) entity.update(deltaMs);
    this.tileWorld.update(deltaMs);
    this.camera?.update(deltaMs);

    this.observerFrame = (this.observerFrame + 1) % 2;
    if (this.observerFrame === 0) {
      for (const ov of this.observers) {
        ov.camera.update(deltaMs * 2);
        this.app.renderer.render({ container: this.worldRoot, transform: ov.camera.getMatrix(), target: ov.renderTexture, clearColor: 0x050609 });
        const src = this.app.renderer.extract.canvas(ov.renderTexture) as unknown as CanvasImageSource;
        ov.ctx.clearRect(0, 0, ov.canvas.width, ov.canvas.height);
        ov.ctx.drawImage(src, 0, 0, ov.canvas.width, ov.canvas.height);
      }
    }
  };

  setCallbacks(callbacks: WorldEngineCallbacks) {
    this.callbacks = callbacks;
  }

  setSelectedAgent(id: string | null) {
    for (const [agentId, entity] of this.agentEntities) entity.setSelected(agentId === id);
  }

  focusAgent(id: string) {
    const view = this.simulation.getAgentView(id);
    if (view) this.camera?.focusTo(view.x, view.y, 1.5);
  }

  focusZone(zoneId: ZoneId) {
    const zone = this.zoneById.get(zoneId);
    if (zone) this.camera?.focusTo(zoneCenterPx(zone).x, zoneCenterPx(zone).y, 0.85);
  }

  focusRoom(roomId: string) {
    const entity = this.roomEntities.get(roomId);
    if (!entity) return;
    const b = entity.worldBounds;
    this.camera?.focusTo(b.x + b.w / 2, b.y + b.h / 2, 1.7);
  }

  resetView() {
    const commons = this.zoneById.get("commons") ?? Array.from(this.zoneById.values())[0];
    if (commons) this.camera?.focusTo(zoneCenterPx(commons).x, zoneCenterPx(commons).y, 0.55);
  }

  attach(container: HTMLDivElement) {
    this.mountEl = container;
    if (!this.app.renderer) return;
    container.appendChild(this.app.canvas);
    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => {
      const { clientWidth, clientHeight } = container;
      if (clientWidth > 0 && clientHeight > 0) {
        this.app.renderer.resize(clientWidth, clientHeight);
        this.camera?.resize();
      }
    });
    this.resizeObserver.observe(container);
    const { clientWidth, clientHeight } = container;
    if (clientWidth > 0 && clientHeight > 0) this.app.renderer.resize(clientWidth, clientHeight);
    this.camera?.resize();
  }

  detach() {
    this.mountEl = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (!this.app.renderer) return;
    if (this.app.canvas.parentElement) this.app.canvas.parentElement.removeChild(this.app.canvas);
  }

  /** A second camera onto the exact same live world, rendered into an offscreen RenderTexture by
   * the ONE shared WebGL context (a second `Application`/context can't safely redraw the same
   * GPU-resident display objects), then blitted onto a plain 2D canvas the caller can mount. */
  async createObserverView(container: HTMLDivElement): Promise<{ focus: (x: number, y: number, zoom: number) => void; destroy: () => void }> {
    await this.ready;

    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    canvas.style.imageRendering = "pixelated";
    const ctx = canvas.getContext("2d")!;
    container.appendChild(canvas);

    const initialW = Math.max(1, container.clientWidth || 320);
    const initialH = Math.max(1, container.clientHeight || 160);
    canvas.width = initialW;
    canvas.height = initialH;
    const renderTexture = RenderTexture.create({ width: initialW, height: initialH });

    const camera = new CameraController(new Container(), () => ({ width: renderTexture.width || 1, height: renderTexture.height || 1 }), WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 1);

    const resizeObserver = new ResizeObserver(() => {
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      canvas.width = w;
      canvas.height = h;
      renderTexture.resize(w, h);
      camera.resize();
    });
    resizeObserver.observe(container);

    const ov: ObserverView = { renderTexture, camera, canvas, ctx, resizeObserver };
    this.observers.add(ov);

    return {
      focus: (x, y, zoom) => camera.focusTo(x, y, zoom),
      destroy: () => {
        this.observers.delete(ov);
        resizeObserver.disconnect();
        renderTexture.destroy(true);
        if (canvas.parentElement) canvas.parentElement.removeChild(canvas);
      },
    };
  }

  roomWorldCenter(roomId: string): { x: number; y: number } | null {
    const entity = this.roomEntities.get(roomId);
    if (!entity) return null;
    const b = entity.worldBounds;
    return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
  }

  destroy() {
    if (this.app.renderer) {
      this.app.canvas.removeEventListener("pointerdown", this.onPointerDown);
      this.app.canvas.removeEventListener("wheel", this.onWheel);
    }
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
    for (const ov of this.observers) {
      ov.resizeObserver.disconnect();
      ov.renderTexture.destroy(true);
      if (ov.canvas.parentElement) ov.canvas.parentElement.removeChild(ov.canvas);
    }
    this.detach();
    this.app.destroy(true, { children: true });
  }
}

function hashSeed(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}
