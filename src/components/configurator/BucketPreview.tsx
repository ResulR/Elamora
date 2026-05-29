import { useConfigurator } from "@/lib/configurator-context";
import { findProduct } from "@/data/catalog";

/**
 * 2D layered preview of the gift bucket.
 * Uses pure CSS/SVG layers — no real 3D. Replace with richer art later.
 * TODO: swap shapes for branded illustrations once design assets are ready.
 */
export function BucketPreview() {
  const { config } = useConfigurator();
  const color = findProduct(config.colorId)?.colorHex ?? "#f4c6c6";
  const hasBucket = !!config.bucketId;

  return (
    <div className="relative w-full aspect-square max-w-xl mx-auto">
      {/* Ambient backdrop */}
      <div
        className="absolute inset-0 rounded-full blur-3xl opacity-60 transition-colors duration-500"
        style={{ background: `radial-gradient(circle at 50% 40%, ${color}, transparent 70%)` }}
      />

      {/* Stage */}
      <div className="absolute inset-0 flex items-end justify-center pb-10">
        <div className="relative w-[78%] aspect-square">
          {/* Balloons layer */}
          {config.balloonIds.length > 0 && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-3 animate-in fade-in duration-500">
              {config.balloonIds.slice(0, 5).map((id, i) => (
                <div
                  key={id + i}
                  className="w-10 h-12 rounded-full shadow-soft"
                  style={{
                    background: `linear-gradient(135deg, ${color}, oklch(0.95 0.05 60))`,
                    transform: `translateY(${i % 2 === 0 ? -4 : 4}px) rotate(${(i - 2) * 6}deg)`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Flowers layer */}
          {config.flowerIds.length > 0 && (
            <div className="absolute top-[18%] left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-2 w-[70%]">
              {config.flowerIds.slice(0, 9).map((id, i) => (
                <div
                  key={id + i}
                  className="w-9 h-9 rounded-full shadow-soft animate-in fade-in zoom-in duration-500"
                  style={{
                    background: `radial-gradient(circle at 35% 35%, white, ${color} 70%)`,
                    transform: `rotate(${(i - 4) * 8}deg)`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Bucket layer */}
          {hasBucket ? (
            <svg
              viewBox="0 0 200 200"
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full drop-shadow-[0_30px_30px_oklch(0.55_0.12_15/0.25)]"
            >
              <defs>
                <linearGradient id="bucketGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity="0.95" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.7" />
                </linearGradient>
              </defs>
              <path
                d="M40 90 Q100 70 160 90 L145 180 Q100 195 55 180 Z"
                fill="url(#bucketGrad)"
                stroke="oklch(0.3 0.05 20 / 0.15)"
                strokeWidth="1"
              />
              <ellipse cx="100" cy="90" rx="60" ry="10" fill="oklch(0.99 0 0 / 0.4)" />
            </svg>
          ) : (
            <div className="absolute inset-x-0 bottom-0 h-1/2 flex items-center justify-center">
              <p className="text-sm text-muted-foreground italic">
                Choisissez un bucket pour commencer
              </p>
            </div>
          )}

          {/* Name tag */}
          {(config.firstName || config.message) && (
            <div className="absolute -right-2 bottom-12 rotate-6 bg-card border border-border rounded-lg shadow-elevated px-3 py-2 max-w-[180px]">
              {config.firstName && (
                <p className="font-display text-base leading-tight">{config.firstName}</p>
              )}
              {config.message && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{config.message}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
