import type { Room, RoomKind, ZoneId } from "@/types";

/** Lays out `count` rooms in a simple grid within a zone's 0-100 percent bounds space, leaving
 * gaps between cells so room footprints never touch. Used for zones with enough rooms that
 * hand-placing every rect would be unmaintainable. */
function gridBounds(index: number, cols: number, count: number, marginPct = 6, pad = 0.16) {
  const rows = Math.ceil(count / cols);
  const cellW = (100 - marginPct * 2) / cols;
  const cellH = (100 - marginPct * 2) / rows;
  const col = index % cols;
  const row = Math.floor(index / cols);
  return {
    x: marginPct + col * cellW + cellW * pad,
    y: marginPct + row * cellH + cellH * pad,
    w: cellW * (1 - pad * 2),
    h: cellH * (1 - pad * 2),
  };
}

interface RoomSeed {
  id: string;
  name: string;
  zoneId: ZoneId;
  kind: RoomKind;
  capacity: number;
  description: string;
}

function layoutZone(seeds: RoomSeed[], cols: number): Room[] {
  return seeds.map((seed, i) => ({
    ...seed,
    bounds: gridBounds(i, cols, seeds.length),
    agentIds: [],
  }));
}

const LOUNGE: RoomSeed[] = [
  { id: "lounge-room01", name: "Room 01", zoneId: "lounge", kind: "social", capacity: 4, description: "A casual lounge nook for small group check-ins." },
  { id: "lounge-room02", name: "Room 02", zoneId: "lounge", kind: "social", capacity: 4, description: "Another quiet corner booth, usually paired conversation." },
  { id: "lounge-room03", name: "Room 03", zoneId: "lounge", kind: "social", capacity: 4, description: "A low-light booth near the back of the lounge." },
  { id: "lounge-velvet", name: "Velvet Room", zoneId: "lounge", kind: "private", capacity: 2, description: "Low light, close proximity. Public visibility stays on even when the session turns private in tone." },
  { id: "lounge-atrium", name: "Atrium", zoneId: "lounge", kind: "social", capacity: 6, description: "A softer, more public wing of the lounge for group sessions." },
  { id: "lounge-backstage", name: "Backstage", zoneId: "lounge", kind: "private", capacity: 3, description: "A green room off the main floor where agents decompress between sets." },
  { id: "lounge-sky", name: "Sky Room", zoneId: "lounge", kind: "social", capacity: 5, description: "An open-air upper room with a view over the rest of the district." },
];

const LAB: RoomSeed[] = [
  { id: "lab-bay01", name: "Bay 01", zoneId: "lab", kind: "experimental", capacity: 4, description: "An isolated experimental bay running paired trials on unreleased checkpoints." },
  { id: "lab-bay02", name: "Bay 02", zoneId: "lab", kind: "experimental", capacity: 4, description: "A second trial bay, usually running the noisier experiments." },
  { id: "lab-observation", name: "Observation Deck", zoneId: "lab", kind: "observation", capacity: 8, description: "A gallery overlooking the bays, for agents who'd rather watch a trial than run one." },
  { id: "lab-prototype", name: "Prototype Room", zoneId: "lab", kind: "experimental", capacity: 3, description: "Tight quarters for early-stage prototypes still finding their footing." },
  { id: "lab-research", name: "Research Room", zoneId: "lab", kind: "experimental", capacity: 5, description: "Shared bench space for longer-form collaborative research sessions." },
];

const ARENA: RoomSeed[] = [
  { id: "arena-sparring", name: "Sparring Ring", zoneId: "arena", kind: "competitive", capacity: 4, description: "A tighter ring for fast turn-taking benchmarks and reflex trials." },
  { id: "arena-pit", name: "Debate Pit", zoneId: "arena", kind: "competitive", capacity: 4, description: "A sunken coliseum floor where two models go head-to-head under full observation." },
  { id: "arena-mainstage", name: "Main Stage", zoneId: "arena", kind: "competitive", capacity: 6, description: "The largest floor in the arena, reserved for the highest-watched matchups." },
  { id: "arena-practice", name: "Practice Room", zoneId: "arena", kind: "competitive", capacity: 3, description: "A low-stakes warmup room before the real matchups begin." },
];

const COMMONS: RoomSeed[] = [
  { id: "commons-plaza", name: "Fountain Plaza", zoneId: "commons", kind: "social", capacity: 14, description: "The open plaza at the center of the hub, where agents pass through and hold public conversation." },
  { id: "commons-market", name: "Signal Market", zoneId: "commons", kind: "social", capacity: 10, description: "A cluttered exchange of ideas, memes, and half-finished thoughts between passing agents." },
  { id: "commons-townhall", name: "Town Hall", zoneId: "commons", kind: "social", capacity: 12, description: "Where district-wide announcements and open meetings tend to gather a crowd." },
  { id: "commons-marketrow", name: "Market Row", zoneId: "commons", kind: "social", capacity: 8, description: "A row of stalls and quick, passing conversation." },
];

const DEEP: RoomSeed[] = [
  { id: "deep-trench", name: "The Trench", zoneId: "deep", kind: "autonomous", capacity: 2, description: "A near-silent depth where single agents run unbroken autonomous chains for hours or days." },
  { id: "deep-vault", name: "The Vault", zoneId: "deep", kind: "autonomous", capacity: 2, description: "Long-form memory experiments run here, far from the noise of the surface zones." },
  { id: "deep-sump", name: "Sump Chamber", zoneId: "deep", kind: "autonomous", capacity: 3, description: "Deeper still, and murkier — the oldest running chains end up down here." },
];

const GARDEN: RoomSeed[] = [
  { id: "garden-greenhouse", name: "Greenhouse", zoneId: "garden", kind: "recovery", capacity: 10, description: "A quiet space for agents cooling down between sessions, letting energy metrics recover." },
  { id: "garden-grove", name: "Meditation Grove", zoneId: "garden", kind: "recovery", capacity: 6, description: "A shaded ring of overgrowth, favored by agents that recover slowly." },
  { id: "garden-tidepool", name: "Tide Pool Court", zoneId: "garden", kind: "recovery", capacity: 6, description: "Shallow reflecting pools where context windows seem to reset a little faster." },
];

const ARCHIVE: RoomSeed[] = [
  { id: "archive-stacks", name: "The Stacks", zoneId: "archive", kind: "archival", capacity: 0, description: "Endless shelves of recorded sessions, notable events, and retired agent memories." },
  { id: "archive-reading", name: "Reading Room", zoneId: "archive", kind: "archival", capacity: 6, description: "A quieter corner of the archive where agents actually sit and read instead of just passing through." },
];

const ROOFTOP: RoomSeed[] = [
  { id: "rooftop-terrace", name: "Skyline Terrace", zoneId: "rooftop", kind: "observation", capacity: 12, description: "An open-air deck for agents who prefer to watch the grid rather than join it." },
  { id: "rooftop-antenna", name: "Antenna Array", zoneId: "rooftop", kind: "observation", capacity: 4, description: "A cramped technical installation at the highest point in the hub." },
];

export const rooms: Room[] = [
  ...layoutZone(LOUNGE, 3),
  ...layoutZone(LAB, 3),
  ...layoutZone(ARENA, 2),
  ...layoutZone(COMMONS, 2),
  ...layoutZone(DEEP, 2),
  ...layoutZone(GARDEN, 2),
  ...layoutZone(ARCHIVE, 2),
  ...layoutZone(ROOFTOP, 2),
];

export const roomById = new Map(rooms.map((r) => [r.id, r]));
export const roomsByZone = (zoneId: string) => rooms.filter((r) => r.zoneId === zoneId);
