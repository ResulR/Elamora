import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { SectionTitle } from "@/components/ui-kit/SectionTitle";
import { loadConfiguration } from "@/lib/configuration-storage";
import { findProduct } from "@/data/catalog";
import { formatPrice } from "@/lib/format";
import type { BucketConfiguration } from "@/types";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Complete your order — Elamora" },
      { name: "description", content: "Review your personalized gift bucket and add your delivery details." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const [config, setConfig] = useState<BucketConfiguration | null>(null);

  useEffect(() => {
    setConfig(loadConfiguration());
  }, []);

  const summary = useMemo(() => {
    if (!config) {
      return {
        lines: [],
        totalPrice: 0,
        bucket: undefined,
        color: undefined,
      };
    }

    const bucket = findProduct(config.bucketId);
    const color = findProduct(config.colorId);
    const lines: Array<{ label: string; price: number }> = [];

    if (bucket) lines.push({ label: bucket.name, price: bucket.price });

    config.flowerIds.forEach((id) => {
      const product = findProduct(id);
      if (product) lines.push({ label: product.name, price: product.price });
    });

    config.balloonIds.forEach((id) => {
      const product = findProduct(id);
      if (product) lines.push({ label: product.name, price: product.price });
    });

    const totalPrice = lines.reduce((sum, line) => sum + line.price, 0);

    return {
      lines,
      totalPrice,
      bucket,
      color,
    };
  }, [config]);

  const hasConfiguration = !!config && !!summary.bucket;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <SectionTitle
          eyebrow="Step 2 / 3"
          title="Complete your order"
          description="Review your gift bucket and add your customer details."
          className="mb-8"
        />

        {!hasConfiguration ? (
          <div className="bg-surface/80 border border-border/60 rounded-2xl p-8 shadow-soft text-center max-w-xl mx-auto">
            <h2 className="font-display text-2xl">No configuration found</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Please create your gift bucket before continuing to checkout.
            </p>
            <Link
              to="/"
              className="inline-block mt-6 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Back to configurator
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <section className="bg-surface/80 border border-border/60 rounded-2xl p-6 shadow-soft">
                <h2 className="font-display text-xl mb-4">Your details</h2>
                <form className="grid sm:grid-cols-2 gap-4">
                  <Field label="First name" placeholder="Camille" />
                  <Field label="Last name optional" placeholder="Martin" />
                  <Field label="Email" type="email" placeholder="you@example.com" />
                  <Field label="Phone" type="tel" placeholder="+32 470 00 00 00" />
                  <div className="sm:col-span-2">
                    <Field label="Address optional" placeholder="Street, city, postal code" />
                  </div>
                </form>
              </section>

              <section className="bg-surface/80 border border-border/60 rounded-2xl p-6 shadow-soft">
                <h2 className="font-display text-xl mb-4">Delivery</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="border border-border rounded-xl p-4 cursor-pointer hover:border-primary transition-colors">
                    <input type="radio" name="delivery" className="mr-2" defaultChecked />
                    <span className="font-medium">Store pickup</span>
                    <p className="text-xs text-muted-foreground mt-1">Free — TODO: time slots</p>
                  </label>
                  <label className="border border-border rounded-xl p-4 cursor-pointer hover:border-primary transition-colors">
                    <input type="radio" name="delivery" className="mr-2" />
                    <span className="font-medium">Delivery</span>
                    <p className="text-xs text-muted-foreground mt-1">TODO: pricing & zones</p>
                  </label>
                </div>
              </section>

              <section className="bg-surface/80 border border-border/60 rounded-2xl p-6 shadow-soft">
                <h2 className="font-display text-xl mb-4">Personalization</h2>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <InfoRow label="Name on bucket" value={config.firstName || "Not provided"} />
                  <InfoRow label="Gift message" value={config.message || "Not provided"} />
                  <InfoRow label="Selected color" value={summary.color?.name || "Not selected"} />
                </div>
              </section>
            </div>

            <aside className="bg-surface/80 border border-border/60 rounded-2xl p-6 shadow-soft h-fit lg:sticky lg:top-20">
              <h2 className="font-display text-lg mb-3">Your composition</h2>

              <ul className="space-y-2 mb-4">
                {summary.lines.map((line, index) => (
                  <li key={`${line.label}-${index}`} className="flex justify-between gap-4 text-sm">
                    <span className="text-muted-foreground">{line.label}</span>
                    <span>{formatPrice(line.price)}</span>
                  </li>
                ))}
              </ul>

              <div className="border-t border-border pt-3 flex justify-between font-display text-lg">
                <span>Total</span>
                <span className="text-primary">{formatPrice(summary.totalPrice)}</span>
              </div>

              <button
                disabled
                title="TODO: connect backend order creation and payment"
                className="mt-6 w-full px-4 py-3 rounded-full bg-muted text-muted-foreground cursor-not-allowed text-sm font-medium"
              >
                Place order (TODO)
              </button>

              <Link to="/" className="block mt-3 text-center text-xs text-muted-foreground hover:text-foreground">
                ← Edit configuration
              </Link>
            </aside>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function Field({ label, type = "text", placeholder }: { label: string; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
