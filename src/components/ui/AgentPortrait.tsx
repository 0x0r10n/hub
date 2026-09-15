import { useMemo } from "react";
import type { SpriteVariant } from "@/types";
import { ACCESSORY_BY_SEED, getPortraitDataURL, resolveAccentHex } from "@/engine/textures";

/** A crisp pixel-art portrait rendered by the same procedural generator that builds the world's
 * character spritesheets -- used anywhere a small agent thumbnail is needed outside the game canvas. */
export function AgentPortrait({
  variant,
  accent,
  spriteSeed,
  size = 28,
  className = "",
}: {
  variant: SpriteVariant;
  accent: string;
  spriteSeed: number;
  size?: number;
  className?: string;
}) {
  const accessory = ACCESSORY_BY_SEED[spriteSeed % ACCESSORY_BY_SEED.length];
  const src = useMemo(() => getPortraitDataURL(variant, resolveAccentHex(accent), 48, accessory), [variant, accent, accessory]);
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt=""
      aria-hidden
      className={`pixelated shrink-0 ${className}`}
      style={{ imageRendering: "pixelated", filter: `drop-shadow(0 0 4px var(--color-${accent}))` }}
    />
  );
}
