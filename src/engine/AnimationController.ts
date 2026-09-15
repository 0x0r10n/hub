import { AnimatedSprite } from "pixi.js";
import type { CharTextureSet } from "./SpriteManager";
import type { Direction } from "./textures";

export type FacingDir = "down" | "up" | "left" | "right";
export type AnimName = "idle" | "walk";

/** Characters render a bit larger than their native texture so they read clearly as game sprites. */
export const CHAR_BASE_SCALE = 1.4;

function toSheetDirection(facing: FacingDir): Direction {
  if (facing === "down") return "down";
  if (facing === "up") return "up";
  return "side";
}

/** Owns one AnimatedSprite for an agent and switches its frame set as facing/animation change. */
export class AnimationController {
  readonly sprite: AnimatedSprite;
  private set: CharTextureSet;
  private currentKey = "";

  constructor(set: CharTextureSet) {
    this.set = set;
    this.sprite = new AnimatedSprite(set.down.idle);
    this.sprite.animationSpeed = 0.14;
    this.sprite.anchor.set(0.5, 1);
    this.sprite.scale.set(CHAR_BASE_SCALE);
    this.sprite.play();
  }

  setTextureSet(set: CharTextureSet) {
    this.set = set;
    this.currentKey = "";
  }

  update(facing: FacingDir, anim: AnimName) {
    const dir = toSheetDirection(facing);
    const key = `${dir}:${anim}`;
    const magnitude = Math.abs(this.sprite.scale.x) || CHAR_BASE_SCALE;
    this.sprite.scale.x = facing === "left" ? -magnitude : magnitude;
    if (key === this.currentKey) return;
    this.currentKey = key;
    const frames = anim === "walk" ? this.set[dir].walk : this.set[dir].idle;
    this.sprite.textures = frames;
    this.sprite.animationSpeed = anim === "walk" ? 0.22 : 0.06;
    this.sprite.gotoAndPlay(0);
  }
}
