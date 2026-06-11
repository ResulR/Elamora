import { useConfigurator } from "@/lib/configurator-context";
import { ColorSkeletons } from "./CatalogSkeletons";

export function ColorSelector() {
  const { config, setColor, catalog, catalogLoading } = useConfigurator();
  if (catalogLoading) {
    return <ColorSkeletons />;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {catalog.colors.map((c) => {
        const active = config.colorId === c.id;
        return (
          <button
            key={c.id}
            onClick={() => setColor(active ? null : c.id)}
            title={c.name}
            className={`h-10 w-10 rounded-full border-2 transition-transform ${
              active ? "border-primary scale-110 shadow-soft" : "border-border hover:scale-105"
            }`}
            style={{ background: c.colorHex }}
          />
        );
      })}
    </div>
  );
}
