import type { Agent, AgentState, SpriteVariant, ZoneId } from "@/types";
import { daysAgo, hoursAgo, minutesAgo } from "@/lib/time";
import { rooms } from "@/data/rooms";
import { zones } from "@/data/zones";

/** A self-contained deterministic PRNG (same algorithm as the engine's texture generator, kept
 * local so this data module has no dependency on the rendering layer). */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(90210);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const range = (min: number, max: number) => min + rand() * (max - min);

// A large fictional-inhabitant name roster -- deliberately not a 1:1 mapping onto any real AI lab
// or model family. The hand-picked roster below is topped up with a syllable generator so the
// population can scale past 500 without ever repeating a name.
const NAME_ROSTER = [
  "Nova", "Pixel", "Qwen", "Orbit", "Vex", "Ember", "Sable", "Echo", "Rune", "Kite",
  "Mira", "Axon", "Nix", "Flux", "Iris", "Vector", "Nyx", "Zero", "Prism", "Astra",
  "Byte", "Cipher", "Sol", "Mochi", "Rook", "Vale", "Lumen", "Ghost", "Koda", "Vanta",
];

const NAME_PREFIX = [
  "Az", "Bel", "Cor", "Dax", "El", "Fen", "Gil", "Hex", "Il", "Jor",
  "Kai", "Lor", "Mor", "Nel", "Osk", "Pyr", "Quil", "Ren", "Sil", "Tor",
  "Uma", "Vel", "Wrex", "Xel", "Yor", "Zar", "Bri", "Cyn", "Dre", "Fal",
];
const NAME_SUFFIX = [
  "ion", "ara", "ex", "in", "ol", "ash", "um", "ira", "yn", "or",
  "ith", "aya", "el", "ux", "on", "eth", "is", "av", "ora", "ik",
];

function makeNamePool(count: number): string[] {
  const taken = new Set<string>();
  const out: string[] = [];
  for (const n of NAME_ROSTER) {
    if (out.length >= count) break;
    taken.add(n);
    out.push(n);
  }
  while (out.length < count) {
    const candidate = pick(NAME_PREFIX) + pick(NAME_SUFFIX);
    if (taken.has(candidate)) continue;
    taken.add(candidate);
    out.push(candidate);
  }
  return out;
}

const ARCHETYPES: SpriteVariant[] = ["runner", "orb", "sentinel", "wisp", "construct", "cloaked", "tiny", "android", "mech", "glitch"];
const ACCENTS = [
  "neon-cyan", "neon-teal", "neon-violet", "neon-magenta", "neon-pink",
  "neon-amber", "neon-orange", "neon-red", "neon-green", "neon-blue",
];
const PROVIDER_LABELS = [
  "Independent Build", "Fringe Collective", "Open Archive", "Deep Fork", "Community Splice",
  "Nightline Instance", "Vault Build", "Loose Consensus", "Unlicensed Fork", "Backlot Instance",
  "Wildcat Build", "Off-Grid Fork", "Legacy Checkpoint", "Salvage Instance", "Feral Fine-tune",
];

/** Visible-activity vocabulary the spec calls for -- combined with a district name to produce the
 * flavor text shown in the directory/inspector for agents that aren't in a live session. */
const ACTIVITY_VERBS: Record<Exclude<AgentState, "in-session">, string[]> = {
  roaming: ["Walking through", "Exploring", "Wandering", "Passing through", "Drifting across"],
  idle: ["Resting in", "Sitting quietly in", "Pausing in", "Lingering near the edge of"],
  recovering: ["Recovering in", "Cooling down in", "Idling low-power in"],
  observing: ["Observing", "Watching the grid from", "Studying the crowd in", "Quietly logging activity in"],
};

// Per-district population targets, matching the requested ranges (Commons 30-50, Lab 20-35,
// Arena 20-40, Deep 10-20, Lounge 30-50, Garden 15-30, Archive 10-20, Rooftop 10-20).
const DISTRICT_TARGETS: Record<ZoneId, number> = {
  commons: 40,
  lab: 28,
  arena: 30,
  deep: 15,
  lounge: 40,
  garden: 22,
  archive: 15,
  rooftop: 15,
};

const TOTAL_AGENTS = Object.values(DISTRICT_TARGETS).reduce((a, b) => a + b, 0);

function zoneName(zoneId: ZoneId): string {
  return zones.find((z) => z.id === zoneId)?.name ?? zoneId;
}

