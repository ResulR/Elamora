import { useConfigurator } from "@/lib/configurator-context";

export function BucketPreview() {
  const { selectedDesign, configMode, findCatalogProduct, config } = useConfigurator();
  const color = findCatalogProduct(config.colorId)?.colorHex ?? "#f4c6c6";

  // ── Mode: Our creations ────────────────────────────────────────────────────
  if (configMode === "creation") {
    if (selectedDesign) {
      return (
        <div className="relative rounded-3xl overflow-hidden bg-white shadow-bloom flex flex-col">
          <img
            key={selectedDesign.id}
            src={selectedDesign.imageUrl}
            alt={selectedDesign.name}
            className="w-full object-contain animate-in fade-in duration-400"
            loading="eager"
          />
          <div className="px-4 py-3 border-t border-border/40 bg-surface/70 text-center">
            <p className="text-[11px] text-muted-foreground italic leading-relaxed">
              Preview shown for inspiration. Your name, message and special request
              will be included in your order.
            </p>
          </div>
        </div>
      );
    }

    // No creation selected yet
    return (
      <div className="rounded-3xl overflow-hidden bg-white shadow-bloom flex flex-col">
        <div
          className="flex flex-col items-center justify-center aspect-[3/4] gap-4 px-8 transition-colors duration-500"
          style={{ background: `radial-gradient(ellipse 70% 60% at 50% 55%, ${color}22, transparent 75%)` }}
        >
          <div
            className="h-16 w-16 rounded-full flex items-center justify-center transition-colors duration-500"
            style={{ background: `${color}33` }}
          >
            <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ color }}>
              <path d="M16 4C10 4 6 9 6 14Q6 22 16 28Q26 22 26 14C26 9 22 4 16 4Z" />
              <path d="M12 13Q16 9 20 13" />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-display text-base text-foreground mb-1">Choose a creation</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Select a gift composition above to preview it here.
            </p>
          </div>
        </div>
        <div className="px-4 py-3 border-t border-border/40 bg-surface/70 text-center">
          <p className="text-[11px] text-muted-foreground italic">
            Preview shown for inspiration.
          </p>
        </div>
      </div>
    );
  }

  // ── Mode: Custom request ───────────────────────────────────────────────────
  return (
    <div className="relative rounded-3xl overflow-hidden bg-white shadow-bloom flex flex-col">
      {/* Decorative background image — generic Elamora photo, slightly muted */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src="/designs/classic-romantic-bucket.png"
          alt="Elamora creation"
          className="w-full h-full object-contain opacity-30"
        />
        {/* Overlay content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8">
          <div
            className="h-16 w-16 rounded-full flex items-center justify-center"
            style={{ background: `${color}55` }}
          >
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ color }}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-display text-base text-foreground mb-2">
              A unique creation, just for you
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We'll prepare something special based on your request and confirm the details with you.
            </p>
          </div>
        </div>
      </div>
      <div className="px-4 py-3 border-t border-border/40 bg-surface/70 text-center">
        <p className="text-[11px] text-muted-foreground italic leading-relaxed">
          This preview is illustrative. We'll craft your unique composition after reviewing your request.
        </p>
      </div>
    </div>
  );
}
