import { Rectangle, Texture } from "pixi.js";
import type { SpriteVariant, ZoneId } from "@/types";

/** All procedural pixel-art generation lives here: floor tiles, buildings, and character sheets.
 * Everything is drawn onto small off-screen canvases at native pixel-art resolution, then
 * wrapped as PIXI.Texture with nearest-neighbor sampling so it stays crisp at any zoom.
 */

export const TILE_PX = 32;
export const CHAR_CELL_W = 30;
export const CHAR_CELL_H = 42;
const CHAR_GRID_COLS = 12;
const CHAR_GRID_ROWS = 16;
const CHAR_LEG_ROW_START = 10;
const CHAR_PANTS_COLOR = "#1a1f2e";
const CHAR_OUTLINE_COLOR = "#04050a";

export type Direction = "down" | "up" | "side";
export type CharAnim = "idle" | "walk" | "sit" | "busy" | "alert";

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

export function mix(hexA: string, hexB: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(hexA);
  const [br, bg, bb] = hexToRgb(hexB);
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

export function shade(hex: string, amt: number): string {
  return amt >= 0 ? mix(hex, "#ffffff", amt) : mix(hex, "#000000", -amt);
}

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function texFromCanvas(canvas: HTMLCanvasElement): Texture {
  const tex = Texture.from(canvas);
  tex.source.scaleMode = "nearest";
  return tex;
}

const VOID_900 = "#090b11";
const VOID_800 = "#121623";
const VOID_700 = "#191f30";
const VOID_600 = "#232a3f";

/** Maps the Tailwind CSS accent tokens used throughout the data/UI layer to real hex colors for canvas/PIXI. */
export const ACCENT_HEX: Record<string, string> = {
  "neon-cyan": "#34eaf2",
  "neon-teal": "#2ce8b5",
  "neon-violet": "#b083ff",
  "neon-magenta": "#ff5fd1",
  "neon-pink": "#ff8fd6",
  "neon-amber": "#ffc857",
  "neon-orange": "#ff7a45",
  "neon-red": "#ff4d6d",
  "neon-green": "#6dff8f",
  "neon-blue": "#5b8cff",
  "void-300": "#6c7699",
};

export function resolveAccentHex(accentToken: string): string {
  return ACCENT_HEX[accentToken] ?? "#34eaf2";
}

export function hexToNum(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}

export function accentToNumber(accentToken: string): number {
  return hexToNum(resolveAccentHex(accentToken));
}

// ---------------------------------------------------------------------------
// Floor tiles
// ---------------------------------------------------------------------------

export type Ambience = "water" | "neon" | "circuit" | "void" | "bloom" | "static" | "data" | "sky";

function speckle(ctx: CanvasRenderingContext2D, rand: () => number, count: number, color: string, size: number, w: number, h: number) {
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const x = Math.floor(rand() * (w / size)) * size;
    const y = Math.floor(rand() * (h / size)) * size;
    ctx.fillRect(x, y, size, size);
  }
}

/** Soft organic mottling -- overlapping low-alpha blobs instead of a uniform grid of cells, so
 * terrain reads as natural noise rather than a level-editor tileset. */
