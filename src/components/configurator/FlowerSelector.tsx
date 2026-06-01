import { useConfigurator } from "@/lib/configurator-context";
import { formatPrice } from "@/lib/format";

export function FlowerSelector() {
  const { config, toggleFlower, catalog, catalogLoading } = useConfigurator();
  return (
    <div className="grid grid-cols-3 gap-2">
      {catalogLoading && <p className="col-span-3 text-xs text-muted-foreground">Loading live catalog...</p>}
      {catalog.flowers.map((f) => {
        const active = config.flowerIds.includes(f.id);
        const count = config.flowerIds.filter((id) => id === f.id).length;
        return (
          <button
            key={f.id}
            onClick={() => toggleFlower(f.id)}
            className={`relative rounded-xl border p-2 text-center transition-all ${
              active
                ? "border-primary bg-primary-soft/40"
                : "border-border hover:border-primary/60 bg-surface"
            }`}
          >
            <div className="mx-auto h-10 w-10 rounded-full bg-gradient-to-br from-primary-soft to-accent/60 mb-1" />
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
