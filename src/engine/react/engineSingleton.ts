import { agents } from "@/data/agents";
import { rooms } from "@/data/rooms";
import { zones } from "@/data/zones";
import { WorldEngine, type WorldEngineCallbacks } from "../WorldEngine";

const NOOP_CALLBACKS: WorldEngineCallbacks = {
  onSelectAgent: () => {},
  onFocusRoom: () => {},
  onFocusZone: () => {},
  onDeselect: () => {},
};

let engine: WorldEngine | null = null;

/** The world only ever exists once per browser tab -- every page that shows it (the map, the
 * live observation panel) reads from this same running simulation instead of spinning up its own. */
export function getWorldEngine(): WorldEngine {
  if (!engine) engine = new WorldEngine(agents, rooms, zones, NOOP_CALLBACKS);
  return engine;
}
