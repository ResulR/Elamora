import { useState, useEffect } from "react";
import { useConfigurator } from "@/lib/configurator-context";
import { DESIGN_PRESETS, type GiftDesign } from "@/lib/design-presets";
import { formatPrice } from "@/lib/format";
import { X, ZoomIn } from "lucide-react";

// ── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({
  design,
  onClose,
  onSelect,
}: {
  design: GiftDesign;
  onClose: () => void;
  onSelect: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-2xl overflow-hidden max-w-md w-full shadow-elevated flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative">
          <img
            src={design.imageUrl}
            alt={design.name}
            className="w-full object-contain max-h-[60vh]"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Info + actions */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="font-display text-lg leading-tight">{design.name}</h3>
            <span className="text-sm text-primary font-medium whitespace-nowrap">
              from {formatPrice(design.basePriceCents)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-1">{design.description}</p>
          <p className="text-xs text-muted-foreground/70 italic mb-4">{design.includes}</p>

          <div className="flex gap-2">
            <button
              onClick={onSelect}
              className="flex-1 px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Select this creation
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Creation selector ─────────────────────────────────────────────────────────

export function CreationSelector() {
  const { config, setDesign } = useConfigurator();
  const [lightbox, setLightbox] = useState<GiftDesign | null>(null);

  const openLightbox  = (design: GiftDesign) => setLightbox(design);
  const closeLightbox = () => setLightbox(null);

  const selectFromLightbox = (design: GiftDesign) => {
    setDesign(design.id);
    closeLightbox();
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-7">
        {DESIGN_PRESETS.map((creation) => {
          const active = config.designId === creation.id;
          return (
            <button
              key={creation.id}
              onClick={() => setDesign(active ? null : creation.id)}
              className={[
                "text-left rounded-2xl border-2 overflow-hidden transition-all duration-200",
                "focus:outline-none focus-visible:outline-none group",
                active
                  ? "border-primary shadow-soft"
                  : "border-transparent bg-surface hover:border-primary/30",
              ].join(" ")}
            >
              {/* Image with zoom affordance */}
              <div className="relative aspect-[3/4] w-full overflow-hidden">
                <img
                  src={creation.imageUrl}
                  alt={creation.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />

                {/* Zoom button — stops propagation so it doesn't toggle selection */}
                <button
                  onClick={(e) => { e.stopPropagation(); openLightbox(creation); }}
                  className="absolute top-2 left-2 h-7 w-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
                  aria-label={`View ${creation.name} larger`}
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>

                {/* Selected badge */}
                {active && (
                  <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-soft">
                    <svg viewBox="0 0 12 12" className="h-3 w-3 text-primary-foreground" fill="none"
                      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 6l3 3 5-5" />
                    </svg>
                  </div>
                )}

                {/* Occasion tags */}
                <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                  {creation.occasionTags.slice(0, 2).map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-black/30 text-white/90 backdrop-blur-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Text */}
              <div className={["p-4 transition-colors", active ? "bg-primary-soft/30" : "bg-surface"].join(" ")}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-display text-sm font-medium leading-tight">{creation.name}</p>
                  <p className="text-xs text-primary font-medium whitespace-nowrap flex-shrink-0">
                    from {formatPrice(creation.basePriceCents)}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground leading-snug mb-1.5">{creation.description}</p>
                <p className="text-[10px] text-muted-foreground/70 italic">{creation.includes}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          design={lightbox}
          onClose={closeLightbox}
          onSelect={() => selectFromLightbox(lightbox)}
        />
      )}
    </>
  );
}
