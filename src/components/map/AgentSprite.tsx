import { motion } from "framer-motion";
import type { Agent } from "@/types";
import { PixelSprite } from "./PixelSprite";
import { stateAccent } from "@/store/worldStore";

export function AgentSprite({
  agent,
  selected,
  onSelect,
  scale = 1,
}: {
  agent: Agent;
  selected: boolean;
  onSelect: () => void;
  scale?: number;
}) {
  const accent = agent.state === "in-session" ? agent.accent : stateAccent(agent.state);

  return (
    <motion.button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className="group absolute z-10 flex -translate-x-1/2 -translate-y-full cursor-pointer flex-col items-center focus:outline-none"
      animate={{ left: `${agent.position.x}%`, top: `${agent.position.y}%` }}
      transition={{ duration: 1.7, ease: "easeInOut" }}
      style={{ willChange: "left, top" }}
    >
      <div
        className={`mb-1 whitespace-nowrap rounded-sm border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide opacity-0 transition-opacity group-hover:opacity-100 ${
          selected ? "opacity-100" : ""
        }`}
        style={{
          borderColor: `color-mix(in oklab, var(--color-${agent.accent}) 50%, transparent)`,
          backgroundColor: "rgba(5,6,9,0.9)",
          color: `var(--color-${agent.accent})`,
        }}
      >
        {agent.name}
      </div>

      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 2.2 + (agent.spriteSeed % 5) * 0.15, repeat: Infinity, ease: "easeInOut" }}
        className="relative"
      >
        <PixelSprite
          variant={agent.spriteVariant}
          accent={agent.accent}
          facing={agent.facing}
          size={22 * scale}
          className={`transition-transform duration-200 ${selected ? "scale-125" : "group-hover:scale-110"}`}
        />
        <span
          className={`absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full ${
            agent.state === "in-session" || agent.state === "roaming" ? "animate-pulse-slow" : ""
          }`}
          style={{ backgroundColor: `var(--color-${accent})`, boxShadow: `0 0 5px var(--color-${accent})` }}
        />
      </motion.div>

      {selected && (
        <span
          className="absolute -bottom-1 h-1 w-6 rounded-full opacity-70"
          style={{ backgroundColor: `var(--color-${agent.accent})`, boxShadow: `0 0 8px var(--color-${agent.accent})` }}
        />
      )}
    </motion.button>
  );
}
