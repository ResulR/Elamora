import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { ShippingPicker, type ShippingFormState } from "@/components/checkout/ShippingPicker";
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
import type { ShippingQuote } from "@/lib/shipping-api";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Complete your order - Elamora" },
      { name: "description", content: "Review your personalized gift and add your delivery details." },
    ],
  }),
  component: CheckoutPage,
});

const initialShipping: ShippingFormState = {
  deliveryMethod: "pickup",
  addressLine1: "",
  addressLine2: "",
  postalCode: "",
  city: "",
  country: "XK",
  deliveryDate: "",
  deliveryTimeSlot: "",
  deliveryInstructions: "",
  recipientPhone: "",
};

type CheckoutStep = "delivery" | "review" | "payment";

const checkoutSteps: Array<{ id: CheckoutStep; label: string; description: string }> = [
  { id: "delivery", label: "Delivery", description: "Your details" },
  { id: "review", label: "Review", description: "Check order" },
  { id: "payment", label: "Payment", description: "Bank transfer" },
];

function CheckoutPage() {
  const [cartItems, setCartItems]       = useState<CartItem[]>([]);
  const [step, setStep]                 = useState<CheckoutStep>("delivery");
  const [shipping, setShipping]         = useState<ShippingFormState>(initialShipping);
  const [shippingQuote, setShippingQuote] = useState<ShippingQuote | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError]   = useState<string | null>(null);
  const [catalog, setCatalog]           = useState<CatalogData>(() => emptyCatalog);

  useEffect(() => {
    let items = loadCartItems();
    if (items.length === 0) {
      const legacy = loadConfiguration();
      if (legacy?.bucketId) {
        items = [{
          id:             "legacy",
          designId:       legacy.designId ?? "",
          creationName:   "Personalized Gift",
          imageUrl:       "",
          basePriceCents: 0,
          bucketId:       legacy.bucketId,
          firstName:      legacy.firstName,
          message:        legacy.message,
          ribbonColor:    legacy.ribbonColor,
          customRequests: legacy.customRequests,
        }];
      }
    }
    setCartItems(items);

    fetchCatalog()
      .then(setCatalog)
      .catch(() => setCatalog(emptyCatalog));
  }, []);

  const subtotalCents = getCartTotalCents(cartItems);
  const shippingCents =
    shipping.deliveryMethod === "delivery" && shippingQuote?.available
      ? shippingQuote.shippingCents
      : 0;
  const previewTotalCents = subtotalCents + shippingCents;

  const hasItems     = cartItems.length > 0;
  const hasValidItem = cartItems.some((item) => item.bucketId);

  const isDeliveryReady = useMemo(() => {
    if (shipping.deliveryMethod === "pickup") return true;
    if (!shipping.addressLine1.trim()) return false;
    if (!shipping.postalCode.trim()) return false;
    if (!shipping.city.trim()) return false;
    if (!shipping.deliveryDate.trim()) return false;
    if (shipping.deliveryDate && !shipping.deliveryTimeSlot) return false;
    return Boolean(shippingQuote?.available);
  }, [shipping, shippingQuote]);

  const goToReview = () => {
    const form = document.getElementById("checkout-form") as HTMLFormElement | null;
    if (form && !form.reportValidity()) return;

    if (!isDeliveryReady) {
      setSubmitError("Please complete a valid delivery address and choose a delivery date before reviewing your order.");
      return;
    }

    setSubmitError(null);
    setStep("review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToPayment = () => {
    setSubmitError(null);
    setStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasValidItem) return;

    if (!isDeliveryReady) {
      setSubmitError("Please complete a valid delivery address and choose a delivery date before placing your order.");
      return;
    }

    if (!termsAccepted) {
      setSubmitError("Please accept the Terms of Sale before placing your order.");
      return;
    }

    const form = new FormData(event.currentTarget);
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const orderItems = cartItems
        .filter((item) => item.bucketId)
        .map((item) => ({
          productId: item.bucketId,
          quantity: item.quantity,
          colorId: null,
        }));

      if (orderItems.length === 0) {
        setSubmitError("No valid products found. Please go back and choose a creation.");
        setIsSubmitting(false);
        return;
      }

      const customMessage = buildCartCustomMessage(cartItems);
      const customName    = cartItems.find((i) => i.firstName)?.firstName ?? "";
      const phone         = String(form.get("phone") ?? "").trim();

      const order = await createDatabaseOrder({
        customer: {
          firstName: String(form.get("firstName") ?? "").trim(),
          lastName:  String(form.get("lastName")  ?? "").trim(),
          email:     String(form.get("email")     ?? "").trim(),
          phone,
          address: shipping.addressLine1,
          addressLine1: shipping.addressLine1.trim(),
          addressLine2: shipping.addressLine2.trim(),
          postalCode: shipping.postalCode.trim(),
          city: shipping.city.trim(),
          country: shipping.country.trim().toUpperCase(),
          deliveryDate: shipping.deliveryDate,
          deliveryTimeSlot: shipping.deliveryTimeSlot,
          deliveryInstructions: shipping.deliveryInstructions.trim(),
          recipientPhone: shipping.recipientPhone.trim() || phone,
          deliveryMethod: shipping.deliveryMethod,
        },
        customName,
        customMessage,
        termsAccepted: true,
        items: orderItems,
      });

      clearCart();

      if (!order.confirmationToken) {
        throw new Error("missing_confirmation_token");
      }

      window.location.href = `/confirmation?reference=${encodeURIComponent(order.reference)}&token=${encodeURIComponent(order.confirmationToken)}`;
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      let nextError = "Could not place your order. Please try again.";

      if (message === "zone_unavailable") {
        nextError = "This delivery area is not covered yet.";
      } else if (message === "missing_shipping_address") {
        nextError = "Please complete your delivery address.";
      } else if (message === "missing_delivery_date") {
        nextError = "Please choose a delivery date.";
      } else if (message === "delivery_date_unavailable") {
        nextError = "This delivery date is not available. Please choose another date.";
      }

      setSubmitError(nextError);
      toast.error(nextError);
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
          level={1}
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
          <form id="checkout-form" onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-3">
              <CheckoutStepper currentStep={step} />
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className={step === "delivery" ? "space-y-6" : "hidden"}>
                <section className="bg-surface/80 border border-border/60 rounded-2xl p-6 shadow-soft">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h2 className="font-display text-xl">Delivery details</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Add your contact details and choose pickup or delivery.
                      </p>
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.25em] text-primary font-semibold">
                      Step 01
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field name="firstName" label="First name" placeholder="Camille" required />
                    <Field name="lastName"  label="Last name (optional)" placeholder="Martin" />
                    <Field name="email"     label="Email" type="email" placeholder="you@example.com" required />
                    <Field name="phone"     label="Phone" type="tel" placeholder="+32 470 00 00 00" />
                  </div>
                </section>

                <ShippingPicker
                  value={shipping}
                  onChange={(next) => {
                    setShipping(next);
                    setSubmitError(null);
                  }}
                  onQuoteChange={setShippingQuote}
                />

                {submitError && (
                  <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {submitError}
                  </p>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={goToReview}
                    disabled={!hasValidItem || !isDeliveryReady}
                    className="px-7 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-soft disabled:opacity-45 disabled:cursor-not-allowed"
                  >
                    Continue to review →
                  </button>
                </div>
              </div>

              <section className={step === "review" ? "bg-surface/80 border border-border/60 rounded-2xl p-6 shadow-soft" : "hidden"}>
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h2 className="font-display text-xl">Review your order</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Check your gifts and delivery method before payment instructions.
                    </p>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.25em] text-primary font-semibold">
                    Step 02
                  </span>
                </div>

                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-3 rounded-2xl border border-border/60 bg-background/60 p-3">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.creationName}
                          loading="lazy"
                          decoding="async"
                          className="h-16 w-16 rounded-xl object-cover flex-shrink-0 shadow-soft"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-medium leading-tight">{item.creationName}</p>
                          <span className="text-sm font-medium text-primary">
                            {formatPrice(item.basePriceCents * item.quantity)}
                          </span>
                        </div>
                        <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                          <p>Qty: {item.quantity}</p>
                          <p>Qty: {item.quantity}</p>
                        {item.firstName      && <p>Name: {item.firstName}</p>}
                          {item.ribbonColor    && <p>Ribbon: {item.ribbonColor}</p>}
                          {item.message        && <p className="line-clamp-1 italic">{item.message}</p>}
                          {item.customRequests && <p className="line-clamp-1 italic">{item.customRequests}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-border/70 bg-muted/25 px-4 py-3 text-sm">
                  <p className="font-medium text-foreground">
                    {shipping.deliveryMethod === "pickup" ? "Pickup selected" : "Delivery selected"}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {shipping.deliveryMethod === "pickup"
                      ? "No delivery fee is added for pickup."
                      : `${shipping.addressLine1}, ${shipping.postalCode} ${shipping.city}, ${shipping.country.toUpperCase()}`}
                  </p>
                  {shipping.deliveryMethod === "delivery" && shipping.deliveryDate && (
                    <p className="mt-1 text-muted-foreground">
                      Preferred slot: {shipping.deliveryDate}
                      {shipping.deliveryTimeSlot ? ` · ${shipping.deliveryTimeSlot}` : ""}
                    </p>
                  )}
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-between">
                  <button
                    type="button"
                    onClick={() => setStep("delivery")}
                    className="px-6 py-3 rounded-full border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← Back
                  </button>

                  <button
                    type="button"
                    onClick={goToPayment}
                    className="px-7 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-soft"
                  >
                    Continue to payment →
                  </button>
                </div>
              </section>

              <section className={step === "payment" ? "bg-surface/80 border border-border/60 rounded-2xl p-6 shadow-soft" : "hidden"}>
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h2 className="font-display text-xl">Payment</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Confirm the order now. Bank transfer details will appear on the confirmation page.
                    </p>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.25em] text-primary font-semibold">
                    Step 03
                  </span>
                </div>

                {submitError && (
                  <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {submitError}
                  </p>
                )}

                <label className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/60 px-4 py-3 text-xs leading-6 text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(event) => {
                      setTermsAccepted(event.target.checked);
                      setSubmitError(null);
                    }}
                    className="mt-1 h-4 w-4 rounded border-input accent-primary"
                  />
                  <span>
                    I have read and accept the{" "}
                    <Link
                      to="/legal/cgv"
                      target="_blank"
                      className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
                    >
                      Terms of Sale
                    </Link>
                    , including the rules for personalized products, cancellation, delivery
                    and returns.
                  </span>
                </label>

                <div className="mt-5 rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Bank transfer payment</p>
                  <p className="mt-1">
                    After submitting your order, you will see the bank details and your payment
                    reference. We will prepare your order after the transfer is received and approved.
                  </p>
                  <p className="mt-2 italic">
                    Final delivery fees are recalculated securely before confirmation.
                  </p>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-between">
                  <button
                    type="button"
                    onClick={() => setStep("review")}
                    disabled={isSubmitting}
                    className="px-6 py-3 rounded-full border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60"
                  >
                    ← Back
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || !hasValidItem || !isDeliveryReady || !termsAccepted}
                    className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-soft disabled:opacity-45 disabled:cursor-not-allowed"
                    aria-busy={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isSubmitting ? "Saving order..." : "Confirm order ✦"}
                  </button>
                </div>
              </section>
            </div>

            <aside className="bg-surface/80 border border-border/60 rounded-2xl p-6 shadow-soft h-fit lg:sticky lg:top-20">
              <h2 className="font-display text-lg mb-4">
                Your order
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} item{cartItems.reduce((sum, item) => sum + item.quantity, 0) > 1 ? "s" : ""})
                </span>
              </h2>

              <div className="space-y-4 mb-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3 pb-4 border-b border-border/50 last:border-0 last:pb-0">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.creationName}
                        loading="lazy"
                        decoding="async"
                        className="h-14 w-14 rounded-lg object-cover flex-shrink-0 shadow-soft"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-tight">{item.creationName}</p>
                        <span className="text-sm font-medium text-primary flex-shrink-0">
                          {formatPrice(item.basePriceCents * item.quantity)}
                        </span>
                      </div>
                      <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                        {item.firstName      && <p>Name: {item.firstName}</p>}
                        {item.ribbonColor    && <p>Ribbon: {item.ribbonColor}</p>}
                        {item.message        && <p className="line-clamp-1 italic">{item.message}</p>}
                        {item.customRequests && <p className="line-clamp-1 italic">{item.customRequests}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(subtotalCents)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>
                    {shipping.deliveryMethod === "pickup"
                      ? "Free"
                      : shippingQuote?.available
                        ? formatPrice(shippingCents)
                        : "—"}
                  </span>
                </div>
                <div className="flex justify-between font-display text-lg pt-2 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(previewTotalCents)}</span>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">
                  {step === "delivery"
                    ? "Next: review your order"
                    : step === "review"
                      ? "Next: payment instructions"
                      : "Ready to confirm"}
                </p>
                <p className="mt-1">
                  Payment is currently handled by bank transfer after order confirmation.
                </p>
              </div>

              <Link to="/configure" className="block mt-3 text-center text-xs text-muted-foreground hover:text-foreground transition-colors">
                ← Back to configurator
              </Link>
            </aside>
          </form>
        )}
      </div>
    </AppLayout>
  );
}

