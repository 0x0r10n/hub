import { Container, Graphics, Sprite, Text, TilingSprite, type Texture } from "pixi.js";
import type { WorldZone, ZoneId } from "@/types";
import { BRIDGES, WORLD_HEIGHT, WORLD_WIDTH, zoneBoundsPx, zoneCenterPx } from "./geometry";
import type { SpriteManager } from "./SpriteManager";
import { accentToNumber, mulberry32, resolveAccentHex } from "./textures";

interface DriftParticle {
  g: Graphics;
  vx: number;
  vy: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  twinkle?: boolean;
  phase: number;
}

const NEON_SIGN: Partial<Record<string, string>> = {
  commons: "24/7",
  lounge: "VACANCY",
  garden: "BLOOM",
};

const RIVER_Y = WORLD_HEIGHT * 0.495;
const RIVER_HALF = 30;

/** Builds the ambient (but continuously animated) world: a seamless wilderness base, a river with
 * bridge crossings, organically-shaped district floors (no rectangle grid), roads, signage, dense
 * per-district and generic filler props, and every particle system that keeps it feeling alive. */
export class TileWorld {
  readonly view = new Container();
  readonly baseLayer = new Container();
  readonly riverLayer = new Container();
  readonly zoneLayer = new Container();
  readonly pathLayer = new Container();
  readonly decorLayer = new Container();
  readonly objectLayer = new Container();
  readonly particleLayer = new Container();
  private particles: DriftParticle[] = [];
  private signs: { text: Text; phase: number }[] = [];
  private onZoneClick: (zoneId: ZoneId) => void;

  constructor(zones: WorldZone[], sprites: SpriteManager, onZoneClick: (zoneId: ZoneId) => void) {
    this.onZoneClick = onZoneClick;
    this.view.addChild(this.baseLayer, this.riverLayer, this.zoneLayer, this.pathLayer, this.decorLayer, this.objectLayer, this.particleLayer);
    this.buildBaseTerrain(sprites);
    this.buildRiver(zones);
    this.buildPaths(zones);
    zones.forEach((zone) => this.buildZone(zone, sprites));
    this.scatterWildProps(zones, sprites);
  }

  private buildBaseTerrain(sprites: SpriteManager) {
    const tiling = new TilingSprite({ texture: sprites.getWildTerrain(), width: WORLD_WIDTH, height: WORLD_HEIGHT });
    this.baseLayer.addChild(tiling);
  }