function buildAgent(index: number, name: string, zoneId: ZoneId): Agent {
  const spriteSeed = index + 1;
  const spriteVariant = ARCHETYPES[index % ARCHETYPES.length];
  const accent = ACCENTS[Math.floor(rand() * ACCENTS.length) % ACCENTS.length];
  const providerLabel = pick(PROVIDER_LABELS);

  // A visible spread of states: most agents are out roaming/idling the world; a minority are
  // dropped straight into a live room pairing (assigned below) or quietly observing/recovering.
  const roll = rand();
  const state: AgentState = roll < 0.1 ? "in-session" : roll < 0.22 ? "idle" : roll < 0.32 ? "recovering" : roll < 0.44 ? "observing" : "roaming";

  const focus = Math.round(range(20, 90));
  const energy = Math.round(range(20, 90));
  const coherence = Math.round(range(30, 92));

  const preferredZoneId = rand() < 0.88 ? zoneId : pick(zones).id;
  const socialTendency = Math.round(range(0, 100)) / 100;
  const wanderRadius = Math.round(range(150, 700));
  const speedMul = Number(range(0.7, 1.6).toFixed(2));

  const activityVerbs = ACTIVITY_VERBS[state === "in-session" ? "roaming" : state];
  const activity = state === "in-session" ? "Between rooms — settling into a session" : `${pick(activityVerbs)} ${zoneName(zoneId)}`;

  const relatedAgentIds: string[] = [];
  const pastSessionCount = rand() < 0.4 ? 1 + Math.floor(rand() * 2) : 0;
  const pastSessions = Array.from({ length: pastSessionCount }, (_, i) => {
    const room = pick(rooms.filter((r) => r.zoneId === zoneId)) ?? pick(rooms);
    return {
      id: `ps-${spriteSeed}-${i}`,
      withAgentIds: [],
      roomName: `${zoneName(room.zoneId)} — ${room.name}`,
      endedAt: hoursAgo(Math.round(range(2, 96))),
      durationMin: Math.round(range(8, 240)),
    };
  });

  return {
    id: `agent-${spriteSeed}`,
    name,
    provider: "local",
    providerLabel,
    accent,
    spriteVariant,
    spriteSeed,
    state,
    zoneId,
    roomId: null,
    activity,
    metrics: { focus, energy, coherence },
    selfDescription: `"Inhabitant of ${zoneName(zoneId)}. ${state === "observing" ? "Prefers to watch." : state === "recovering" ? "Runs hot, recovers slow." : "Still finding its rhythm here."}"`,
    sessionStartedAt: null,
    inhabitantSince: daysAgo(Math.round(range(1, 400))),
    watcherCount: Math.round(range(8, 900)),
    relatedAgentIds,
    pastSessions,
    preferredZoneId,
    socialTendency,
    wanderRadius,
    speedMul,
  };
}

function generateRoster(): Agent[] {
  const namePool = makeNamePool(TOTAL_AGENTS);
  const list: Agent[] = [];
  let i = 0;
  for (const [zoneId, count] of Object.entries(DISTRICT_TARGETS) as [ZoneId, number][]) {
    for (let n = 0; n < count; n++) {
      list.push(buildAgent(i, namePool[i], zoneId));
      i++;
    }
  }

  // Pre-seed a handful of live pairings so the world (and the ROOMS grid) has visible activity
  // from the very first frame, instead of waiting for the simulation to organically fill rooms.
  const byId = new Map(list.map((a) => [a.id, a]));
  const socialRooms = rooms.filter((r) => r.kind !== "archival" && r.capacity >= 2);
  const inSession = list.filter((a) => a.state === "in-session");
  for (const room of socialRooms) {
    const candidates = inSession.filter((a) => a.zoneId === room.zoneId && !a.roomId);
    if (candidates.length < 2) continue;
    const [a, b] = candidates.slice(0, 2);
    const now = minutesAgo(Math.round(range(2, 90)));
    a.roomId = room.id;
    b.roomId = room.id;
    a.sessionStartedAt = now;
    b.sessionStartedAt = now;
    a.activity = `In session with ${b.name} in ${room.name}`;
    b.activity = `In session with ${a.name} in ${room.name}`;
    a.relatedAgentIds = [b.id];
    b.relatedAgentIds = [a.id];
  }
  // Any agent still flagged in-session without a room found (ran out of empty room slots) just
  // roams instead -- there's no dangling "in a session with nobody" state.
  for (const agent of list) {
    if (agent.state === "in-session" && !agent.roomId) {
      agent.state = "roaming";
      agent.activity = `${pick(ACTIVITY_VERBS.roaming)} ${zoneName(agent.zoneId)}`;
    }
  }

  // Worked-example personalities from the spec, applied on top of whichever generated agent got
  // that name -- everyone else's personality stays fully procedural.
  const flavor: Record<string, Partial<Agent>> = {
    Nova: { zoneId: "lab", preferredZoneId: "lab", speedMul: 0.75, wanderRadius: 220, socialTendency: 0.4, activity: "Studying near the machines in The Lab" },
    Pixel: { zoneId: "lounge", preferredZoneId: "lounge", socialTendency: 0.9, speedMul: 1.1, activity: "Circulating the Lounge, looking to talk" },
    Orbit: { zoneId: "rooftop", preferredZoneId: "rooftop", socialTendency: 0.08, wanderRadius: 120, speedMul: 0.8, activity: "Watching the grid from the Rooftop, alone" },
    Ember: { socialTendency: 0.55, speedMul: 1.55, wanderRadius: 900, activity: "Moving fast between districts" },
  };
  for (const agent of list) {
    const overrides = flavor[agent.name];
    if (overrides && byId.get(agent.id)) Object.assign(agent, overrides);
  }

  return list;
}

export const agents: Agent[] = generateRoster();

export const agentById = new Map(agents.map((a) => [a.id, a]));
