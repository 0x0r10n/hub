import { useMemo } from "react";
import type { SpriteVariant } from "@/types";
import { SPRITE_PATTERNS } from "./spritePatterns";

export function PixelSprite({
  variant,
  accent,
  size = 28,
  facing = "right",
  className = "",
}: {
  variant: SpriteVariant;
  accent: string;
  size?: number;
  facing?: "left" | "right";
  className?: string;
}) {
  const pattern = SPRITE_PATTERNS[variant];
  const cols = pattern[0]?.length ?? 10;
  const px = size / cols;

  const { body, highlight } = useMemo(() => {
    const body: string[] = [];
    const highlight: string[] = [];
    pattern.forEach((row, y) => {
      row.split("").forEach((c, x) => {
        const pos = `${(x * px).toFixed(2)}px ${(y * px).toFixed(2)}px 0 0`;
        if (c === "1") body.push(`${pos} var(--color-${accent})`);
        if (c === "2") highlight.push(`${pos} rgba(255,255,255,0.92)`);
      });
    });
    return { body: body.join(", "), highlight: highlight.join(", ") };
  }, [pattern, px, accent]);

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        transform: facing === "left" ? "scaleX(-1)" : undefined,
        filter: `drop-shadow(0 0 4px var(--color-${accent}))`,
      }}
      aria-hidden
    >
      <span className="block" style={{ width: px, height: px, boxShadow: body }} />
      <span className="block" style={{ width: px, height: px, boxShadow: highlight }} />
    </div>
  );
}
