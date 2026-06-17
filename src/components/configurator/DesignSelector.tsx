import { useConfigurator } from "@/lib/configurator-context";
import { DESIGN_PRESETS } from "@/lib/design-presets";
import { formatPrice } from "@/lib/format";

export function DesignSelector() {
  const { catalog, config, setDesign } = useConfigurator();

  const getDesignPriceCents = (design: (typeof DESIGN_PRESETS)[number]) =>
    catalog.buckets.find((bucket) => bucket.name === design.bridgeBucketName)?.price ??
    design.basePriceCents;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {DESIGN_PRESETS.map((design) => {
        const active = config.designId === design.id;
        const priceCents = getDesignPriceCents(design);
        return (
          <button
            key={design.id}
            onClick={() => setDesign(active ? null : design.id)}
            className={[
              "text-left rounded-2xl border-2 overflow-hidden transition-all focus:outline-none focus-visible:outline-none group",
              active
                ? "border-primary shadow-soft"
                : "border-transparent hover:border-primary/30 bg-surface",
            ].join(" ")}
          >
            {/* Design image — portrait 3:4 */}
            <div className="relative aspect-[3/4] w-full overflow-hidden">
              <img
                src={design.imageUrl}
                alt={design.name}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />

              {/* Active badge */}
              {active && (
                <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-soft">
                  <svg
                    viewBox="0 0 12 12"
                    className="h-3 w-3 text-primary-foreground fill-current"
                  >
                    <path d="M10 3L5 9 2 6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}

              {/* Occasion tags */}
              <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                {design.occasionTags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-black/30 text-white/90 backdrop-blur-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Text content */}
            <div
              className={[
                "p-3 transition-colors",
                active ? "bg-primary-soft/30" : "bg-surface",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-display text-sm font-medium leading-tight">
                  {design.name}
                </p>
                <p className="text-xs text-primary font-medium whitespace-nowrap flex-shrink-0">
                  from {formatPrice(priceCents)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground leading-snug mb-2">
                {design.description}
              </p>
              <p className="text-[10px] text-muted-foreground/70 italic">
                {design.includes}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
