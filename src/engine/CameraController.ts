import { Matrix, type Container } from "pixi.js";
import { clamp, lerp } from "./geometry";

export interface Viewport {
  width: number;
  height: number;
}

/** Pans/zooms a world container and supports smooth programmatic focus transitions. */
export class CameraController {
  x: number;
  y: number;
  zoom: number;
  minZoom = 0.4;
  maxZoom = 2.6;

  private targetX: number;
  private targetY: number;
  private targetZoom: number;
  private tweening = false;
  private world: Container;
  private getViewport: () => Viewport;

  constructor(world: Container, getViewport: () => Viewport, startX: number, startY: number, startZoom = 0.6) {
    this.world = world;
    this.getViewport = getViewport;
    this.x = this.targetX = startX;
    this.y = this.targetY = startY;
    this.zoom = this.targetZoom = startZoom;
    this.apply();
  }

  getMatrix(): Matrix {
    const { width, height } = this.getViewport();
    return new Matrix(this.zoom, 0, 0, this.zoom, width / 2 - this.x * this.zoom, height / 2 - this.y * this.zoom);
  }

  private apply() {
    const m = this.getMatrix();
    this.world.scale.set(m.a, m.d);
    this.world.position.set(m.tx, m.ty);
  }

  pan(dxScreen: number, dyScreen: number) {
    this.tweening = false;
    this.x -= dxScreen / this.zoom;
    this.y -= dyScreen / this.zoom;
    this.apply();
  }

  zoomAt(screenX: number, screenY: number, factor: number) {
    this.tweening = false;
    const { width, height } = this.getViewport();
    const worldXBefore = (screenX - width / 2) / this.zoom + this.x;
    const worldYBefore = (screenY - height / 2) / this.zoom + this.y;
    this.zoom = clamp(this.zoom * factor, this.minZoom, this.maxZoom);
    const worldXAfter = (screenX - width / 2) / this.zoom + this.x;
    const worldYAfter = (screenY - height / 2) / this.zoom + this.y;
    this.x += worldXBefore - worldXAfter;
    this.y += worldYBefore - worldYAfter;
    this.apply();
  }

  focusTo(x: number, y: number, zoom?: number) {
    this.targetX = x;
    this.targetY = y;
    this.targetZoom = zoom ?? this.zoom;
    this.tweening = true;
  }

  update(deltaMs: number) {
    if (!this.tweening) return;
    const t = clamp(deltaMs / 260, 0, 1);
    this.x = lerp(this.x, this.targetX, t);
    this.y = lerp(this.y, this.targetY, t);
    this.zoom = lerp(this.zoom, this.targetZoom, t);
    if (Math.abs(this.x - this.targetX) < 0.5 && Math.abs(this.y - this.targetY) < 0.5 && Math.abs(this.zoom - this.targetZoom) < 0.002) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.zoom = this.targetZoom;
      this.tweening = false;
    }
    this.apply();
  }

  resize() {
    this.apply();
  }
}
