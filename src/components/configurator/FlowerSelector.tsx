import { useConfigurator } from "@/lib/configurator-context";
import { formatPrice } from "@/lib/format";
import { getProductImageUrl } from "@/lib/product-images";
import { ProductCardSkeletonGrid } from "./CatalogSkeletons";

export function FlowerSelector() {
  const { config, toggleFlower, catalog, catalogLoading } = useConfigurator();
  if (catalogLoading) {
    return <ProductCardSkeletonGrid count={3} columnsClassName="grid grid-cols-3 gap-2" />;
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {catalog.flowers.map((f) => {
        const active = config.flowerIds.includes(f.id);
        const count  = config.flowerIds.filter((id) => id === f.id).length;
        const imgUrl = getProductImageUrl(f);
        return (
          <button
            key={f.id}
            onClick={() => toggleFlower(f.id)}
            className={[
              "relative rounded-xl border-2 p-2 text-center transition-all focus:outline-none focus-visible:outline-none",
              active
                ? "border-primary bg-primary-soft/30"
                : "border-transparent bg-surface hover:border-primary/30 hover:bg-primary-soft/10",
            ].join(" ")}
          >
            {imgUrl ? (
              <img
                src={imgUrl}
                alt={f.name}
                loading="lazy"
                className="mx-auto w-full aspect-square object-contain rounded-md mb-1"
              />
            ) : (
              <div className="mx-auto h-14 w-14 rounded-full bg-gradient-to-br from-primary-soft to-accent/60 mb-1" />
            )}
            <p className="text-xs font-medium">{f.name}</p>
            <p className="text-[10px] text-muted-foreground">{formatPrice(f.price)}</p>
            {count > 0 && (
              <span className="absolute top-1 right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
