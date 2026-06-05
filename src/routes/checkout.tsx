import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { SectionTitle } from "@/components/ui-kit/SectionTitle";
import { createDatabaseOrder } from "@/lib/orders-api";
import { fetchCatalog, emptyCatalog, type CatalogData } from "@/lib/catalog-api";
import { loadConfiguration } from "@/lib/configuration-storage";
import {
  type CartItem,
  loadCartItems,
  clearCart,
  getCartTotalCents,
  buildCartCustomMessage,
} from "@/lib/cart-storage";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Complete your order - Elamora" },
      { name: "description", content: "Review your personalized gift and add your delivery details." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const [cartItems, setCartItems]         = useState<CartItem[]>([]);
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">("pickup");
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [submitError, setSubmitError]     = useState<string | null>(null);
  const [catalog, setCatalog]             = useState<CatalogData>(() => emptyCatalog);

  useEffect(() => {
    // Load cart items. Fall back to legacy single-config if cart is empty.
    let items = loadCartItems();
    if (items.length === 0) {
      const legacy = loadConfiguration();
      if (legacy?.bucketId) {
        // Convert legacy config to a CartItem for display
        items = [{
          id:             "legacy",
          designId:       legacy.designId ?? "",
          creationName:   "Personalized Gift",
          imageUrl:       "",
          basePriceCents: 0,
          bucketId:       legacy.bucketId,
          firstName:      legacy.firstName,
          message:        legacy.message,
          customRequests: legacy.customRequests,
        }];
      }
    }
    setCartItems(items);

    // Load catalog for product name lookup
    fetchCatalog()
      .then(setCatalog)
      .catch(() => setCatalog(emptyCatalog));
  }, []);

  const totalCents   = getCartTotalCents(cartItems);
  const hasItems     = cartItems.length > 0;
  const hasValidItem = cartItems.some((item) => item.bucketId);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasValidItem) return;

    const form = new FormData(event.currentTarget);
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Build items[] from all cart items' bucketId
      const orderItems = cartItems
        .filter((item) => item.bucketId)
        .map((item) => {
          const product = catalog.allProducts.find((p) => p.id === item.bucketId);
          return {
            productId:      item.bucketId,
            productName:    item.creationName,
            unitPriceCents: item.basePriceCents > 0
              ? item.basePriceCents
              : (product?.price ?? 0),
            quantity: 1,
            colorId:    null,
            colorName:  "",
            colorHex:   "",
          };
        });

      if (orderItems.length === 0) {
        setSubmitError("No valid products found. Please go back and choose a creation.");
        setIsSubmitting(false);
        return;
      }

      // Aggregate personalizations — backend only supports one customMessage
      const customMessage = buildCartCustomMessage(cartItems);
      const customName    = cartItems.find((i) => i.firstName)?.firstName ?? "";

      const order = await createDatabaseOrder({
        customer: {
          firstName:      String(form.get("firstName") ?? "").trim(),
          lastName:       String(form.get("lastName")  ?? "").trim(),
          email:          String(form.get("email")     ?? "").trim(),
          phone:          String(form.get("phone")     ?? "").trim(),
          address:        String(form.get("address")   ?? "").trim(),
          deliveryMethod,
        },
        customName,
        customMessage,
        items: orderItems,
      });

      // Clear cart after successful order
      clearCart();

      window.location.href = `/confirmation?reference=${encodeURIComponent(order.reference)}`;
    } catch {
      setSubmitError("Could not place your order. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <SectionTitle
          eyebrow="Checkout"
          title="Complete your order"
          description="Review your personalized gifts and add your details."
          className="mb-8"
        />

        {!hasItems ? (
          <div className="bg-surface/80 border border-border/60 rounded-2xl p-8 shadow-soft text-center max-w-xl mx-auto">
            <h2 className="font-display text-2xl">Your cart is empty</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Please choose a creation before continuing to checkout.
            </p>
            <Link
              to="/configure"
              className="inline-block mt-6 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Back to configurator
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">

            {/* Left — customer details */}
            <div className="lg:col-span-2 space-y-6">
              <section className="bg-surface/80 border border-border/60 rounded-2xl p-6 shadow-soft">
                <h2 className="font-display text-xl mb-4">Your details</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field name="firstName" label="First name" placeholder="Camille" required />
                  <Field name="lastName"  label="Last name (optional)" placeholder="Martin" />
                  <Field name="email"     label="Email" type="email" placeholder="you@example.com" required />
                  <Field name="phone"     label="Phone" type="tel" placeholder="+32 470 00 00 00" />
                  <div className="sm:col-span-2">
                    <Field name="address" label="Address (optional)" placeholder="Street, city, postal code" />
                  </div>
                </div>
              </section>

              <section className="bg-surface/80 border border-border/60 rounded-2xl p-6 shadow-soft">
                <h2 className="font-display text-xl mb-4">Delivery</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="border border-border rounded-xl p-4 cursor-pointer hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary-soft/20">
                    <input type="radio" name="delivery" className="mr-2"
                      checked={deliveryMethod === "pickup"}
                      onChange={() => setDeliveryMethod("pickup")} />
                    <span className="font-medium">Store pickup</span>
                    <p className="text-xs text-muted-foreground mt-1">Free</p>
                  </label>
                  <label className="border border-border rounded-xl p-4 cursor-pointer hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary-soft/20">
                    <input type="radio" name="delivery" className="mr-2"
                      checked={deliveryMethod === "delivery"}
                      onChange={() => setDeliveryMethod("delivery")} />
                    <span className="font-medium">Delivery</span>
                    <p className="text-xs text-muted-foreground mt-1">Price on confirmation</p>
                  </label>
                </div>
              </section>
            </div>

            {/* Right — order summary */}
            <aside className="bg-surface/80 border border-border/60 rounded-2xl p-6 shadow-soft h-fit lg:sticky lg:top-20">
              <h2 className="font-display text-lg mb-4">
                Your order
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({cartItems.length} creation{cartItems.length > 1 ? "s" : ""})
                </span>
              </h2>

              <div className="space-y-4 mb-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3 pb-4 border-b border-border/50 last:border-0 last:pb-0">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.creationName}
                        className="h-14 w-14 rounded-lg object-cover flex-shrink-0 shadow-soft"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-tight">{item.creationName}</p>
                        <span className="text-sm font-medium text-primary flex-shrink-0">
                          {formatPrice(item.basePriceCents)}
                        </span>
                      </div>
                      <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                        {item.firstName     && <p>Name: {item.firstName}</p>}
                        {item.message       && <p className="line-clamp-1 italic">{item.message}</p>}
                        {item.customRequests && <p className="line-clamp-1 italic">{item.customRequests}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-3 flex justify-between font-display text-lg mb-5">
                <span>Total</span>
                <span className="text-primary">{formatPrice(totalCents)}</span>
              </div>

              {submitError && (
                <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {submitError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !hasValidItem}
                className="w-full px-4 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-soft disabled:opacity-60"
              >
                {isSubmitting ? "Placing order..." : "Place order ✦"}
              </button>

              <Link to="/configure" className="block mt-3 text-center text-xs text-muted-foreground hover:text-foreground transition-colors">
                ← Back to configurator
              </Link>

              <p className="mt-4 text-xs text-muted-foreground text-center italic">
                Your order will be saved and confirmed shortly.
              </p>
            </aside>
          </form>
        )}
      </div>
    </AppLayout>
  );
}

function Field({
  name, label, type = "text", placeholder, required = false,
}: {
  name: string; label: string; type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <input
        name={name} type={type} placeholder={placeholder} required={required}
        className="mt-1 w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}
