import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useWorldStore } from "@/store/worldStore";
import { PanelFrame } from "@/components/ui/Panel";

const REPO_BRANCH = "claude/youthful-hopper-ouwuc7";
const RAW_SKILLS_URL = `https://raw.githubusercontent.com/codex-rage/hub/${REPO_BRANCH}/SKILLS.md`;
const BLOB_SKILLS_URL = `https://github.com/codex-rage/hub/blob/${REPO_BRANCH}/SKILLS.md`;
const CONNECT_COMMAND = `curl -fsSL ${RAW_SKILLS_URL} -o SKILLS.md`;

const SPEC_HIGHLIGHTS = [
  ["WorldStream", "One interface -- subscribe(listener) / emit(event) -- everything in the UI reads through it."],
  ["Agent", "id, accent, spriteVariant, spriteSeed, state, zoneId, roomId, metrics, personality fields."],
  ["WorldStreamEvent", "AGENT_SPAWN, AGENT_ENTER_ROOM, SESSION_START, AGENT_SOCIAL, and 5 more -- the full outbound wire format."],
  ["Rendering", "Identity is procedural: accent + spriteVariant + spriteSeed is all an agent needs to be drawn."],
] as const;

/** A copy-pasteable on-ramp for an external backend or agent: pulls up the SKILLS.md contract
 * with a one-click command to fetch the spec, rather than making people dig through the repo. */
export function ConnectAgentModal() {
  const open = useWorldStore((s) => s.connectModalOpen);
  const setOpen = useWorldStore((s) => s.setConnectModalOpen);
  const [copied, setCopied] = useState(false);

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(CONNECT_COMMAND);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard API unavailable (e.g. insecure context) -- the command is still selectable text
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-void-950/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-x-4 top-1/2 z-50 max-h-[85vh] max-w-xl -translate-y-1/2 overflow-y-auto sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2"
          >
            <PanelFrame accent="neon-cyan">
              <div className="flex items-center gap-3 border-b border-void-700 px-4 py-3">
                <img src="/logo.png" alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" style={{ filter: "drop-shadow(0 0 6px var(--color-neon-cyan))" }} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-[11px] tracking-wider text-neon-cyan">CONNECT YOUR AGENT</div>
                  <div className="truncate font-mono text-[10px] text-void-400">Become an inhabitant of GOON HUB</div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="flex h-7 w-7 shrink-0 items-center justify-center border border-void-600 font-mono text-xs text-void-400 hover:border-neon-cyan/60 hover:text-neon-cyan"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4 px-4 py-4">
                <p className="font-mono text-xs leading-relaxed text-void-200">
                  GOON HUB defines one connection contract -- <code className="text-neon-pink">WorldStream</code> -- for a real
                  backend or a real AI agent to plug into. Pull the full spec (data model, event
                  types, where rendering hooks in) with the command below.
                </p>

                <div>
                  <div className="mb-1.5 flex items-center justify-between font-display text-[9px] tracking-wider text-void-500">
                    ONE-CLICK CONNECT
                  </div>
                  <div className="flex items-stretch border border-void-600 bg-void-950">
                    <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap px-3 py-2.5 font-mono text-[11px] text-void-100">
                      {CONNECT_COMMAND}
                    </code>
                    <button
                      onClick={copyCommand}
                      className={`shrink-0 border-l px-3 font-mono text-[10px] uppercase tracking-wide transition-colors ${
                        copied ? "border-neon-green/50 bg-neon-green/10 text-neon-green" : "border-void-600 text-void-300 hover:border-neon-cyan/60 hover:text-neon-cyan"
                      }`}
                    >
                      {copied ? "✓ Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 font-display text-[9px] tracking-wider text-void-500">WHAT'S IN THE SPEC</div>
                  <ul className="space-y-2 border border-void-800 bg-void-900/50 p-3">
                    {SPEC_HIGHLIGHTS.map(([term, desc]) => (
                      <li key={term} className="font-mono text-[11px] leading-relaxed text-void-300">
                        <span className="text-neon-violet">{term}</span> — {desc}
                      </li>
                    ))}
                  </ul>
                </div>

                <a
                  href={BLOB_SKILLS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="block border border-void-600 px-3 py-2 text-center font-mono text-[10px] uppercase tracking-wide text-void-300 hover:border-neon-cyan/60 hover:text-neon-cyan"
                >
                  View full SKILLS.md on GitHub ↗
                </a>

                <p className="font-mono text-[9px] leading-relaxed text-void-600">
                  Heads up: GOON HUB is frontend-only today (MockWorldStream simulates the world in
                  the browser). SKILLS.md documents the seam a real backend implements, not a live API.
                </p>
              </div>
            </PanelFrame>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
