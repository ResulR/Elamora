import { useConfigurator } from "@/lib/configurator-context";

const RIBBON_OPTIONS = [
  { name: "Blush", swatch: "#f4c6c6" },
  { name: "Cream", swatch: "#f7eadb" },
  { name: "Sage", swatch: "#b8c7aa" },
  { name: "Mauve", swatch: "#c8adc8" },
];

export function RibbonPicker() {
  const { config, setRibbonColor } = useConfigurator();

  return (
    <div>
      <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-foreground/70 block mb-3">
        Ribbon color
      </span>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {RIBBON_OPTIONS.map((option) => {
          const active = config.ribbonColor === option.name;

          return (
            <button
              key={option.name}
              type="button"
              onClick={() => setRibbonColor(option.name)}
              className={[
                "rounded-2xl border px-3 py-3 text-left transition-all",
                active
                  ? "border-primary bg-primary-soft/35 shadow-soft"
                  : "border-primary/15 bg-card/60 hover:border-primary/40 hover:bg-primary-soft/20",
              ].join(" ")}
              aria-pressed={active}
            >
              <span
                className="block h-4 rounded-full border border-white/70 shadow-inner mb-2"
                style={{ backgroundColor: option.swatch }}
              />
              <span className="text-xs font-medium">{option.name}</span>
            </button>
          );
        })}
      </div>

      <p className="text-[11px] italic text-foreground/40 mt-2">
        This helps us match the finishing ribbon to your gift mood.
      </p>
    </div>
  );
}
