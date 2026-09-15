import { Container, Graphics, Sprite, Text, TilingSprite, type Texture } from "pixi.js";
import type { WorldZone, ZoneId } from "@/types";
import { BRIDGES, zoneBoundsPx, zoneCenterPx } from "./geometry";
import type { SpriteManager } from "./SpriteManager";
import { accentToNumber, resolveAccentHex } from "./textures";

interface ZoneParticle {
  g: Graphics;
  vx: number;
  vy: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

const NEON_SIGN: Partial<Record<string, string>> = {
  commons: "24/7",
  lounge: "VACANCY",
  garden: "BLOOM",
};

/** Builds the static (but ambiently animated) ground layer: zone floors, connecting paths, signage and particles. */
export class TileWorld {
  readonly view = new Container();
  readonly groundLayer = new Container();
  readonly pathLayer = new Container();
  readonly decorLayer = new Container();
  readonly objectLayer = new Container();
  readonly particleLayer = new Container();
  private particles: ZoneParticle[] = [];
  private signs: { text: Text; phase: number }[] = [];
  private onZoneClick: (zoneId: ZoneId) => void;

  constructor(zones: WorldZone[], sprites: SpriteManager, onZoneClick: (zoneId: ZoneId) => void) {
    this.onZoneClick = onZoneClick;
    this.view.addChild(this.groundLayer, this.pathLayer, this.decorLayer, this.objectLayer, this.particleLayer);
    this.buildPaths(zones);
    zones.forEach((zone) => this.buildZone(zone, sprites));
  }

  private buildPaths(zones: WorldZone[]) {
    const byId = new Map(zones.map((z) => [z.id, z]));
    const g = new Graphics();
    for (const [a, b] of BRIDGES) {
      const za = byId.get(a);
      const zb = byId.get(b);
      if (!za || !zb) continue;
      const ca = zoneCenterPx(za);
      const cb = zoneCenterPx(zb);
      g.moveTo(ca.x, ca.y).lineTo(cb.x, cb.y).stroke({ color: 0x191f30, width: 22, cap: "round" });
    }
    for (const [a, b] of BRIDGES) {
      const za = byId.get(a);
      const zb = byId.get(b);
      if (!za || !zb) continue;
      const ca = zoneCenterPx(za);
      const cb = zoneCenterPx(zb);
      g.moveTo(ca.x, ca.y).lineTo(cb.x, cb.y).stroke({ color: 0x333c56, width: 3, alpha: 0.8 });

      const steps = Math.max(2, Math.floor(Math.hypot(cb.x - ca.x, cb.y - ca.y) / 140));
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const x = ca.x + (cb.x - ca.x) * t;
        const y = ca.y + (cb.y - ca.y) * t;
        g.circle(x, y, 3).fill({ color: 0xffc857, alpha: 0.85 });
        g.circle(x, y, 7).fill({ color: 0xffc857, alpha: 0.12 });
      }
    }
    this.pathLayer.addChild(g);
  }

  private buildZone(zone: WorldZone, sprites: SpriteManager) {
    const b = zoneBoundsPx(zone);
    const floor = sprites.getMetaFloorTile(zone.ambience, resolveAccentHex(zone.accent));
    const tiling = new TilingSprite({ texture: floor, width: b.w, height: b.h });
    tiling.position.set(b.x, b.y);
    tiling.tileScale.set(1);
    tiling.eventMode = "static";
    tiling.cursor = "pointer";
    tiling.on("pointertap", (e) => {
      e.stopPropagation();
      this.onZoneClick(zone.id);
    });
    this.groundLayer.addChild(tiling);

    const border = new Graphics();
    border.rect(b.x, b.y, b.w, b.h).stroke({ color: accentToNumber(resolveAccentHex(zone.accent)), width: 1, alpha: 0.25 });
    this.decorLayer.addChild(border);

    const labelBg = new Graphics();
    labelBg.roundRect(b.x + 8, b.y + 8, zone.shortLabel.length * 8 + 20, 18, 2).fill({ color: 0x050609, alpha: 0.75 });
    const dot = new Graphics().circle(b.x + 18, b.y + 17, 3).fill({ color: accentToNumber(resolveAccentHex(zone.accent)) });
    const label = new Text({
      text: zone.shortLabel,
      style: { fontFamily: "monospace", fontSize: 11, fill: accentToNumber(resolveAccentHex(zone.accent)), letterSpacing: 1 },
    });
    label.position.set(b.x + 26, b.y + 10);
    this.decorLayer.addChild(labelBg, dot, label);

    const signText = NEON_SIGN[zone.id];
    if (signText) {
      const sign = new Text({
        text: signText,
        style: { fontFamily: "monospace", fontSize: 13, fill: accentToNumber(resolveAccentHex(zone.accent)), fontWeight: "bold" },
      });
      sign.position.set(b.x + b.w - sign.width - 14, b.y + 14);
      this.decorLayer.addChild(sign);
      this.signs.push({ text: sign, phase: Math.random() * Math.PI * 2 });
    }

    this.spawnParticles(zone, b);
    this.scatterDistrictProps(zone, b, sprites);
  }

