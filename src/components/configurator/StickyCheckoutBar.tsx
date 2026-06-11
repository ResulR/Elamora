import { useConfigurator } from "@/lib/configurator-context";
import { openGlobalCart } from "@/lib/cart-storage";
import { formatPrice } from "@/lib/format";

function scrollToPanel() {
  window.requestAnimationFrame(() => {
    document.getElementById("configure-panel")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

function scrollToConfigureTop() {
  setTimeout(() => {
    document.getElementById("configure-top")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 50);
}

/**
 * Mobile sticky bar — two independent zones:
 *
 * LEFT  → persistent cart badge (visible whenever cartItems.length > 0)
 *          Shows: "N items · €XX  [View]"
 *          Never replaces the right-side CTA.
 *
 * RIGHT → step-contextual CTA (never replaced by "View cart")
 *   step1, no creation  → "Select a creation"  (disabled)
 *   step1, has creation → "Continue"
 *   step2               → "Add to cart"
 *   custom mode         → "Contact us" (disabled)
 */
export function StickyCheckoutBar() {
  const {
    configMode,
    mobileStep, setMobileStep,
    cartCount, cartTotalCents,
    selectedDesign, config,
    addToCart, setDesign, setFirstName, setMessage, setRibbonColor, setCustomRequests,
  } = useConfigurator();

  const hasCreation = !!selectedDesign;
  const isStep1     = mobileStep === "creation";
  const isStep2     = mobileStep === "personalize";

  // ── Cart badge (left side) — always uses cartCount, never the flow state ──
  const CartBadge = () => {
    if (cartCount === 0) return null;
    return (
      <button
        onClick={() => openGlobalCart()}
        className="flex items-center gap-1.5 text-left"
      >
        <span className="text-xs text-muted-foreground">Cart</span>
        <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
          {cartCount}
        </span>
        <span className="font-display text-sm leading-none text-foreground">
          {formatPrice(cartTotalCents)}
        </span>
        <span className="text-xs text-primary font-medium ml-0.5">View →</span>
      </button>
    );
  };

  // ── Custom request mode ──────────────────────────────────────────────────────
  if (configMode === "custom") {
    return (
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/95 backdrop-blur-md px-4 py-3 flex items-center justify-between gap-3 shadow-elevated">
        <CartBadge />
        {cartCount === 0 && (
          <div>
            <p className="text-xs text-muted-foreground">Price</p>
            <p className="font-display text-base leading-none text-muted-foreground italic">On request</p>
          </div>
        )}
        <span className="px-5 py-3 rounded-full text-sm font-medium bg-muted text-muted-foreground cursor-not-allowed">
          Contact us
        </span>
      </div>
    );
  }

  // ── Step 2: Add to cart ──────────────────────────────────────────────────────
  if (isStep2) {
    const handleAddToCart = () => {
      if (!hasCreation || !selectedDesign) return;
      addToCart({
        id: crypto.randomUUID(),
        designId:       selectedDesign.id,
        creationName:   selectedDesign.name,
        imageUrl:       selectedDesign.imageUrl,
        basePriceCents: selectedDesign.basePriceCents,
        bucketId:       config.bucketId,
        firstName:      config.firstName,
        message:        config.message,
        ribbonColor:    config.ribbonColor,
        customRequests: config.customRequests,
      });
      setDesign(null);
      setFirstName("");
      setMessage("");
      setRibbonColor("Blush");
      setCustomRequests("");
      setMobileStep("creation");
      scrollToConfigureTop();
    };

    return (
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/95 backdrop-blur-md px-4 py-3 flex items-center justify-between gap-3 shadow-elevated">
        <CartBadge />
        {cartCount === 0 && (
          <div>
            <p className="text-xs text-muted-foreground">
              {config.firstName ? `For ${config.firstName}` : "Item"}
            </p>
            <p className="font-display text-sm leading-none truncate max-w-[130px]">
              {config.ribbonColor ? `${config.ribbonColor} ribbon` : selectedDesign?.name ?? "—"}
            </p>
          </div>
        )}
        <button
          onClick={handleAddToCart}
          disabled={!hasCreation}
          className={`px-5 py-3 rounded-full text-sm font-medium transition-all flex-shrink-0 ${
            hasCreation
              ? "bg-primary text-primary-foreground hover:opacity-90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          Add to cart
        </button>
      </div>
    );
  }

  // ── Step 1: Continue or Select a creation ────────────────────────────────────
  const handleContinue = () => {
    if (!hasCreation) return;
    setMobileStep("personalize");
    scrollToPanel();
  };

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/95 backdrop-blur-md px-4 py-3 flex items-center justify-between gap-3 shadow-elevated">
      <CartBadge />
      {cartCount === 0 && (
        <div>
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="font-display text-lg leading-none">{formatPrice(0)}</p>
        </div>
      )}
      <button
        onClick={handleContinue}
        disabled={!hasCreation}
        className={`px-5 py-3 rounded-full text-sm font-medium transition-all flex-shrink-0 ${
          hasCreation
            ? "bg-primary text-primary-foreground hover:opacity-90"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        }`}
      >
        {hasCreation ? "Continue" : "Select a creation"}
      </button>
    </div>
  );
}
