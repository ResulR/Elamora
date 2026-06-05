import { useConfigurator } from "@/lib/configurator-context";
import { openGlobalCart } from "@/lib/cart-storage";
import { formatPrice } from "@/lib/format";

function scrollToConfigureTop() {
  setTimeout(() => {
    document.getElementById("configure-top")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 50);
}

export function OrderSummary() {
  const {
    config, selectedDesign, configMode, mobileStep, totalPrice,
    cartCount, cartTotalCents,
    addToCart, setDesign, setFirstName, setMessage, setCustomRequests,
    setMobileStep,
  } = useConfigurator();

  const handleAddToCart = () => {
    if (!selectedDesign) return;
    addToCart({
      id: crypto.randomUUID(),
      designId:       selectedDesign.id,
      creationName:   selectedDesign.name,
      imageUrl:       selectedDesign.imageUrl,
      basePriceCents: selectedDesign.basePriceCents,
      bucketId:       config.bucketId,
      firstName:      config.firstName,
      message:        config.message,
      customRequests: config.customRequests,
    });
    setDesign(null);
    setFirstName("");
    setMessage("");
    setCustomRequests("");
    setMobileStep("creation");
    scrollToConfigureTop();
  };

  // ── Custom request mode ──────────────────────────────────────────────────────
  if (configMode === "custom") {
    const hasRequest = config.customRequests.trim().length > 0;
    return (
      <div className="bg-surface/80 border border-border/60 rounded-2xl p-5 shadow-soft sticky top-20">
        <h3 className="font-display text-lg mb-4">Your request</h3>
        {!hasRequest ? (
          <p className="text-sm text-muted-foreground py-2">
            Describe your ideal gift above and we'll get back to you.
          </p>
        ) : (
          <div className="space-y-2 mb-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Request</p>
            <p className="italic text-foreground/80 line-clamp-4 text-sm leading-relaxed">{config.customRequests}</p>
            {(config.firstName || config.message) && (
              <div className="pt-2 border-t border-border/50 space-y-1 text-xs text-muted-foreground">
                {config.firstName && <p><span className="text-foreground/60">Name:</span> {config.firstName}</p>}
                {config.message  && <p className="line-clamp-2"><span className="text-foreground/60">Message:</span> {config.message}</p>}
              </div>
            )}
          </div>
        )}
        <div className="border-t border-border pt-3 flex justify-between items-center">
          <span className="font-display text-base">Price</span>
          <span className="text-sm text-muted-foreground italic">On request</span>
        </div>
        <div className="rounded-xl border border-primary/20 bg-primary-soft/20 p-4 text-center mt-4">
          <p className="text-sm font-medium text-foreground mb-1">Ready to submit?</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Request submission coming soon. Contact us to finalize your custom gift.
          </p>
        </div>
        <p className="mt-3 text-[10px] text-muted-foreground text-center italic leading-relaxed">
          We'll confirm the price after reviewing your request.
        </p>
      </div>
    );
  }

  // ── Our creations mode ───────────────────────────────────────────────────────
  const hasCreation = !!selectedDesign;
  const inStep2     = mobileStep === "personalize";

  return (
    <div className="bg-surface/80 border border-border/60 rounded-2xl p-5 shadow-soft sticky top-20 space-y-4">

      {/* Cart indicator — desktop */}
      {cartCount > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-primary-soft/25 border border-primary/15">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-primary font-semibold">Cart</p>
            <p className="text-sm font-medium text-foreground">
              {cartCount} creation{cartCount > 1 ? "s" : ""} · {formatPrice(cartTotalCents)}
            </p>
          </div>
          <button
            onClick={() => openGlobalCart()}
            className="text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            View →
          </button>
        </div>
      )}

      <h3 className="font-display text-lg">Order summary</h3>

      {!hasCreation ? (
        <p className="text-sm text-muted-foreground py-2">
          Your composition will appear here once you choose a creation.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="pb-3 border-b border-border/60">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{selectedDesign.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{selectedDesign.includes}</p>
              </div>
              <span className="text-sm text-muted-foreground flex-shrink-0">{formatPrice(totalPrice)}</span>
            </div>
          </div>
          {(config.firstName || config.message || config.customRequests) && (
            <div className="space-y-1 text-xs text-muted-foreground">
              {config.firstName     && <p><span className="text-foreground/60">Name:</span> {config.firstName}</p>}
              {config.message       && <p className="line-clamp-2"><span className="text-foreground/60">Message:</span> {config.message}</p>}
              {config.customRequests && <p className="line-clamp-2"><span className="text-foreground/60">Special request:</span> {config.customRequests}</p>}
            </div>
          )}
        </div>
      )}

      {hasCreation && (
        <div className="border-t border-border pt-3 flex justify-between font-display text-lg">
          <span>Total</span>
          <span className="text-primary">{formatPrice(totalPrice)}</span>
        </div>
      )}

      {/* Add to cart — desktop step 2 */}
      {inStep2 && hasCreation && (
        <button
          onClick={handleAddToCart}
          className="w-full px-4 py-3 rounded-full font-medium text-sm bg-primary text-primary-foreground hover:opacity-90 shadow-soft transition-all"
        >
          Add to cart ✦
        </button>
      )}

      {!inStep2 && hasCreation && (
        <p className="text-xs text-muted-foreground text-center">
          Continue to add your personalization.
        </p>
      )}

      <p className="text-[10px] text-muted-foreground text-center italic leading-relaxed">
        Preview shown for inspiration. Final handcrafted details may vary slightly.
      </p>
    </div>
  );
}
