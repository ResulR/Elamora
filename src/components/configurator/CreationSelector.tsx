import { useState, useEffect } from "react";
import { useConfigurator } from "@/lib/configurator-context";
import { DESIGN_PRESETS, type GiftDesign } from "@/lib/design-presets";
import { formatPrice } from "@/lib/format";
import { X, ZoomIn } from "lucide-react";

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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/45 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-[2rem] overflow-hidden max-w-md w-full shadow-elevated flex flex-col border border-white/60"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-primary-soft/25">
          <img
            src={design.imageUrl}
            alt={design.name}
            className="w-full object-contain max-h-[62vh]"
          />

          <button
            onClick={onClose}
            className="absolute top-3 right-3 h-9 w-9 rounded-full bg-foreground/35 backdrop-blur-sm flex items-center justify-center text-background hover:bg-foreground/55 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="font-display text-2xl leading-tight">{design.name}</h3>
            <span className="text-sm text-primary font-medium whitespace-nowrap">
              {formatPrice(design.basePriceCents)}
            </span>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {design.description}
          </p>

          <p className="text-xs text-muted-foreground/80 italic mt-2 mb-5">
            {design.includes}
          </p>

          <div className="flex gap-2">
            <button
              onClick={onSelect}
              className="flex-1 px-5 py-3 rounded-full bg-primary text-primary-foreground text-xs uppercase tracking-[0.16em] font-semibold hover:opacity-90 transition-opacity"
            >
              Select this creation
            </button>

            <button
              onClick={onClose}
              className="px-5 py-3 rounded-full border border-border text-xs uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CreationSelector() {
  const { setDesign, setMobileStep } = useConfigurator();
  const [lightbox, setLightbox] = useState<GiftDesign | null>(null);

  const choose = (design: GiftDesign) => {
    setDesign(design.id);
    setMobileStep("personalize");
    window.requestAnimationFrame(() => {
      document.getElementById("configure-top")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-10 md:gap-x-7 md:gap-y-14 md:[&>*:nth-child(even)]:mt-8">
        {DESIGN_PRESETS.map((creation) => (
          <button
            key={creation.id}
            onClick={() => choose(creation)}
            className="group text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 rounded-[28px]"
          >
            <div className="relative aspect-[4/5] bg-primary-soft/35 rounded-[28px] overflow-hidden">
              <img
                src={creation.imageUrl}
                alt={creation.name}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />

              <div className="absolute inset-0 rounded-[28px] ring-0 ring-primary/0 group-hover:ring-1 group-hover:ring-primary/30 transition-all duration-500" />

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox(creation);
                }}
                className="absolute top-3 right-3 h-9 w-9 rounded-full bg-card/75 backdrop-blur-sm flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`View ${creation.name} larger`}
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>

            <h3 className="font-display text-base md:text-lg mt-4 leading-tight group-hover:italic transition-all">
              {creation.name}
            </h3>

            <span className="block h-px w-6 bg-primary/30 mt-2.5" />

            <p className="text-primary text-sm mt-2 font-medium">
              {formatPrice(creation.basePriceCents)}
            </p>
          </button>
        ))}
      </div>

      {lightbox && (
        <Lightbox
          design={lightbox}
          onClose={() => setLightbox(null)}
          onSelect={() => {
            choose(lightbox);
            setLightbox(null);
          }}
        />
      )}
    </>
  );
}
