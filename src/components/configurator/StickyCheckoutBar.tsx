import { Link } from "@tanstack/react-router";
import { useConfigurator } from "@/lib/configurator-context";
import { formatPrice } from "@/lib/format";
import { saveConfiguration } from "@/lib/configuration-storage";

export function StickyCheckoutBar() {
  const { config, totalPrice } = useConfigurator();
  const ready = !!config.bucketId;

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/95 backdrop-blur-md px-4 py-3 flex items-center justify-between gap-3 shadow-elevated">
      <div>
        <p className="text-xs text-muted-foreground">Total</p>
        <p className="font-display text-lg leading-none">{formatPrice(totalPrice)}</p>
      </div>
      <Link
        to="/checkout"
        onClick={() => {
          if (ready) saveConfiguration(config);
        }}
        className={`px-5 py-3 rounded-full text-sm font-medium ${
          ready
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground pointer-events-none"
        }`}
      >
        Continue
      </Link>
    </div>
  );
}