  private scatterDistrictProps(zone: WorldZone, b: { x: number; y: number; w: number; h: number }, sprites: SpriteManager) {
    const accent = resolveAccentHex(zone.accent);
    const put = (texture: Texture, x: number, y: number, anchorY = 1) => {
      const s = new Sprite(texture);
      s.anchor.set(0.5, anchorY);
      s.position.set(x, y);
      this.objectLayer.addChild(s);
      return s;
    };
    const edgeSpots = (count: number, margin = 26) => {
      const spots: { x: number; y: number }[] = [];
      for (let i = 0; i < count; i++) {
        const side = i % 4;
        const t = 0.15 + ((i * 0.61) % 0.7);
        if (side === 0) spots.push({ x: b.x + margin, y: b.y + t * b.h });
        else if (side === 1) spots.push({ x: b.x + b.w - margin, y: b.y + t * b.h });
        else if (side === 2) spots.push({ x: b.x + t * b.w, y: b.y + margin });
        else spots.push({ x: b.x + t * b.w, y: b.y + b.h - margin });
      }
      return spots;
    };

    switch (zone.id) {
      case "commons": {
        put(sprites.getFountain(accent), b.x + b.w / 2, b.y + b.h / 2 + 6, 0.75);
        edgeSpots(6).forEach((p, i) => put(sprites.getTree(i), p.x, p.y));
        edgeSpots(4, 44).forEach((p) => put(sprites.getLamp(), p.x, p.y));
        break;
      }
      case "garden": {
        edgeSpots(8).forEach((p, i) => put(sprites.getTree(i + 20), p.x, p.y));
        edgeSpots(3, 60).forEach((p) => put(sprites.getBench(), p.x, p.y, 0.9));
        break;
      }
      case "rooftop": {
        const skyline = sprites.getSkyline(b.w, b.h * 0.55, accent);
        const bg = new Sprite(skyline);
        bg.position.set(b.x, b.y);
        bg.alpha = 0.85;
        this.objectLayer.addChild(bg);
        break;
      }
      case "deep": {
        edgeSpots(6, 40).forEach((p) => put(sprites.getCrystal(accent), p.x, p.y));
        break;
      }
      case "archive": {
        edgeSpots(7, 34).forEach((p) => put(sprites.getBookshelf(accent), p.x, p.y));
        break;
      }
      case "lounge": {
        edgeSpots(4, 30).forEach((p) => put(sprites.getLamp(), p.x, p.y));
        break;
      }
      case "lab": {
        edgeSpots(3, 30).forEach((p) => put(sprites.getCrystal(accent), p.x, p.y));
        break;
      }
      case "arena": {
        edgeSpots(6, 20).forEach((p) => put(sprites.getLamp(), p.x, p.y));
        break;
      }
      default:
        break;
    }
  }

  private spawnParticles(zone: WorldZone, b: { x: number; y: number; w: number; h: number }) {
    const count = zone.ambience === "water" || zone.ambience === "bloom" ? 10 : 5;
    const color = accentToNumber(resolveAccentHex(zone.accent));
    for (let i = 0; i < count; i++) {
      const g = new Graphics().circle(0, 0, 1.4 + Math.random()).fill({ color, alpha: 0.5 + Math.random() * 0.3 });
      g.position.set(b.x + Math.random() * b.w, b.y + Math.random() * b.h);
      const upward = zone.ambience === "bloom" || zone.ambience === "neon";
      this.particles.push({
        g,
        vx: (Math.random() - 0.5) * (zone.ambience === "water" ? 14 : 4),
        vy: upward ? -6 - Math.random() * 6 : (Math.random() - 0.5) * 4,
        minX: b.x,
        maxX: b.x + b.w,
        minY: b.y,
        maxY: b.y + b.h,
      });
      this.particleLayer.addChild(g);
    }
  }

  update(deltaMs: number) {
    const dt = deltaMs / 1000;
    for (const p of this.particles) {
      p.g.x += p.vx * dt;
      p.g.y += p.vy * dt;
      if (p.g.x < p.minX) p.g.x = p.maxX;
      if (p.g.x > p.maxX) p.g.x = p.minX;
      if (p.g.y < p.minY) p.g.y = p.maxY;
      if (p.g.y > p.maxY) p.g.y = p.minY;
    }
    for (const s of this.signs) {
      s.phase += deltaMs * 0.003;
      s.text.alpha = Math.random() < 0.01 ? 0.4 : 0.75 + Math.sin(s.phase) * 0.25;
    }
  }
}
