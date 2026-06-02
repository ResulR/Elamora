import { useConfigurator } from "@/lib/configurator-context";
import { saveConfiguration } from "@/lib/configuration-storage";
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
 * Mobile sticky bar — single button, four states in order of priority:
 *
 *  1. cartAdded + step1     → "View cart"         → open CartDrawer
 *  2. step2 "personalize"   → "Add to cart"        → save + cartAdded + back to step1
 *  3. hasCreation + step1   → "Continue"           → advance to step2
 *  4. !hasCreation + step1  → "Select a creation"  → disabled
 *
 * "View cart" only appears AFTER a creation has been added (cartAdded = true)
 * AND while the user is back on step1 — never while they haven't yet selected anything.
 */
export function StickyCheckoutBar() {
  const {
    configMode,
    mobileStep, setMobileStep,
    cartAdded, setCartAdded,
    setCartOpen,
    selectedDesign,
    config,
    totalPrice,
    findCatalogProduct,
  } = useConfigurator();

  const hasCreation = !!selectedDesign;
  const isStep1     = mobileStep === "creation";
  const isStep2     = mobileStep === "personalize";

  // ── Custom request mode ──────────────────────────────────────────────────────
  if (configMode === "custom") {
    return (
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/95 backdrop-blur-md px-4 py-3 flex items-center justify-between gap-3 shadow-elevated">
        <div>
          <p className="text-xs text-muted-foreground">Price</p>
          <p className="font-display text-base leading-none text-muted-foreground italic">On request</p>
        </div>
        <span className="px-5 py-3 rounded-full text-sm font-medium bg-muted text-muted-foreground cursor-not-allowed">
          Contact us
        </span>
      </div>
    );
  }

  // ── State 1: "View cart" — only after item added AND back on step1 ───────────
  if (cartAdded && isStep1) {
    return (
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/95 backdrop-blur-md px-4 py-3 flex items-center justify-between gap-3 shadow-elevated">
        <div>
          <p className="text-xs text-muted-foreground">Cart</p>
          <p className="font-display text-lg leading-none">{formatPrice(totalPrice)}</p>
        </div>
        <button
          onClick={() => setCartOpen(true)}
          className="px-5 py-3 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-all"
        >
          View cart
        </button>
      </div>
    );
  }

  // ── State 2: "Add to cart" — step2 (personalize) ────────────────────────────
  if (isStep2) {
    const bucket = findCatalogProduct(config.bucketId);

    const handleAddToCart = () => {
      if (!hasCreation) return;
      if (bucket) saveConfiguration(config);
      setCartAdded(true);
      setMobileStep("creation");
      scrollToConfigureTop();
    };

    return (
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/95 backdrop-blur-md px-4 py-3 flex items-center justify-between gap-3 shadow-elevated">
        <div>
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="font-display text-lg leading-none">{formatPrice(totalPrice)}</p>
        </div>
        <button
          onClick={handleAddToCart}
          disabled={!hasCreation}
          className={`px-5 py-3 rounded-full text-sm font-medium transition-all ${
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

  // ── State 3 & 4: step1 — "Continue" or "Select a creation" ──────────────────
  const handleContinue = () => {
    if (!hasCreation) return;
    setMobileStep("personalize");
    scrollToPanel();
  };

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/95 backdrop-blur-md px-4 py-3 flex items-center justify-between gap-3 shadow-elevated">
      <div>
        <p className="text-xs text-muted-foreground">Total</p>
        <p className="font-display text-lg leading-none">{formatPrice(totalPrice)}</p>
      </div>
      <button
        onClick={handleContinue}
        disabled={!hasCreation}
        className={`px-5 py-3 rounded-full text-sm font-medium transition-all ${
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
