import { Texture } from "pixi.js";
import type { SpriteVariant, ZoneId } from "@/types";
import {
  type Accessory,
  buildCharacterSheet,
  makeBenchTexture,
  makeBookshelfTexture,
  makeBuildingTexture,
  makeBushTexture,
  makeCrystalTexture,
  makeFenceTexture,
  makeFlowerTexture,
  makeFountainTexture,
  makeLampTexture,
  makeMetaFloorTile,
  makeMetaWildTerrain,
  makePathTile,
  makeRockTexture,
  makeSkylineTexture,
  makeStallTexture,
  makeTreeTexture,
  sheetToTextures,
  texFromCanvas,
  type Ambience,
  type Direction,
  type RoomVisualState,
} from "./textures";

export type CharTextureSet = Record<Direction, { idle: Texture[]; walk: Texture[] }>;

/** Caches every procedurally generated texture so each unique (variant, accent, state, ...) is only drawn once. */
export class SpriteManager {
  private characterCache = new Map<string, CharTextureSet>();
  private floorCache = new Map<string, Texture>();
  private pathCache: Texture[] | null = null;
  private buildingCache = new Map<string, Texture>();
  private propCache = new Map<string, Texture>();
  private wildTerrain: Texture | null = null;

  getCharacterSet(variant: SpriteVariant, accent: string, accessory: Accessory = "none"): CharTextureSet {
    const key = `${variant}:${accent}:${accessory}`;
    const existing = this.characterCache.get(key);
    if (existing) return existing;
    const sheet = buildCharacterSheet(variant, accent, accessory);
    const set = sheetToTextures(sheet);
    this.characterCache.set(key, set);
    return set;
  }

  getMetaFloorTile(ambience: Ambience, accent: string, zoneId?: ZoneId): Texture {
    const key = `meta:${ambience}:${accent}:${zoneId ?? ""}`;
    const existing = this.floorCache.get(key);
    if (existing) return existing;
    const tex = texFromCanvas(makeMetaFloorTile(ambience, accent, zoneId));
    this.floorCache.set(key, tex);
    return tex;
  }

  getWildTerrain(): Texture {
    if (this.wildTerrain) return this.wildTerrain;
    this.wildTerrain = texFromCanvas(makeMetaWildTerrain());
    return this.wildTerrain;
  }

  getPathTiles(): Texture[] {
    if (this.pathCache) return this.pathCache;
    this.pathCache = [0, 1, 2].map((v) => texFromCanvas(makePathTile(v)));
    return this.pathCache;
  }

  getBuildingTexture(roomId: string, w: number, h: number, accent: string, state: RoomVisualState, seed: number, zoneId?: ZoneId): Texture {
    const key = `${roomId}:${Math.round(w)}x${Math.round(h)}:${state}`;
    const existing = this.buildingCache.get(key);
    if (existing) return existing;
    const tex = texFromCanvas(makeBuildingTexture(w, h, accent, state, seed, zoneId));
    this.buildingCache.set(key, tex);
    return tex;
  }

  getTree(seed: number): Texture {
    return this.cachedProp(`tree:${seed}`, () => makeTreeTexture(seed));
  }

  getLamp(): Texture {
    return this.cachedProp("lamp", () => makeLampTexture());
  }

  getBench(): Texture {
    return this.cachedProp("bench", () => makeBenchTexture());
  }

  getCrystal(accent: string): Texture {
    return this.cachedProp(`crystal:${accent}`, () => makeCrystalTexture(accent));
  }

  getBookshelf(accent: string): Texture {
    return this.cachedProp(`shelf:${accent}`, () => makeBookshelfTexture(accent));
  }

  getFountain(accent: string): Texture {
    return this.cachedProp(`fountain:${accent}`, () => makeFountainTexture(accent));
  }

  getSkyline(w: number, h: number, accent: string): Texture {
    return this.cachedProp(`skyline:${Math.round(w)}x${Math.round(h)}:${accent}`, () => makeSkylineTexture(w, h, accent));
  }

  getBush(seed: number): Texture {
    return this.cachedProp(`bush:${seed}`, () => makeBushTexture(seed));
  }

  getRock(seed: number): Texture {
    return this.cachedProp(`rock:${seed}`, () => makeRockTexture(seed));
  }

  getFlowerPatch(seed: number): Texture {
    return this.cachedProp(`flower:${seed}`, () => makeFlowerTexture(seed));
  }

  getFence(): Texture {
    return this.cachedProp("fence", () => makeFenceTexture());
  }

  getStall(accent: string): Texture {
    return this.cachedProp(`stall:${accent}`, () => makeStallTexture(accent));
  }

  private cachedProp(key: string, make: () => HTMLCanvasElement): Texture {
    const existing = this.propCache.get(key);
    if (existing) return existing;
    const tex = texFromCanvas(make());
    this.propCache.set(key, tex);
    return tex;
  }
}
