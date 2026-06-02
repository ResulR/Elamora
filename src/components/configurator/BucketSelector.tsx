import { useConfigurator } from "@/lib/configurator-context";
import { formatPrice } from "@/lib/format";
import { getProductImageUrl } from "@/lib/product-images";

export function BucketSelector() {
  const { config, setBucket, catalog, catalogLoading } = useConfigurator();
  return (
    <div className="grid grid-cols-2 gap-3">
      {catalogLoading && (
        <p className="col-span-2 text-xs text-muted-foreground">Loading live catalog...</p>
      )}
      {catalog.buckets.map((b) => {
        const active  = config.bucketId === b.id;
        const imgUrl  = getProductImageUrl(b);
        return (
          <button
            key={b.id}
            onClick={() => setBucket(active ? null : b.id)}
            className={[
              "text-left rounded-xl border-2 p-3 transition-all focus:outline-none focus-visible:outline-none",
              active
                ? "border-primary bg-primary-soft/30 shadow-soft"
                : "border-transparent bg-surface hover:border-primary/30 hover:bg-primary-soft/10",
            ].join(" ")}
          >
            {imgUrl ? (
              <img
                src={imgUrl}
                alt={b.name}
                loading="lazy"
                className="w-full aspect-square rounded-lg object-contain bg-primary-soft/10 mb-2"
              />
            ) : (
              <div className="aspect-square rounded-lg bg-gradient-to-br from-primary-soft to-accent/40 mb-2" />
            )}
            <p className="text-sm font-medium">{b.name}</p>
            <p className="text-xs text-muted-foreground">{formatPrice(b.price)}</p>
          </button>
        );
      })}
    </div>
  );
}