function CheckoutStepper({ currentStep }: { currentStep: CheckoutStep }) {
  const currentIndex = checkoutSteps.findIndex((item) => item.id === currentStep);
  const progressPercent = currentIndex === 0 ? 0 : currentIndex === 1 ? 50 : 100;

  return (
    <div className="rounded-[28px] border border-border/60 bg-surface/80 px-5 py-5 sm:p-4 shadow-soft">
      {/* Mobile compact stepper */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between gap-3">
          {checkoutSteps.map((item, index) => {
            const active = item.id === currentStep;
            const complete = index < currentIndex;

            return (
              <div key={item.id} className="flex flex-col items-center gap-2 min-w-0">
                <span
                  className={[
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                    active || complete
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  ].join(" ")}
                >
                  {complete ? "✓" : index + 1}
                </span>

                <span
                  className={[
                    "text-[10px] uppercase tracking-[0.14em] font-semibold truncate",
                    active ? "text-primary" : "text-muted-foreground",
                  ].join(" ")}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="relative mt-4 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Desktop card stepper */}
      <div className="hidden sm:grid grid-cols-3 gap-3">
        {checkoutSteps.map((item, index) => {
          const active = item.id === currentStep;
          const complete = index < currentIndex;

          return (
            <div
              key={item.id}
              className={[
                "rounded-2xl border px-3 py-3 transition-colors",
                active
                  ? "border-primary bg-primary-soft/35"
                  : complete
                    ? "border-primary/20 bg-primary-soft/15"
                    : "border-border/60 bg-background/60",
              ].join(" ")}
            >
              <div className="flex items-center gap-2">
                <span
                  className={[
                    "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",
                    active || complete
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  ].join(" ")}
                >
                  {complete ? "✓" : index + 1}
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                  {item.label}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Field({
  name, label, type = "text", placeholder, required = false,
}: {
  name: string; label: string; type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}
