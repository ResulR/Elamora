import { useConfigurator } from "@/lib/configurator-context";
import { formatPrice } from "@/lib/format";

export function BalloonSelector() {
  const { config, toggleBalloon, catalog, catalogLoading } = useConfigurator();
  return (
    <div className="grid grid-cols-2 gap-2">
      {catalogLoading && <p className="col-span-2 text-xs text-muted-foreground">Loading live catalog...</p>}
      {catalog.balloons.map((b) => {
        const active = config.balloonIds.includes(b.id);
        return (
          <button
            key={b.id}
            onClick={() => toggleBalloon(b.id)}
            className={`rounded-xl border px-3 py-2 text-left transition-all ${
              active
                ? "border-primary bg-primary-soft/40"
                : "border-border hover:border-primary/60 bg-surface"
            }`}
          >
            <p className="text-sm font-medium">{b.name}</p>
            <p className="text-xs text-muted-foreground">{formatPrice(b.price)}</p>
          </button>
        );
      })}
    </div>
  );
}
