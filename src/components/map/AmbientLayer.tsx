import { useMemo } from "react";
import type { WorldZone, ZoneId } from "@/types";

const NEON_TEXT: Partial<Record<ZoneId, string>> = {
  commons: "24/7",
  lounge: "VACANCY",
  garden: "BLOOM",
};

function seededParticles(seed: number, count: number) {
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    x: rand() * 100,
    y: rand() * 100,
    delay: rand() * 4,
    duration: 3 + rand() * 4,
  }));
}

export function AmbientLayer({ zone }: { zone: WorldZone }) {
  const particles = useMemo(() => seededParticles(zone.bounds.x + zone.bounds.y, 6), [zone]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {zone.ambience === "water" && (
        <div
          className="absolute inset-x-0 bottom-0 h-1/2 opacity-30"
          style={{
            background: `repeating-linear-gradient(100deg, transparent, transparent 8px, var(--color-${zone.accent}) 9px, transparent 10px)`,
            animation: "marquee 8s linear infinite",
          }}
        />
      )}
      {zone.ambience === "circuit" && (
        <div className="absolute inset-0 opacity-20 bg-grid" />
      )}
      {zone.ambience === "data" && (
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{ backgroundImage: `repeating-linear-gradient(0deg, var(--color-${zone.accent}) 0px, var(--color-${zone.accent}) 1px, transparent 1px, transparent 4px)` }}
        />
      )}
      {zone.ambience === "static" && (
        <div className="absolute inset-0 animate-static-flicker" style={{ backgroundColor: `var(--color-${zone.accent})` }} />
      )}
      {(zone.ambience === "neon" || zone.ambience === "bloom") && (
        <div
          className="absolute right-2 top-6 animate-flicker font-display text-[7px] tracking-widest opacity-70 sm:text-[8px]"
          style={{ color: `var(--color-${zone.accent})`, textShadow: `0 0 6px var(--color-${zone.accent})` }}
        >
          {NEON_TEXT[zone.id] ?? "OPEN"}
        </div>
      )}

      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute h-[3px] w-[3px] rounded-full animate-float"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            backgroundColor: `var(--color-${zone.accent})`,
            opacity: 0.5,
            boxShadow: `0 0 4px var(--color-${zone.accent})`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
