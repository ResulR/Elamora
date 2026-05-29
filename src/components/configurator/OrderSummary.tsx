import { Link } from "@tanstack/react-router";
import { useConfigurator } from "@/lib/configurator-context";
import { findProduct } from "@/data/catalog";
import { formatPrice } from "@/lib/format";

export function OrderSummary() {
  const { config, totalPrice } = useConfigurator();
  const bucket = findProduct(config.bucketId);

  const lines: Array<{ label: string; price: number }> = [];
  if (bucket) lines.push({ label: bucket.name, price: bucket.price });
  config.flowerIds.forEach((id) => {
    const p = findProduct(id);
    if (p) lines.push({ label: p.name, price: p.price });
  });
  config.balloonIds.forEach((id) => {
    const p = findProduct(id);
    if (p) lines.push({ label: p.name, price: p.price });
  });

  return (
    <div className="bg-surface/80 border border-border/60 rounded-2xl p-5 shadow-soft sticky top-20">
      <h3 className="font-display text-lg mb-3">Récapitulatif</h3>
      {lines.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">
          Votre composition apparaîtra ici.
        </p>
      ) : (
        <ul className="space-y-1.5 mb-4">
          {lines.map((l, i) => (
            <li key={i} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{l.label}</span>
              <span>{formatPrice(l.price)}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="border-t border-border pt-3 flex justify-between font-display text-lg">
        <span>Total</span>
        <span className="text-primary">{formatPrice(totalPrice)}</span>
      </div>
      <Link
        to="/checkout"
        className={`mt-4 block text-center px-4 py-3 rounded-full font-medium transition-all ${
          bucket
            ? "bg-primary text-primary-foreground hover:opacity-90 shadow-soft"
            : "bg-muted text-muted-foreground pointer-events-none"
        }`}
      >
        Continuer
      </Link>
    </div>
  );
}
