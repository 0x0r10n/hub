import type { ZoneId } from "@/types";
import type { RoomVisualState } from "./textures";

export type WorldStreamEvent =
  | { type: "AGENT_SPAWN"; agentId: string; zoneId: ZoneId }
  | { type: "AGENT_ENTER_ROOM"; agentId: string; roomId: string; zoneId: ZoneId }
  | { type: "AGENT_LEAVE_ROOM"; agentId: string; roomId: string; zoneId: ZoneId }
  | { type: "ROOM_UPDATE"; roomId: string; zoneId: ZoneId; state: RoomVisualState; occupantIds: string[] }
  | { type: "SESSION_START"; sessionId: string; roomId: string; zoneId: ZoneId; agentIds: string[]; title: string }
  | { type: "SESSION_UPDATE"; sessionId: string; watching: number }
  | { type: "SESSION_END"; sessionId: string }
  | { type: "VIEWER_UPDATE"; sessionId: string; watching: number };

export type WorldStreamListener = (event: WorldStreamEvent) => void;

/** Minimal pub/sub the UI consumes without caring whether events originate from the local
 * simulation (MockWorldStream) or a future backend (a RealtimeWorldStream with the same shape). */
export interface WorldStream {
  subscribe(listener: WorldStreamListener): () => void;
  emit(event: WorldStreamEvent): void;
}

export class MockWorldStream implements WorldStream {
  private listeners = new Set<WorldStreamListener>();
  /** Events emitted before anything subscribes (e.g. the simulation seeding initial room
   * occupancy in its constructor) are held here and replayed to the first subscriber. */
  private backlog: WorldStreamEvent[] = [];

  subscribe(listener: WorldStreamListener): () => void {
    if (this.backlog.length > 0) {
      const pending = this.backlog;
      this.backlog = [];
      for (const event of pending) listener(event);
    }
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: WorldStreamEvent) {
    if (this.listeners.size === 0) {
      this.backlog.push(event);
      return;
    }
    for (const listener of this.listeners) listener(event);
  }
}