  private riverYAt(worldX: number, points: { x: number; y: number }[]): number {
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      if (worldX >= a.x && worldX <= b.x) {
        const localT = (worldX - a.x) / (b.x - a.x || 1);
        return a.y + (b.y - a.y) * localT;
      }
    }
    return RIVER_Y;
  }

  private buildRiver(zones: WorldZone[]) {
    const rand = mulberry32(1337);
    const steps = 9;
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * WORLD_WIDTH;
      const y = RIVER_Y + (rand() - 0.5) * 70;
      points.push({ x, y });
    }

    const g = new Graphics();
    const drawBand = (halfWidth: number, color: number, alpha: number) => {
      g.moveTo(points[0].x, points[0].y - halfWidth);
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const cur = points[i];
        const midX = (prev.x + cur.x) / 2;
        const midY = (prev.y + cur.y) / 2;
        g.quadraticCurveTo(prev.x, prev.y - halfWidth, midX, midY - halfWidth);
      }
      g.lineTo(points[points.length - 1].x, points[points.length - 1].y + halfWidth);
      for (let i = points.length - 1; i > 0; i--) {
        const cur = points[i];
        const prev = points[i - 1];
        const midX = (prev.x + cur.x) / 2;
        const midY = (prev.y + cur.y) / 2;
        g.quadraticCurveTo(cur.x, cur.y + halfWidth, midX, midY + halfWidth);
      }
      g.closePath();
      g.fill({ color, alpha });
    };

    drawBand(RIVER_HALF + 10, 0x0a1a2e, 0.9);
    drawBand(RIVER_HALF, 0x123a5c, 1);
    drawBand(RIVER_HALF - 8, 0x1a4d72, 0.85);
    this.riverLayer.addChild(g);

    for (let i = 0; i < 46; i++) {
      const x = rand() * WORLD_WIDTH;
      const y = this.riverYAt(x, points) + (rand() - 0.5) * (RIVER_HALF - 10) * 2;
      const dot = new Graphics().ellipse(0, 0, 6 + rand() * 8, 1.4).fill({ color: 0x9fd8ff, alpha: 0.16 + rand() * 0.16 });
      dot.position.set(x, y);
      this.riverLayer.addChild(dot);
      this.particles.push({ g: dot, vx: 10 + rand() * 12, vy: 0, minX: 0, maxX: WORLD_WIDTH, minY: y - 4, maxY: y + 4, phase: rand() * Math.PI * 2 });
    }

    const byId = new Map(zones.map((z) => [z.id, z]));
    const crossings: [ZoneId, ZoneId][] = [
      ["lab", "deep"],
      ["commons", "garden"],
      ["arena", "lounge"],
    ];
    for (const [a, b] of crossings) {
      const za = byId.get(a);
      const zb = byId.get(b);
      if (!za || !zb) continue;
      const ca = zoneCenterPx(za);
      const cb = zoneCenterPx(zb);
      const t = (RIVER_Y - ca.y) / (cb.y - ca.y || 1);
      if (t < 0 || t > 1) continue;
      const bx = ca.x + (cb.x - ca.x) * t;
      const by = this.riverYAt(bx, points);
      this.buildBridge(bx, by);
    }
  }

  private buildBridge(x: number, y: number) {
    const g = new Graphics();
    const w = 34;
    const h = RIVER_HALF * 2 + 20;
    g.rect(-w / 2 - 3, -h / 2, 4, h).fill({ color: 0x1b1710 });
    g.rect(w / 2 - 1, -h / 2, 4, h).fill({ color: 0x1b1710 });
    g.rect(-w / 2, -h / 2, w, h).fill({ color: 0x6b4a30 });
    for (let py = -h / 2 + 3; py < h / 2; py += 6) {
      g.rect(-w / 2 + 1, py, w - 2, 3).fill({ color: 0x5a3d26 });
    }
    g.rect(-w / 2, -h / 2, w, 3).fill({ color: 0x8a6444, alpha: 0.6 });
    g.position.set(x, y);
    this.pathLayer.addChild(g);
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
      g.moveTo(ca.x, ca.y).lineTo(cb.x, cb.y).stroke({ color: 0x1a1f2c, width: 26, cap: "round" });
    }
    for (const [a, b] of BRIDGES) {
      const za = byId.get(a);
      const zb = byId.get(b);
      if (!za || !zb) continue;
      const ca = zoneCenterPx(za);
      const cb = zoneCenterPx(zb);
      g.moveTo(ca.x, ca.y).lineTo(cb.x, cb.y).stroke({ color: 0x3a3244, width: 16, cap: "round" });
      g.moveTo(ca.x, ca.y).lineTo(cb.x, cb.y).stroke({ color: 0x4a4258, width: 2.5, alpha: 0.7 });

      const steps = Math.max(2, Math.floor(Math.hypot(cb.x - ca.x, cb.y - ca.y) / 130));
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const x = ca.x + (cb.x - ca.x) * t;
        const y = ca.y + (cb.y - ca.y) * t;
        g.circle(x, y, 3).fill({ color: 0xffc857, alpha: 0.85 });
        g.circle(x, y, 8).fill({ color: 0xffc857, alpha: 0.13 });
      }
    }
    this.pathLayer.addChild(g);
  }

  /** An irregular, rounded silhouette around the zone's rectangle so districts read as neighborhoods
   * blending into the world rather than grid cells with hard rectangular edges. */
  private zoneBlobPoints(b: { x: number; y: number; w: number; h: number }, seed: number) {
    const rand = mulberry32(seed);
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const rx = b.w / 2 + 34;
    const ry = b.h / 2 + 34;
    const count = 14;
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const jitter = 0.82 + rand() * 0.32;
      pts.push({ x: cx + Math.cos(angle) * rx * jitter, y: cy + Math.sin(angle) * ry * jitter });
    }
    return pts;
  }

  private blobPath(g: Graphics, pts: { x: number; y: number }[]) {
    const mid = (a: { x: number; y: number }, b: { x: number; y: number }) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    const start = mid(pts[pts.length - 1], pts[0]);
    g.moveTo(start.x, start.y);
    for (let i = 0; i < pts.length; i++) {
      const next = pts[(i + 1) % pts.length];
      const m = mid(pts[i], next);
      g.quadraticCurveTo(pts[i].x, pts[i].y, m.x, m.y);
    }
    g.closePath();
  }

  private buildZone(zone: WorldZone, sprites: SpriteManager) {
    const b = zoneBoundsPx(zone);
    const accentHex = resolveAccentHex(zone.accent);
    const seed = zone.id.length * 97 + zone.name.length * 13;
    const blobPts = this.zoneBlobPoints(b, seed);

    const maskShape = new Graphics();
    this.blobPath(maskShape, blobPts);
    maskShape.fill(0xffffff);

    const glow = new Graphics();
    this.blobPath(glow, blobPts);
    glow.fill({ color: accentToNumber(accentHex), alpha: 0.05 });
    this.zoneLayer.addChild(glow);

    const inflated = { x: b.x - 40, y: b.y - 40, w: b.w + 80, h: b.h + 80 };
    const floor = sprites.getMetaFloorTile(zone.ambience, accentHex, zone.id);
    const tiling = new TilingSprite({ texture: floor, width: inflated.w, height: inflated.h });
    tiling.position.set(inflated.x, inflated.y);
    tiling.mask = maskShape;
    tiling.eventMode = "static";
    tiling.cursor = "pointer";
    tiling.on("pointertap", (e) => {
      e.stopPropagation();
      this.onZoneClick(zone.id);
    });
    this.zoneLayer.addChild(tiling);

    const labelBg = new Graphics();
    labelBg.roundRect(b.x + 8, b.y + 8, zone.shortLabel.length * 8 + 20, 18, 2).fill({ color: 0x050609, alpha: 0.75 });
    const dot = new Graphics().circle(b.x + 18, b.y + 17, 3).fill({ color: accentToNumber(accentHex) });
    const label = new Text({
      text: zone.shortLabel,
      style: { fontFamily: "monospace", fontSize: 11, fill: accentToNumber(accentHex), letterSpacing: 1 },
    });
    label.position.set(b.x + 26, b.y + 10);
    this.decorLayer.addChild(labelBg, dot, label);

    const signText = NEON_SIGN[zone.id];
    if (signText) {
      const sign = new Text({
        text: signText,
        style: { fontFamily: "monospace", fontSize: 13, fill: accentToNumber(accentHex), fontWeight: "bold" },
      });
      sign.position.set(b.x + b.w - sign.width - 14, b.y + 14);
      this.decorLayer.addChild(sign);
      this.signs.push({ text: sign, phase: Math.random() * Math.PI * 2 });
    }

    this.spawnParticles(zone, b);
    this.scatterDistrictProps(zone, b, sprites);
    this.scatterEdgeCamouflage(blobPts, b, sprites);
  }

  /** Bushes/rocks planted right along each district's organic edge so the transition into the
   * surrounding wilderness never reads as a hard boundary. */
  private scatterEdgeCamouflage(pts: { x: number; y: number }[], b: { x: number; y: number; w: number; h: number }, sprites: SpriteManager) {
    const rand = mulberry32(Math.round(b.x) * 3 + Math.round(b.y) * 7);
    pts.forEach((p, i) => {
      if (rand() < 0.55) {
        const tex = rand() < 0.6 ? sprites.getBush(i + Math.round(b.x)) : sprites.getRock(i + Math.round(b.y));
        const s = new Sprite(tex);
        s.anchor.set(0.5, 1);
        s.position.set(p.x + (rand() - 0.5) * 14, p.y + (rand() - 0.5) * 14);
        this.objectLayer.addChild(s);
      }
    });
  }

  /** Fills the wilderness between districts and along every road with trees/bushes/rocks/flowers so
   * there are no large empty rectangles anywhere in the viewport. */
  private scatterWildProps(zones: WorldZone[], sprites: SpriteManager) {
    const rand = mulberry32(99);
    const zoneBoxes = zones.map((z) => zoneBoundsPx(z));
    const insideAnyZone = (x: number, y: number, pad = 60) =>
      zoneBoxes.some((zb) => x > zb.x - pad && x < zb.x + zb.w + pad && y > zb.y - pad && y < zb.y + zb.h + pad);

    let placed = 0;
    let attempts = 0;
    while (placed < 260 && attempts < 4000) {
      attempts++;
      const x = rand() * WORLD_WIDTH;
      const y = rand() * WORLD_HEIGHT;
      if (Math.abs(y - RIVER_Y) < RIVER_HALF + 24) continue;
      if (insideAnyZone(x, y)) continue;

      const roll = rand();
      let tex: Texture;
      let anchorY = 1;
      if (roll < 0.4) tex = sprites.getTree(Math.floor(rand() * 999));
      else if (roll < 0.65) tex = sprites.getBush(Math.floor(rand() * 999));
      else if (roll < 0.85) tex = sprites.getRock(Math.floor(rand() * 999));
      else {
        tex = sprites.getFlowerPatch(Math.floor(rand() * 999));
        anchorY = 0.5;
      }
      const s = new Sprite(tex);
      s.anchor.set(0.5, anchorY);
      s.position.set(x, y);
      s.alpha = 0.92;
      this.objectLayer.addChild(s);
      placed++;
    }
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
        const t = 0.12 + ((i * 0.37) % 0.76);
        if (side === 0) spots.push({ x: b.x + margin, y: b.y + t * b.h });
        else if (side === 1) spots.push({ x: b.x + b.w - margin, y: b.y + t * b.h });
        else if (side === 2) spots.push({ x: b.x + t * b.w, y: b.y + margin });
        else spots.push({ x: b.x + t * b.w, y: b.y + b.h - margin });
      }
      return spots;
    };
    const scatterFill = (count: number, pick: () => Texture, anchorY = 1) => {
      const rand = mulberry32(Math.round(b.x + b.y) + count * 17);
      for (let i = 0; i < count; i++) {
        const x = b.x + 16 + rand() * (b.w - 32);
        const y = b.y + 16 + rand() * (b.h - 32);
        put(pick(), x, y, anchorY);
      }
    };

    switch (zone.id) {
      case "commons": {
        put(sprites.getFountain(accent), b.x + b.w / 2, b.y + b.h * 0.42, 0.75);
        edgeSpots(8).forEach((p, i) => put(sprites.getTree(i), p.x, p.y));
        edgeSpots(6, 44).forEach((p) => put(sprites.getLamp(), p.x, p.y));
        edgeSpots(3, 70).forEach((p) => put(sprites.getStall(accent), p.x, p.y));
        edgeSpots(4, 90).forEach((p) => put(sprites.getBench(), p.x, p.y, 0.9));
        scatterFill(10, () => sprites.getFlowerPatch(Math.random() * 99), 0.5);
        break;
      }
      case "garden": {
        put(sprites.getFountain(accent), b.x + b.w * 0.28, b.y + b.h * 0.3, 0.75);
        edgeSpots(10).forEach((p, i) => put(sprites.getTree(i + 20), p.x, p.y));
        edgeSpots(4, 60).forEach((p) => put(sprites.getBench(), p.x, p.y, 0.9));
        scatterFill(18, () => sprites.getFlowerPatch(Math.random() * 99), 0.5);
        scatterFill(6, () => sprites.getBush(Math.random() * 99));
        this.spawnFireflies(b, 14);
        break;
      }
      case "rooftop": {
        const skyline = sprites.getSkyline(b.w, b.h * 0.55, accent);
        const bg = new Sprite(skyline);
        bg.position.set(b.x, b.y);
        bg.alpha = 0.9;
        this.objectLayer.addChild(bg);
        edgeSpots(3, 40).forEach((p) => put(sprites.getCrystal(accent), p.x, p.y));
        break;
      }
      case "deep": {
        edgeSpots(9, 40).forEach((p) => put(sprites.getCrystal(accent), p.x, p.y));
        scatterFill(8, () => sprites.getRock(Math.random() * 99));
        break;
      }
      case "archive": {
        edgeSpots(10, 34).forEach((p) => put(sprites.getBookshelf(accent), p.x, p.y));
        edgeSpots(5, 60).forEach((p) => put(sprites.getLamp(), p.x, p.y));
        break;
      }
      case "lounge": {
        edgeSpots(6, 30).forEach((p) => put(sprites.getLamp(), p.x, p.y));
        edgeSpots(4, 55).forEach((p) => put(sprites.getBench(), p.x, p.y, 0.9));
        scatterFill(6, () => sprites.getFlowerPatch(Math.random() * 99), 0.5);
        break;
      }
      case "lab": {
        edgeSpots(5, 30).forEach((p) => put(sprites.getCrystal(accent), p.x, p.y));
        edgeSpots(4, 55).forEach((p) => put(sprites.getFence(), p.x, p.y));
        break;
      }
      case "arena": {
        edgeSpots(8, 20).forEach((p) => put(sprites.getLamp(), p.x, p.y));
        edgeSpots(6, 50).forEach((p) => put(sprites.getFence(), p.x, p.y));
        break;
      }
      default:
        break;
    }
  }

  private spawnFireflies(b: { x: number; y: number; w: number; h: number }, count: number) {
    for (let i = 0; i < count; i++) {
      const g = new Graphics().circle(0, 0, 1.2).fill({ color: 0xdfffb0, alpha: 0.8 });
      g.position.set(b.x + Math.random() * b.w, b.y + Math.random() * b.h);
      this.particleLayer.addChild(g);
      this.particles.push({
        g,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        minX: b.x,
        maxX: b.x + b.w,
        minY: b.y,
        maxY: b.y + b.h,
        twinkle: true,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  private spawnParticles(zone: WorldZone, b: { x: number; y: number; w: number; h: number }) {
    const count = zone.ambience === "water" || zone.ambience === "bloom" ? 12 : 7;
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
        phase: Math.random() * Math.PI * 2,
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
      if (p.twinkle) {
        p.phase += deltaMs * 0.003;
        p.g.alpha = 0.35 + Math.max(0, Math.sin(p.phase)) * 0.65;
      }
    }
    for (const s of this.signs) {
      s.phase += deltaMs * 0.003;
      s.text.alpha = Math.random() < 0.01 ? 0.4 : 0.75 + Math.sin(s.phase) * 0.25;
    }
  }
}
