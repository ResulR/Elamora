import { useConfigurator } from "@/lib/configurator-context";
import { formatPrice } from "@/lib/format";
import { getProductImageUrl } from "@/lib/product-images";
import { ProductCardSkeletonGrid } from "./CatalogSkeletons";

export function BalloonSelector() {
  const { config, toggleBalloon, catalog, catalogLoading } = useConfigurator();
  if (catalogLoading) {
    return <ProductCardSkeletonGrid count={2} columnsClassName="grid grid-cols-2 gap-2" />;
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {catalog.balloons.map((b) => {
        const active = config.balloonIds.includes(b.id);
        const imgUrl = getProductImageUrl(b);
        return (
          <button
            key={b.id}
            onClick={() => toggleBalloon(b.id)}
            className={[
              "rounded-xl border-2 p-3 text-center transition-all focus:outline-none focus-visible:outline-none",
              active
                ? "border-primary bg-primary-soft/30"
                : "border-transparent bg-surface hover:border-primary/30 hover:bg-primary-soft/10",
            ].join(" ")}
          >
            {imgUrl ? (
              <img
                src={imgUrl}
                alt={b.name}
                loading="lazy"
                className="mx-auto w-full aspect-square object-contain mb-1"
              />
            ) : (
              <div className="mx-auto h-14 w-14 rounded-full bg-gradient-to-br from-primary-soft to-accent/40 mb-1" />
            )}
            <p className="text-sm font-medium">{b.name}</p>
            <p className="text-xs text-muted-foreground">{formatPrice(b.price)}</p>
          </button>
        );
      })}
    </div>
  );
}
