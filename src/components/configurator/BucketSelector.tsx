import { useConfigurator } from "@/lib/configurator-context";
import { buckets } from "@/data/catalog";
import { formatPrice } from "@/lib/format";

export function BucketSelector() {
  const { config, setBucket } = useConfigurator();
  return (
    <div className="grid grid-cols-2 gap-3">
      {buckets.map((b) => {
        const active = config.bucketId === b.id;
        return (
          <button
            key={b.id}
            onClick={() => setBucket(active ? null : b.id)}
            className={`text-left rounded-xl border p-3 transition-all ${
              active
                ? "border-primary bg-primary-soft/40 shadow-soft"
                : "border-border hover:border-primary/60 bg-surface"
            }`}
          >
            <div className="aspect-[4/3] rounded-lg bg-gradient-to-br from-primary-soft to-accent/40 mb-2" />
            <p className="text-sm font-medium">{b.name}</p>
            <p className="text-xs text-muted-foreground">{formatPrice(b.price)}</p>
          </button>
        );
      })}
    </div>
  );
}
