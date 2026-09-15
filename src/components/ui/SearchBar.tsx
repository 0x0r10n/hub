import { PixelIcon } from "./PixelIcon";

export function SearchBar({
  value,
  onChange,
  placeholder = "SEARCH AGENTS, ROOMS…",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div
      className={`group flex items-center gap-2 border border-void-600 bg-void-850 px-2.5 py-1.5 transition-colors focus-within:border-neon-cyan/60 ${className}`}
    >
      <PixelIcon name="search" size={11} className="text-void-400 group-focus-within:text-neon-cyan" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent font-mono text-sm text-void-100 placeholder:text-void-400 focus:outline-none"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="font-mono text-xs text-void-400 hover:text-neon-magenta"
        >
          ×
        </button>
      )}
    </div>
  );
}
