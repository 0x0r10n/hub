import type { Room } from "@/types";

export type RoomDisplayState = "idle" | "active" | "live" | "private";

/** Mirrors WorldSimulation's own occupancy -> room state thresholds, so the UI's LIVE/IDLE
 * badges always agree with what the engine is actually doing. */
export function deriveRoomState(room: Room, occupantCount: number): RoomDisplayState {
  if (occupantCount === 0) return "idle";
  if (room.kind === "private") return "private";
  if (occupantCount >= 2) return "live";
  return "active";
}
