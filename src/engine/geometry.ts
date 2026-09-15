import type { Room, WorldZone, ZoneId } from "@/types";

export const BRIDGES: [ZoneId, ZoneId][] = [
  ["rooftop", "commons"],
  ["commons", "lab"],
  ["commons", "arena"],
  ["commons", "lounge"],
  ["commons", "garden"],
  ["lab", "deep"],
  ["arena", "lounge"],
  ["deep", "archive"],
  ["garden", "archive"],
  ["lounge", "archive"],
];

/** World is authored in percent (0-100) space in the data files; this is the pixel size it maps onto. */
export const WORLD_WIDTH = 2600;
export const WORLD_HEIGHT = 1700;
export const TILE_SIZE = 32;

export interface PixelBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function zoneBoundsPx(zone: WorldZone): PixelBounds {
  return {
    x: (zone.bounds.x / 100) * WORLD_WIDTH,
    y: (zone.bounds.y / 100) * WORLD_HEIGHT,
    w: (zone.bounds.w / 100) * WORLD_WIDTH,
    h: (zone.bounds.h / 100) * WORLD_HEIGHT,
  };
}

export function zoneCenterPx(zone: WorldZone): { x: number; y: number } {
  const b = zoneBoundsPx(zone);
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
}

export function roomBoundsPx(zone: WorldZone, room: Room): PixelBounds {
  const zb = zoneBoundsPx(zone);
  return {
    x: zb.x + (room.bounds.x / 100) * zb.w,
    y: zb.y + (room.bounds.y / 100) * zb.h,
    w: (room.bounds.w / 100) * zb.w,
    h: (room.bounds.h / 100) * zb.h,
  };
}

export function roomCenterPx(zone: WorldZone, room: Room): { x: number; y: number } {
  const rb = roomBoundsPx(zone, room);
  return { x: rb.x + rb.w / 2, y: rb.y + rb.h / 2 };
}

/** Anchor point where an agent stands when "at" this room (its door, bottom-center of footprint). */
export function roomDoorPx(zone: WorldZone, room: Room): { x: number; y: number } {
  const rb = roomBoundsPx(zone, room);
  return { x: rb.x + rb.w / 2, y: rb.y + rb.h - Math.min(24, rb.h * 0.12) };
}

/** A standing spot inside a room's footprint for the nth occupant (small spread so they don't overlap). */
export function roomSlotPx(zone: WorldZone, room: Room, index: number): { x: number; y: number } {
  const rb = roomBoundsPx(zone, room);
  const cols = 3;
  const col = index % cols;
  const row = Math.floor(index / cols);
  return {
    x: rb.x + rb.w * (0.28 + col * 0.22),
    y: rb.y + rb.h * (0.62 + row * 0.16),
  };
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(bx - ax, by - ay);
}

export function randomZonePoint(zone: WorldZone, rand: () => number): { x: number; y: number } {
  const b = zoneBoundsPx(zone);
  const margin = Math.min(b.w, b.h) * 0.12;
  return {
    x: b.x + margin + rand() * (b.w - margin * 2),
    y: b.y + margin + rand() * (b.h - margin * 2),
  };
}
