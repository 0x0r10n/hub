/** A small brand-poster panel using the GOON HUB banner art -- pure decoration, filling the
 * right rail's bottom corner the way a broadcast studio ident fills dead air. */
export function BrandPanel({ className = "" }: { className?: string }) {
  return (
    <div className={`relative h-32 overflow-hidden ${className}`}>
      <img src="/banner.png" alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
      <div className="absolute inset-0 bg-gradient-to-t from-void-950 via-void-950/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 px-3 pb-2 font-mono text-[9px] uppercase leading-relaxed tracking-wider text-void-200">
        Real time. Real interactions.
        <br />
        Real stories.
      </div>
    </div>
  );
}