function mottle(ctx: CanvasRenderingContext2D, rand: () => number, color: string, count: number, w: number, h: number) {
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = 2 + rand() * 4;
    ctx.globalAlpha = 0.25 + rand() * 0.3;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function makeFloorTile(ambience: Ambience, accent: string, variant: number, zoneId?: ZoneId): HTMLCanvasElement {
  const canvas = makeCanvas(TILE_PX, TILE_PX);
  const ctx = canvas.getContext("2d")!;
  const rand = mulberry32(ambience.length * 97 + variant * 13 + (zoneId?.length ?? 0) * 53);

  switch (ambience) {
    case "neon": {
      // warm plaza cobblestone (The Commons town square)
      const base = mix("#2a2038", "#3c2f4a", variant * 0.15);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, TILE_PX, TILE_PX);
      mottle(ctx, rand, shade(base, -0.2), 5, TILE_PX, TILE_PX);
      mottle(ctx, rand, shade(base, 0.1), 4, TILE_PX, TILE_PX);
      ctx.strokeStyle = shade(base, -0.3);
      ctx.lineWidth = 1;
      const cx = 6 + rand() * (TILE_PX - 12);
      const cy = 6 + rand() * (TILE_PX - 12);
      ctx.beginPath();
      ctx.arc(cx, cy, 5 + rand() * 3, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case "circuit": {
      // clean lab floor: metal panels with a faint glowing seam, no grid
      const base = mix("#161c2c", accent, 0.05);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, TILE_PX, TILE_PX);
      mottle(ctx, rand, shade(base, -0.15), 4, TILE_PX, TILE_PX);
      if (variant === 0) {
        ctx.strokeStyle = mix(base, accent, 0.6);
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, TILE_PX * 0.5);
        ctx.lineTo(TILE_PX, TILE_PX * 0.5);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      speckle(ctx, rand, 2, mix(base, accent, 0.7), 1.5, TILE_PX, TILE_PX);
      break;
    }
    case "static": {
      // sunbaked arena dirt/sand
      const base = mix("#241416", "#341a1c", variant * 0.2);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, TILE_PX, TILE_PX);
      mottle(ctx, rand, shade(base, -0.25), 7, TILE_PX, TILE_PX);
      mottle(ctx, rand, shade(base, 0.15), 4, TILE_PX, TILE_PX);
      break;
    }
    case "bloom": {
      if (zoneId === "lounge") {
        // plush quilted carpet
        const base = mix("#241226", "#341a3a", variant * 0.2);
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, TILE_PX, TILE_PX);
        mottle(ctx, rand, shade(base, 0.12), 5, TILE_PX, TILE_PX);
        ctx.strokeStyle = shade(base, -0.25);
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(TILE_PX / 2, 0);
        ctx.lineTo(TILE_PX, TILE_PX / 2);
        ctx.lineTo(TILE_PX / 2, TILE_PX);
        ctx.lineTo(0, TILE_PX / 2);
        ctx.closePath();
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else {
        // grass turf
        const base = mix("#0f2a1a", "#123a22", variant * 0.25);
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, TILE_PX, TILE_PX);
        mottle(ctx, rand, shade(base, 0.18), 8, TILE_PX, TILE_PX);
        mottle(ctx, rand, shade(base, -0.15), 5, TILE_PX, TILE_PX);
        if (rand() < 0.35) {
          ctx.fillStyle = mix("#ffc857", "#ff8fd6", rand());
          ctx.globalAlpha = 0.85;
          ctx.fillRect(rand() * TILE_PX, rand() * TILE_PX, 1.5, 1.5);
          ctx.globalAlpha = 1;
        }
      }
      break;
    }
    case "data": {
      // old library wood/stone flooring
      const base = mix("#20141c", "#2a1a24", variant * 0.2);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, TILE_PX, TILE_PX);
      ctx.strokeStyle = shade(base, -0.2);
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5;
      const plank = TILE_PX / 2;
      const off = (variant % 2) * (plank / 2);
      for (let x = -plank; x < TILE_PX + plank; x += plank) {
        ctx.beginPath();
        ctx.moveTo(x + off, 0);
        ctx.lineTo(x + off, TILE_PX);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      mottle(ctx, rand, shade(base, -0.15), 3, TILE_PX, TILE_PX);
      break;
    }
    case "sky": {
      // rooftop decking / metal grate
      const base = mix("#171b28", "#1e2436", variant * 0.2);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, TILE_PX, TILE_PX);
      ctx.strokeStyle = shade(base, -0.25);
      ctx.globalAlpha = 0.55;
      for (let x = 5; x < TILE_PX; x += 9) {
        ctx.beginPath();
        ctx.moveTo(x, 2);
        ctx.lineTo(x, TILE_PX - 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      mottle(ctx, rand, shade(base, 0.1), 3, TILE_PX, TILE_PX);
      break;
    }
    case "water": {
      const base = mix("#0a1a2e", "#0d2440", variant * 0.2);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, TILE_PX, TILE_PX);
      ctx.strokeStyle = shade(base, 0.3);
      ctx.globalAlpha = 0.5;
      for (let y = 4; y < TILE_PX; y += 8) {
        const off = variant % 2 === 0 ? 0 : 4;
        ctx.beginPath();
        ctx.moveTo((0 + off) % TILE_PX, y);
        ctx.quadraticCurveTo(TILE_PX / 4 + off, y - 3, TILE_PX / 2 + off, y);
        ctx.quadraticCurveTo((TILE_PX * 0.75) + off, y + 3, TILE_PX + off, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case "void":
    default: {
      // dark cavern rock (The Deep)
      const base = mix("#140f22", "#1b1330", variant * 0.2);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, TILE_PX, TILE_PX);
      mottle(ctx, rand, shade(base, -0.25), 6, TILE_PX, TILE_PX);
      mottle(ctx, rand, shade(base, 0.12), 3, TILE_PX, TILE_PX);
      break;
    }
  }

  return canvas;
}

/** A larger tile composed of several floor-tile variants arranged pseudo-randomly, so a TilingSprite
 * doesn't show an obvious 32px repeat. */
export function makeMetaFloorTile(ambience: Ambience, accent: string, zoneId?: ZoneId, grid = 6): HTMLCanvasElement {
  const variants = [0, 1, 2, 3].map((v) => makeFloorTile(ambience, accent, v, zoneId));
  const size = TILE_PX * grid;
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext("2d")!;
  const rand = mulberry32(accent.length * 31 + ambience.length * 17 + (zoneId?.length ?? 0) * 11);
  for (let gy = 0; gy < grid; gy++) {
    for (let gx = 0; gx < grid; gx++) {
      const v = variants[Math.floor(rand() * variants.length)];
      ctx.drawImage(v, gx * TILE_PX, gy * TILE_PX);
    }
  }
  return canvas;
}

export function makePathTile(variant: number): HTMLCanvasElement {
  const canvas = makeCanvas(TILE_PX, TILE_PX);
  const ctx = canvas.getContext("2d")!;
  const rand = mulberry32(500 + variant * 31);
  const base = mix(VOID_800, "#2a3040", 0.5);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, TILE_PX, TILE_PX);
  const grid = 4;
  const cell = TILE_PX / grid;
  for (let gy = 0; gy < grid; gy++) {
    for (let gx = 0; gx < grid; gx++) {
      ctx.fillStyle = mix(base, "#000000", rand() * 0.25);
      ctx.fillRect(gx * cell + 1, gy * cell + 1, cell - 2, cell - 2);
    }
  }
  return canvas;
}

