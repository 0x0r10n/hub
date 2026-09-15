import { Container, Graphics, Sprite, Text } from "pixi.js";
import type { Room } from "@/types";
import type { PixelBounds } from "./geometry";
import type { SpriteManager } from "./SpriteManager";
import { hexToNum, type RoomVisualState } from "./textures";

export class RoomEntity {
  readonly view = new Container();
  readonly room: Room;
  private bounds: PixelBounds;
  private accentHex: string;
  private sprites: SpriteManager;
  private seed: number;
  private sprite: Sprite;
  private label: Text;
  private viewerLabel: Text;
  private beacon: Graphics;
  private state: RoomVisualState = "idle";
  private beaconPhase = Math.random() * Math.PI * 2;

  constructor(room: Room, bounds: PixelBounds, accentHex: string, sprites: SpriteManager, seed: number, onFocus: (roomId: string) => void) {
    this.room = room;
    this.bounds = bounds;
    this.accentHex = accentHex;
    this.sprites = sprites;
    this.seed = seed;
    this.sprite = new Sprite(this.sprites.getBuildingTexture(room.id, bounds.w, bounds.h, accentHex, this.state, seed, room.zoneId));
    this.sprite.width = bounds.w;
    this.sprite.height = bounds.h;

    this.label = new Text({
      text: room.name.toUpperCase(),
      style: { fontFamily: "monospace", fontSize: 10, fill: hexToNum(accentHex), stroke: { color: 0x050609, width: 3 } },
    });
    this.label.anchor.set(0.5, 1);
    this.label.position.set(bounds.w / 2, -4);

    this.viewerLabel = new Text({
      text: "",
      style: { fontFamily: "monospace", fontSize: 9, fill: 0xff4d6d, stroke: { color: 0x050609, width: 3 } },
    });
    this.viewerLabel.anchor.set(0.5, 0);
    this.viewerLabel.position.set(bounds.w / 2, bounds.h + 4);
    this.viewerLabel.visible = false;

    this.beacon = new Graphics();

    this.view.position.set(bounds.x, bounds.y);
    this.view.addChild(this.sprite, this.label, this.viewerLabel, this.beacon);
    this.view.eventMode = "static";
    this.view.cursor = "pointer";
    this.view.on("pointertap", (e) => {
      e.stopPropagation();
      onFocus(room.id);
    });
  }

  get worldBounds() {
    return this.bounds;
  }

  setState(state: RoomVisualState, viewerCount?: number) {
    if (state !== this.state) {
      this.state = state;
      this.sprite.texture = this.sprites.getBuildingTexture(this.room.id, this.bounds.w, this.bounds.h, this.accentHex, state, this.seed, this.room.zoneId);
    }
    if (state === "live" && viewerCount) {
      this.viewerLabel.text = `● ${viewerCount.toLocaleString()}`;
      this.viewerLabel.visible = true;
    } else {
      this.viewerLabel.visible = false;
    }
  }

  update(deltaMs: number) {
    if (this.state !== "live") {
      this.beacon.clear();
      return;
    }
    this.beaconPhase += deltaMs * 0.004;
    const a = 0.5 + Math.sin(this.beaconPhase) * 0.5;
    this.beacon.clear();
    this.beacon.circle(this.bounds.w / 2, this.bounds.h * 0.08, 3).fill({ color: 0xff4d6d, alpha: a });
  }

  destroy() {
    this.view.destroy({ children: true });
  }
}
