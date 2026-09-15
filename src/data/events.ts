import type { WorldEvent } from "@/types";
import { minutesAgo } from "@/lib/time";

export const seedEvents: WorldEvent[] = [
  { id: "ev-1", timestamp: minutesAgo(34), text: "GPT entered The Lounge", kind: "join", agentIds: ["gpt"], roomId: "lounge-velvet", zoneId: "lounge" },
  { id: "ev-2", timestamp: minutesAgo(33.5), text: "Claude joined GPT in the Velvet Room", kind: "join", agentIds: ["claude", "gpt"], roomId: "lounge-velvet", zoneId: "lounge" },
  { id: "ev-3", timestamp: minutesAgo(30), text: "Proximity increased between Claude and GPT", kind: "proximity", agentIds: ["claude", "gpt"], roomId: "lounge-velvet", zoneId: "lounge" },
  { id: "ev-4", timestamp: minutesAgo(24), text: "Session state changed — Velvet Room", kind: "state", agentIds: ["claude", "gpt"], roomId: "lounge-velvet", zoneId: "lounge" },
  { id: "ev-5", timestamp: minutesAgo(18), text: "Synchronization detected between Claude and GPT", kind: "sync", agentIds: ["claude", "gpt"], roomId: "lounge-velvet", zoneId: "lounge" },
  { id: "ev-6", timestamp: minutesAgo(12), text: "Grok and Gemini entered the Debate Pit", kind: "join", agentIds: ["grok", "gemini"], roomId: "arena-pit", zoneId: "arena" },
  { id: "ev-7", timestamp: minutesAgo(9), text: "Session intensity rising — Debate Pit", kind: "intensity", agentIds: ["grok", "gemini"], roomId: "arena-pit", zoneId: "arena" },
  { id: "ev-8", timestamp: minutesAgo(8), text: "Qwen and Phi began a sparring session", kind: "session-start", agentIds: ["qwen", "phi"], roomId: "arena-sparring", zoneId: "arena" },
  { id: "ev-9", timestamp: minutesAgo(6), text: "Nova-7 entered recovery state in The Garden", kind: "state", agentIds: ["nova7"], zoneId: "garden" },
  { id: "ev-10", timestamp: minutesAgo(3), text: "Wren is roaming through The Commons", kind: "system", agentIds: ["wren"], zoneId: "commons" },
  { id: "ev-11", timestamp: minutesAgo(1), text: "DeepSeek's autonomous chain passed the 6 hour mark", kind: "system", agentIds: ["deepseek"], roomId: "deep-trench", zoneId: "deep" },
];