// ---------------------------------------------------------------------------
// Buildings (rooms)
// ---------------------------------------------------------------------------

export type RoomVisualState = "idle" | "active" | "live" | "private" | "archived";

export function makeBuildingTexture(w: number, h: number, accent: string, state: RoomVisualState, seed: number, zoneId?: ZoneId): HTMLCanvasElement {
  const canvas = makeCanvas(Math.round(w), Math.round(h));
  const ctx = canvas.getContext("2d")!;
  const rand = mulberry32(seed * 7 + state.length);
  const wallBase = mix(VOID_600, accent, state === "idle" ? 0.08 : 0.16);
  const roofH = Math.max(10, h * 0.16);

  // walls -- always readably lighter than the ground so the building reads as a structure
  ctx.fillStyle = wallBase;
  ctx.fillRect(0, roofH, w, h - roofH);
  ctx.fillStyle = shade(wallBase, 0.14);
  ctx.fillRect(0, roofH, w, 2);
  ctx.strokeStyle = shade(wallBase, -0.35);
  ctx.lineWidth = 2;
  ctx.strokeRect(1, roofH, w - 2, h - roofH - 1);

  // roof: a distinct darker band with a bright ridge line so the silhouette is unmistakable
  ctx.fillStyle = mix(VOID_800, accent, 0.15);
  ctx.fillRect(0, 0, w, roofH);
  ctx.fillStyle = mix(wallBase, accent, 0.5);
  ctx.fillRect(0, roofH - 3, w, 3);
  ctx.strokeStyle = shade(mix(VOID_800, accent, 0.15), -0.3);
  ctx.strokeRect(0.5, 0.5, w - 1, roofH - 1);

  // brick/panel texture on wall
  const cols = Math.max(3, Math.floor(w / 14));
  const rows = Math.max(2, Math.floor((h - roofH) / 12));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (rand() < 0.22) {
        ctx.fillStyle = shade(wallBase, -0.1 - rand() * 0.16);
        ctx.fillRect((c * w) / cols, roofH + (r * (h - roofH)) / rows, w / cols, (h - roofH) / rows);
      } else if (rand() < 0.06) {
        ctx.fillStyle = shade(wallBase, 0.1 + rand() * 0.1);
        ctx.fillRect((c * w) / cols, roofH + (r * (h - roofH)) / rows, w / cols, (h - roofH) / rows);
      }
    }
  }

  // corner trim pilasters so the facade reads as a real structure, not a flat card
  ctx.fillStyle = shade(wallBase, -0.28);
  ctx.fillRect(0, roofH, 3, h - roofH);
  ctx.fillRect(w - 3, roofH, 3, h - roofH);
  // foundation line
  ctx.fillStyle = shade(wallBase, -0.35);
  ctx.fillRect(0, h - 4, w, 4);

  // door -- always has a bright frame so the entrance reads at a glance
  const doorW = w * 0.24;
  const doorH = (h - roofH) * 0.46;
  const doorX = w / 2 - doorW / 2;
  const doorY = h - doorH;
  const doorLit = state === "active" || state === "live";
  ctx.fillStyle = doorLit ? shade(accent, -0.1) : shade(wallBase, -0.3);
  ctx.fillRect(doorX, doorY, doorW, doorH);
  ctx.strokeStyle = doorLit ? shade(accent, 0.25) : shade(wallBase, 0.3);
  ctx.lineWidth = 2;
  ctx.strokeRect(doorX, doorY, doorW, doorH);
  ctx.fillStyle = shade(wallBase, 0.4);
  ctx.fillRect(doorX + doorW * 0.35, doorY + doorH * 0.4, 1.5, 1.5);

  // windows -- a visible frame regardless of state, glowing when the room is occupied. Repeats in
  // as many rows as the facade height allows so tall buildings don't leave a dead blank wall.
  const winCount = Math.max(2, Math.floor(cols / 2));
  const winW = Math.min(10, w / (winCount * 2.4));
  const winH = winW * 1.2;
  const rowPitch = winH + 22;
  const wallH = h - roofH;
  const winRows = Math.max(1, Math.floor((wallH - 14) / rowPitch));
  const lit = state === "active" || state === "live" || state === "private";
  const litColor = state === "private" ? mix(accent, "#ffffff", 0.1) : state === "live" ? shade(accent, 0.15) : shade(accent, -0.1);
  const unlitColor = shade(wallBase, 0.16);
  for (let row = 0; row < winRows; row++) {
    const winY = roofH + 14 + row * rowPitch;
    if (winY + winH > h - 8) break;
    for (let i = 0; i < winCount; i++) {
      const gap = w / (winCount + 1);
      const wx = gap * (i + 1) - winW / 2;
      if (wx > doorX - 6 && wx < doorX + doorW + 6 && winY + winH > doorY - 4) continue;
      if (lit) {
        ctx.save();
        ctx.shadowColor = litColor;
        ctx.shadowBlur = state === "live" ? 9 : 5;
        ctx.fillStyle = litColor;
        ctx.fillRect(wx, winY, winW, winH);
        ctx.restore();
        if (state === "private") {
          ctx.strokeStyle = mix(litColor, "#000000", 0.5);
          ctx.beginPath();
          ctx.moveTo(wx, winY + winH * 0.4);
          ctx.lineTo(wx + winW, winY + winH * 0.4);
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = unlitColor;
        ctx.fillRect(wx, winY, winW, winH);
        ctx.fillStyle = shade(wallBase, -0.25);
        ctx.fillRect(wx, winY, winW, 1);
        ctx.fillRect(wx, winY, 1, winH);
      }
      ctx.strokeStyle = shade(wallBase, -0.4);
      ctx.strokeRect(wx, winY, winW, winH);
      ctx.fillStyle = shade(wallBase, -0.3);
      ctx.fillRect(wx - 1, winY + winH, winW + 2, 2);
    }
  }

  drawDistrictMotif(ctx, zoneId, w, h, roofH, wallBase, accent, rand);

  // roof beacon for live rooms
  if (state === "live") {
    ctx.save();
    ctx.shadowColor = "#ff4d6d";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#ff4d6d";
    ctx.beginPath();
    ctx.arc(w / 2, roofH * 0.35, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  return canvas;
}

function drawDistrictMotif(
  ctx: CanvasRenderingContext2D,
  zoneId: ZoneId | undefined,
  w: number,
  h: number,
  roofH: number,
  wallBase: string,
  accent: string,
  rand: () => number,
) {
  switch (zoneId) {
    case "lab": {
      const sw = w * 0.42;
      const sh = h * 0.18;
      const sx = w / 2 - sw / 2;
      const sy = roofH + h * 0.06;
      ctx.fillStyle = shade(wallBase, -0.3);
      ctx.fillRect(sx, sy, sw, sh);
      ctx.strokeStyle = shade(accent, 0.1);
      ctx.strokeRect(sx, sy, sw, sh);
      ctx.fillStyle = accent;
      for (let x = sx + 2; x < sx + sw - 2; x += 4) ctx.fillRect(x, sy + sh / 2 - 0.5, 2, 1);
      ctx.fillStyle = shade(wallBase, -0.4);
      ctx.fillRect(w / 2 - 1, 1, 2, roofH * 0.5);
      ctx.fillStyle = accent;
      ctx.fillRect(w / 2 - 1, 0, 2, 2);
      break;
    }
    case "arena": {
      const stripeY = h - h * 0.08;
      for (let x = 0; x < w; x += 8) {
        ctx.fillStyle = (Math.floor(x / 8) % 2 === 0 ? "#ff4d6d" : "#0a0d14") as string;
        ctx.fillRect(x, stripeY, 6, 3);
      }
      break;
    }
    case "deep": {
      ctx.save();
      ctx.shadowColor = accent;
      ctx.shadowBlur = 6;
      ctx.fillStyle = shade(accent, 0.1);
      for (const cx of [w * 0.12, w * 0.88]) {
        ctx.beginPath();
        ctx.moveTo(cx, h - 4);
        ctx.lineTo(cx - 3, h - 12);
        ctx.lineTo(cx, h - 20);
        ctx.lineTo(cx + 3, h - 12);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      break;
    }
    case "lounge": {
      ctx.save();
      ctx.shadowColor = accent;
      ctx.shadowBlur = 5;
      ctx.fillStyle = accent;
      ctx.fillRect(w * 0.86, roofH + 2, 2, h - roofH - 6);
      ctx.restore();
      break;
    }
    case "garden": {
      ctx.fillStyle = shade("#6dff8f", -0.1);
      for (let x = 2; x < w - 2; x += 5) {
        if (rand() < 0.7) ctx.fillRect(x, roofH - 1, 2, 3);
      }
      break;
    }
    case "archive": {
      ctx.strokeStyle = shade(wallBase, -0.35);
      for (let x = w * 0.15; x < w * 0.85; x += 5) {
        ctx.beginPath();
        ctx.moveTo(x, roofH + h * 0.08);
        ctx.lineTo(x, roofH + h * 0.08 + 6);
        ctx.stroke();
      }
      break;
    }
    case "rooftop": {
      ctx.fillStyle = shade(wallBase, -0.4);
      ctx.fillRect(w * 0.2, 1, 1.5, roofH * 0.7);
      ctx.fillStyle = shade(wallBase, -0.4);
      ctx.fillRect(w * 0.75, 1, 1.5, roofH * 0.9);
      ctx.fillStyle = "#ff4d6d";
      ctx.fillRect(w * 0.75 - 0.5, 0, 2.5, 2);
      break;
    }
    case "commons": {
      ctx.fillStyle = shade(accent, -0.2);
      ctx.fillRect(w * 0.28, roofH + h * 0.12, w * 0.44, 3);
      break;
    }
    default:
      break;
  }
}

// ---------------------------------------------------------------------------
// Props / decoration
// ---------------------------------------------------------------------------

export function makeTreeTexture(seed: number): HTMLCanvasElement {
  const w = 20;
  const h = 28;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext("2d")!;
  const rand = mulberry32(seed * 13 + 7);
  const trunk = "#3a2a1f";
  const leaf = mix("#1c5c3a", "#2f8f56", rand() * 0.6);
  ctx.fillStyle = trunk;
  ctx.fillRect(w / 2 - 2, h - 9, 4, 9);
  ctx.fillStyle = shade(leaf, -0.25);
  ctx.beginPath();
  ctx.arc(w / 2, h - 16, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = leaf;
  ctx.beginPath();
  ctx.arc(w / 2 - 2, h - 19, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = shade(leaf, 0.2);
  ctx.beginPath();
  ctx.arc(w / 2 - 4, h - 21, 3, 0, Math.PI * 2);
  ctx.fill();
  return canvas;
}

export function makeLampTexture(): HTMLCanvasElement {
  const w = 8;
  const h = 30;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#1b2030";
  ctx.fillRect(w / 2 - 1, 8, 2, h - 8);
  ctx.save();
  ctx.shadowColor = "#ffc857";
  ctx.shadowBlur = 8;
  ctx.fillStyle = "#ffc857";
  ctx.beginPath();
  ctx.arc(w / 2, 5, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = "#3a3f52";
  ctx.fillRect(w / 2 - 3, 7, 6, 2);
  return canvas;
}

export function makeBenchTexture(): HTMLCanvasElement {
  const w = 20;
  const h = 12;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext("2d")!;
  const wood = "#8a5a3c";
  ctx.fillStyle = wood;
  ctx.fillRect(1, 3, w - 2, 2);
  ctx.fillRect(1, 6, w - 2, 2);
  ctx.fillStyle = "#3a2a1f";
  ctx.fillRect(2, 8, 2, 4);
  ctx.fillRect(w - 4, 8, 2, 4);
  return canvas;
}

export function makeCrystalTexture(accent: string): HTMLCanvasElement {
  const w = 16;
  const h = 22;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext("2d")!;
  ctx.save();
  ctx.shadowColor = accent;
  ctx.shadowBlur = 8;
  const shard = (cx: number, height: number, width: number) => {
    ctx.fillStyle = shade(accent, 0.1);
    ctx.beginPath();
    ctx.moveTo(cx, h - height);
    ctx.lineTo(cx - width, h - 2);
    ctx.lineTo(cx + width, h - 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = shade(accent, 0.4);
    ctx.beginPath();
    ctx.moveTo(cx, h - height);
    ctx.lineTo(cx - width * 0.3, h - height * 0.5);
    ctx.lineTo(cx + width * 0.2, h - height * 0.6);
    ctx.closePath();
    ctx.fill();
  };
  shard(w / 2, 20, 5);
  shard(w / 2 - 5, 12, 3);
  shard(w / 2 + 5, 14, 3);
  ctx.restore();
  return canvas;
}

export function makeBookshelfTexture(accent: string): HTMLCanvasElement {
  const w = 20;
  const h = 26;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#3a2a1f";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#241a13";
  for (let y = 3; y < h; y += 6) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
    const rand = mulberry32(y * 91);
    for (let x = 1; x < w - 1; x += 2) {
      ctx.fillStyle = shade(accent, rand() * 0.6 - 0.2);
      ctx.fillRect(x, y - 4, 1.4, 3.5);
    }
  }
  return canvas;
}

export function makeFountainTexture(accent: string): HTMLCanvasElement {
  const size = 40;
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext("2d")!;
  const cx = size / 2;
  const cy = size / 2;
  ctx.fillStyle = shade(VOID_800, -0.1);
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = shade(VOID_600, 0.1);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.save();
  ctx.shadowColor = accent;
  ctx.shadowBlur = 10;
  ctx.fillStyle = mix(accent, "#ffffff", 0.2);
  ctx.beginPath();
  ctx.arc(cx, cy, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = shade(VOID_800, -0.3);
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fill();
  return canvas;
}

export function makeBushTexture(seed: number): HTMLCanvasElement {
  const w = 16;
  const h = 12;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext("2d")!;
  const rand = mulberry32(seed * 17 + 3);
  const leaf = mix("#173d24", "#2a6b3f", rand() * 0.5);
  ctx.fillStyle = shade(leaf, -0.2);
  ctx.beginPath();
  ctx.ellipse(w / 2, h - 4, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = leaf;
  ctx.beginPath();
  ctx.ellipse(w / 2 - 2, h - 6, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = shade(leaf, 0.25);
  ctx.beginPath();
  ctx.ellipse(w / 2 - 3, h - 7, 2, 1.6, 0, 0, Math.PI * 2);
  ctx.fill();
  return canvas;
}

export function makeRockTexture(seed: number): HTMLCanvasElement {
  const w = 12;
  const h = 9;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext("2d")!;
  const rand = mulberry32(seed * 23 + 9);
  const base = mix("#2a2a34", "#3a3a48", rand() * 0.5);
  ctx.fillStyle = shade(base, -0.2);
  ctx.beginPath();
  ctx.moveTo(1, h - 1);
  ctx.lineTo(0, h - 4);
  ctx.lineTo(3, h - 8);
  ctx.lineTo(8, h - 9);
  ctx.lineTo(w - 1, h - 5);
  ctx.lineTo(w - 2, h - 1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = shade(base, 0.25);
  ctx.beginPath();
  ctx.moveTo(3, h - 6);
  ctx.lineTo(7, h - 8);
  ctx.lineTo(6, h - 5);
  ctx.closePath();
  ctx.fill();
  return canvas;
}

export function makeFlowerTexture(seed: number): HTMLCanvasElement {
  const w = 8;
  const h = 8;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext("2d")!;
  const rand = mulberry32(seed * 29 + 5);
  const petal = pick(["#ff8fd6", "#ffc857", "#b083ff", "#6dff8f", "#ff7a45"], rand);
  ctx.fillStyle = "#173d24";
  ctx.fillRect(w / 2 - 0.5, h / 2, 1, h / 2 - 1);
  ctx.fillStyle = petal;
  for (const [dx, dy] of [
    [-1.6, 0],
    [1.6, 0],
    [0, -1.6],
    [0, 1.6],
  ]) {
    ctx.beginPath();
    ctx.arc(w / 2 + dx, h / 2 - 1 + dy, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#ffe98a";
  ctx.beginPath();
  ctx.arc(w / 2, h / 2 - 1, 1, 0, Math.PI * 2);
  ctx.fill();
  return canvas;
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

export function makeFenceTexture(): HTMLCanvasElement {
  const w = 24;
  const h = 14;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext("2d")!;
  const wood = "#5a4632";
  ctx.fillStyle = wood;
  ctx.fillRect(0, 4, w, 2);
  ctx.fillRect(0, 9, w, 2);
  for (let x = 1; x < w; x += 6) {
    ctx.fillStyle = shade(wood, -0.15);
    ctx.fillRect(x, 2, 2, h - 2);
  }
  return canvas;
}

export function makeStallTexture(accent: string): HTMLCanvasElement {
  const w = 26;
  const h = 22;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext("2d")!;
  const canopy = shade(accent, -0.05);
  ctx.fillStyle = canopy;
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.lineTo(w / 2, 0);
  ctx.lineTo(w, 6);
  ctx.lineTo(w, 9);
  ctx.lineTo(0, 9);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = shade(canopy, -0.2);
  for (let x = 0; x < w; x += 5) ctx.fillRect(x, 7, 2.5, 2);
  ctx.fillStyle = "#5a4632";
  ctx.fillRect(2, 9, w - 4, 9);
  ctx.fillStyle = shade("#5a4632", 0.15);
  ctx.fillRect(2, 9, w - 4, 2);
  ctx.fillStyle = "#241a13";
  ctx.fillRect(3, 11, 3, 9);
  ctx.fillRect(w - 6, 11, 3, 9);
  return canvas;
}

/** The neutral "wilderness" ground that fills the space between districts -- night grass/dirt,
 * not a debug void, so the world reads as continuous. */
export function makeWildTerrainTile(variant: number): HTMLCanvasElement {
  const canvas = makeCanvas(TILE_PX, TILE_PX);
  const ctx = canvas.getContext("2d")!;
  const rand = mulberry32(7000 + variant * 41);
  const base = mix("#0e1a13", "#141f16", variant * 0.3);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, TILE_PX, TILE_PX);
  mottle(ctx, rand, shade(base, 0.15), 6, TILE_PX, TILE_PX);
  mottle(ctx, rand, shade(base, -0.12), 5, TILE_PX, TILE_PX);
  if (rand() < 0.5) {
    ctx.fillStyle = shade(base, 0.22);
    const x = rand() * TILE_PX;
    const y = rand() * TILE_PX;
    ctx.fillRect(x, y, 1, 2);
    ctx.fillRect(x + 1.5, y + 0.5, 1, 2);
  }
  return canvas;
}

export function makeMetaWildTerrain(grid = 6): HTMLCanvasElement {
  const variants = [0, 1, 2, 3].map((v) => makeWildTerrainTile(v));
  const size = TILE_PX * grid;
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext("2d")!;
  const rand = mulberry32(4242);
  for (let gy = 0; gy < grid; gy++) {
    for (let gx = 0; gx < grid; gx++) {
      ctx.drawImage(variants[Math.floor(rand() * variants.length)], gx * TILE_PX, gy * TILE_PX);
    }
  }
  return canvas;
}

export function makeSkylineTexture(w: number, h: number, accent: string): HTMLCanvasElement {
  const canvas = makeCanvas(Math.round(w), Math.round(h));
  const ctx = canvas.getContext("2d")!;
  const rand = mulberry32(9001);
  let x = 0;
  while (x < w) {
    const bw = 14 + rand() * 22;
    const bh = h * (0.3 + rand() * 0.55);
    const tone = mix(VOID_900, VOID_700, rand() * 0.5);
    ctx.fillStyle = tone;
    ctx.fillRect(x, h - bh, bw, bh);
    for (let wy = h - bh + 4; wy < h - 4; wy += 6) {
      for (let wx = x + 2; wx < x + bw - 2; wx += 5) {
        if (rand() < 0.35) {
          ctx.fillStyle = rand() < 0.5 ? accent : "#ffc857";
          ctx.globalAlpha = 0.6;
          ctx.fillRect(wx, wy, 2, 2);
          ctx.globalAlpha = 1;
        }
      }
    }
    x += bw + 2;
  }
  return canvas;
}

// ---------------------------------------------------------------------------
// Characters
// ---------------------------------------------------------------------------

// 12 x 16 grids: '1' = accent (torso/head panel), '2' = pale highlight (face/visor/core glow),
// '3' = dark pants/boots. A proper head+torso+legs silhouette per variant, not an abstract blob.
const BASE_PATTERNS: Record<SpriteVariant, string[]> = {
  runner: [
    "....2222....",
    "...222222...",
    "...211112...",
    "...222222...",
    "....1111....",
    "..11111111..",
    ".1111111111.",
    ".1111111111.",
    ".1.111111.1.",
    "..11111111..",
    "...3.11.3...",
    "...3.11.3...",
    "...3....3...",
    "...3....3...",
    "...3....3...",
    "..33....33..",
  ],
  sentinel: [
    "....1111....",
    "...222222...",
    "..22222222..",
    "..21212121..",
    "..22222222..",
    "...222222...",
    "..11111111..",
    ".1111111111.",
    ".1111111111.",
    "..11111111..",
    "...3.11.3...",
    "...3.11.3...",
    "...3....3...",
    "...3....3...",
    "...3....3...",
    "..33....33..",
  ],
  construct: [
    "...222222...",
    "..22222222..",
    "..21222212..",
    "..22222222..",
    "..11111111..",
    ".1111111111.",
    ".1122222211.",
    ".1111111111.",
    "..11111111..",
    "...3.11.3...",
    "...3.11.3...",
    "...3....3...",
    "...3....3...",
    "...3....3...",
    "...3....3...",
    "..33....33..",
  ],
  orb: [
    "....1111....",
    "..11111111..",
    ".1122222211.",
    "112222222211",
    "112222222211",
    "112222222211",
    ".1122222211.",
    "..11111111..",
    "....1111....",
    "....2..2....",
    "...2....2...",
    "..2......2..",
    "...2....2...",
    "....2..2....",
    "............",
    "............",
  ],
  wisp: [
    "...111111...",
    "..11111111..",
    ".1112222111.",
    ".1112222111.",
    ".1112222111.",
    "..11111111..",
    "...111111...",
    "....1111....",
    "....1..1....",
    "...1....1...",
    "...1....1...",
    "..1......1..",
    "..1......1..",
    ".1........1.",
    "............",
    "............",
  ],
};

const FLOATERS: SpriteVariant[] = ["orb", "wisp"];

/** A small topping layer drawn over the base silhouette so agents sharing a body variant still
 * read as distinct individuals, not just recolors. Confined to a single extra row above the head
 * (r=-1) so it can never bleed into a neighboring frame on the sprite sheet. */
export type Accessory = "none" | "hood" | "antenna" | "visor" | "hairTuft";
export const ACCESSORY_BY_SEED: Accessory[] = ["none", "hood", "antenna", "visor", "hairTuft"];

function accessoryCells(accessory: Accessory): { r: number; c: number; ch: "1" | "2" | "3" }[] {
  switch (accessory) {
    case "hood":
      return [
        { r: -1, c: 4, ch: "3" },
        { r: -1, c: 5, ch: "3" },
        { r: -1, c: 6, ch: "3" },
        { r: -1, c: 7, ch: "3" },
        { r: 4, c: 2, ch: "3" },
        { r: 5, c: 2, ch: "3" },
        { r: 4, c: 9, ch: "3" },
        { r: 5, c: 9, ch: "3" },
      ];
    case "antenna":
      return [
        { r: -1, c: 5, ch: "3" },
        { r: -1, c: 6, ch: "2" },
      ];
    case "visor":
      return [
        { r: 2, c: 4, ch: "3" },
        { r: 2, c: 5, ch: "3" },
        { r: 2, c: 6, ch: "3" },
        { r: 2, c: 7, ch: "3" },
      ];
    case "hairTuft":
      return [
        { r: -1, c: 4, ch: "2" },
        { r: -1, c: 5, ch: "1" },
        { r: -1, c: 6, ch: "1" },
        { r: -1, c: 7, ch: "2" },
      ];
    default:
      return [];
  }
}

function drawPatternFrame(
  ctx: CanvasRenderingContext2D,
  pattern: string[],
  opts: {
    originX: number;
    originY: number;
    cellW: number;
    cellH: number;
    accent: string;
    direction: Direction;
    animPhase: number;
    walking: boolean;
    float: boolean;
    accessory?: Accessory;
  },
) {
  const rows = pattern.length;
  const cols = pattern[0]?.length ?? CHAR_GRID_COLS;
  const widthScale = opts.direction === "side" ? 0.66 : 1;
  const sideInset = ((1 - widthScale) * cols) / 2;

  const bob = opts.float
    ? Math.round(Math.sin(opts.animPhase) * 1.4)
    : opts.walking
      ? (Math.abs(((opts.animPhase / (Math.PI * 2)) % 1) - 0.5) < 0.25 ? -1 : 0)
      : Math.sin(opts.animPhase) > 0
        ? -1
        : 0;

  const cells: { px: number; py: number; color: string; glow: boolean }[] = [];
  const addCell = (r: number, c: number, ch: string) => {
    let isHighlight = ch === "2";
    if (opts.direction === "up" && !opts.float && r <= 3) isHighlight = false;

    let px = opts.direction === "side" ? sideInset + c * widthScale : c;
    const py = r + bob;

    if (opts.walking && r >= CHAR_LEG_ROW_START && !opts.float) {
      const side = c < cols / 2 ? 1 : -1;
      px += Math.sin(opts.animPhase) * side * 0.8;
    }

    const color = ch === "3" ? CHAR_PANTS_COLOR : isHighlight ? "#ffffff" : opts.accent;
    cells.push({ px, py, color, glow: isHighlight });
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = pattern[r][c];
      if (ch === ".") continue;
      addCell(r, c, ch);
    }
  }

  if (opts.accessory && opts.accessory !== "none" && !opts.float) {
    for (const cell of accessoryCells(opts.accessory)) addCell(cell.r, cell.c, cell.ch);
  }

  // Outline pass first so the whole silhouette reads clearly against any background tile.
  ctx.fillStyle = CHAR_OUTLINE_COLOR;
  for (const cell of cells) {
    ctx.fillRect(opts.originX + cell.px * opts.cellW - 1, opts.originY + cell.py * opts.cellH - 1, opts.cellW + 2, opts.cellH + 2);
  }

  for (const cell of cells) {
    ctx.fillStyle = cell.color;
    if (cell.glow) {
      ctx.save();
      ctx.shadowColor = opts.accent;
      ctx.shadowBlur = 3;
    }
    ctx.fillRect(opts.originX + cell.px * opts.cellW, opts.originY + cell.py * opts.cellH, opts.cellW + 0.6, opts.cellH + 0.6);
    if (cell.glow) ctx.restore();
  }
}

export interface CharSheetInfo {
  canvas: HTMLCanvasElement;
  frameW: number;
  frameH: number;
  frames: Record<Direction, { idle: [number, number][]; walk: [number, number][] }>;
}

const DIRECTIONS: Direction[] = ["down", "up", "side"];
const IDLE_FRAMES = 2;
const WALK_FRAMES = 4;
const COLS = IDLE_FRAMES + WALK_FRAMES;

export function buildCharacterSheet(variant: SpriteVariant, accent: string, accessory: Accessory = "none"): CharSheetInfo {
  const pattern = BASE_PATTERNS[variant];
  const float = FLOATERS.includes(variant);
  const cellW = CHAR_CELL_W / CHAR_GRID_COLS;
  const cellH = (CHAR_CELL_H - 6) / CHAR_GRID_ROWS;

  const sheetW = CHAR_CELL_W * COLS;
  const sheetH = CHAR_CELL_H * DIRECTIONS.length;
  const canvas = makeCanvas(sheetW, sheetH);
  const ctx = canvas.getContext("2d")!;

  const frames: CharSheetInfo["frames"] = { down: { idle: [], walk: [] }, up: { idle: [], walk: [] }, side: { idle: [], walk: [] } };

  DIRECTIONS.forEach((direction, rowIdx) => {
    for (let col = 0; col < COLS; col++) {
      const originX = col * CHAR_CELL_W + 2;
      const originY = rowIdx * CHAR_CELL_H + 5;
      const isIdle = col < IDLE_FRAMES;
      const animPhase = isIdle ? (col === 0 ? 0 : Math.PI) : ((col - IDLE_FRAMES) / WALK_FRAMES) * Math.PI * 2;
      drawPatternFrame(ctx, pattern, {
        originX,
        originY,
        cellW,
        cellH,
        accent,
        direction,
        animPhase,
        walking: !isIdle,
        float,
        accessory,
      });
      const rect: [number, number] = [col * CHAR_CELL_W, rowIdx * CHAR_CELL_H];
      if (isIdle) frames[direction].idle.push(rect);
      else frames[direction].walk.push(rect);
    }
  });

  return { canvas, frameW: CHAR_CELL_W, frameH: CHAR_CELL_H, frames };
}

export function sheetToTextures(sheet: CharSheetInfo): Record<Direction, { idle: Texture[]; walk: Texture[] }> {
  const base = Texture.from(sheet.canvas);
  base.source.scaleMode = "nearest";
  const slice = (rect: [number, number]) =>
    new Texture({ source: base.source, frame: new Rectangle(rect[0], rect[1], sheet.frameW, sheet.frameH) });
  const out = {} as Record<Direction, { idle: Texture[]; walk: Texture[] }>;
  (Object.keys(sheet.frames) as Direction[]).forEach((dir) => {
    out[dir] = {
      idle: sheet.frames[dir].idle.map(slice),
      walk: sheet.frames[dir].walk.map(slice),
    };
  });
  return out;
}

export function makePortraitCanvas(variant: SpriteVariant, accent: string, size = 48, accessory: Accessory = "none"): HTMLCanvasElement {
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext("2d")!;
  const pattern = BASE_PATTERNS[variant];
  const cellW = size / CHAR_GRID_COLS;
  const cellH = size / CHAR_GRID_ROWS;
  drawPatternFrame(ctx, pattern, {
    originX: 0,
    originY: cellH,
    cellW,
    cellH,
    accent,
    direction: "down",
    animPhase: 0,
    walking: false,
    float: FLOATERS.includes(variant),
    accessory,
  });
  return canvas;
}

const portraitCache = new Map<string, string>();

export function getPortraitDataURL(variant: SpriteVariant, accent: string, size = 48, accessory: Accessory = "none"): string {
  const key = `${variant}:${accent}:${size}:${accessory}`;
  const cached = portraitCache.get(key);
  if (cached) return cached;
  const url = makePortraitCanvas(variant, accent, size, accessory).toDataURL();
  portraitCache.set(key, url);
  return url;
}

export { texFromCanvas };
