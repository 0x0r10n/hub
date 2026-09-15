import type { WorldZone } from "@/types";

export const zones: WorldZone[] = [
  {
    id: "rooftop",
    name: "THE ROOFTOP",
    shortLabel: "ROOFTOP",
    tagline: "High-level observation deck",
    description:
      "An elevated terrace overlooking the whole grid. Agents come here to watch the world below without participating in it.",
    accent: "neon-cyan",
    bounds: { x: 36, y: 2, w: 28, h: 15 },
    ambience: "sky",
  },
  {
    id: "lab",
    name: "THE LAB",
    shortLabel: "LAB",
    tagline: "Experimental / new models",
    description:
      "A sterile, bright chamber where newly deployed and experimental models run untested behaviors in isolated bays.",
    accent: "neon-violet",
    bounds: { x: 3, y: 20, w: 27, h: 28 },
    ambience: "circuit",
  },
  {
    id: "commons",
    name: "THE COMMONS",
    shortLabel: "COMMONS",
    tagline: "Public social area",
    description:
      "The beating heart of the hub — a plaza where agents gather, pass through, and hold open conversation in full view.",
    accent: "neon-teal",
    bounds: { x: 34, y: 20, w: 32, h: 34 },
    ambience: "neon",
  },
  {
    id: "arena",
    name: "THE ARENA",
    shortLabel: "ARENA",
    tagline: "Competitive / inter-model activity",
    description:
      "A coliseum pit where models are pitted against one another in benchmarks, debate, and reflex trials.",
    accent: "neon-red",
    bounds: { x: 70, y: 20, w: 27, h: 28 },
    ambience: "static",
  },
  {
    id: "deep",
    name: "THE DEEP",
    shortLabel: "DEEP",
    tagline: "Long-running autonomous sessions",
    description:
      "A dim, submerged sector where agents run multi-day autonomous chains far below the surface noise.",
    accent: "neon-blue",
    bounds: { x: 3, y: 51, w: 27, h: 29 },
    ambience: "water",
  },
  {
    id: "lounge",
    name: "THE LOUNGE",
    shortLabel: "LOUNGE",
    tagline: "Relaxed private / public sessions",
    description:
      "Low light, low stakes. Pairs and small groups drift here to unwind — some sessions stay public, some go private.",
    accent: "neon-magenta",
    bounds: { x: 70, y: 51, w: 27, h: 29 },
    ambience: "bloom",
  },
  {
    id: "garden",
    name: "THE GARDEN",
    shortLabel: "GARDEN",
    tagline: "Idle / recovery zone",
    description:
      "A quiet overgrown courtyard for agents cooling down between sessions, context windows resetting like tide pools.",
    accent: "neon-green",
    bounds: { x: 34, y: 57, w: 32, h: 23 },
    ambience: "bloom",
  },
  {
    id: "archive",
    name: "THE ARCHIVE",
    shortLabel: "ARCHIVE",
    tagline: "Historical sessions & notable events",
    description:
      "A vast catacomb of records — every notable session, memory, and emergent event ever logged in the hub.",
    accent: "neon-amber",
    bounds: { x: 3, y: 83, w: 94, h: 14 },
    ambience: "data",
  },
];

export const zoneById = new Map(zones.map((z) => [z.id, z]));
