import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useConfigurator } from "@/lib/configurator-context";
import { saveCartItems } from "@/lib/cart-storage";
import { formatPrice } from "@/lib/format";
import { X, Trash2, ShoppingBag } from "lucide-react";

export function CartDrawer() {
  const navigate = useNavigate();
  const {
    cartOpen,
    setCartOpen,
    setMobileStep,
    cartItems,
    cartCount,
    cartTotalCents,
    removeFromCart,
    clearCartItems,
  } = useConfigurator();

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCartOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [setCartOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (cartOpen) document.body.style.overflow = "hidden";
    else          document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [cartOpen]);

  const handleProceedToCheckout = () => {
    // Persist cart items to localStorage (already done via addCartItem)
    // Then navigate to checkout which will read from cart-storage
    setCartOpen(false);
    void navigate({ to: "/checkout" });
  };

  const handleContinueShopping = () => {
    setCartOpen(false);
    setMobileStep("creation");
  };

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />

          {/* Drawer */}
          <motion.div
            key="cart-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-background shadow-elevated flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
              <div>
                <h2 className="font-display text-lg leading-tight">Your cart</h2>
                <p className="text-xs text-muted-foreground">
                  {cartCount === 0
                    ? "Empty"
                    : `${cartCount} creation${cartCount > 1 ? "s" : ""}`}
                </p>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                aria-label="Close cart"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {cartCount === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
                  <div className="relative mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                    <div className="absolute inset-3 rounded-full border border-primary/15 bg-background/70" />
                    <ShoppingBag className="relative h-10 w-10 text-primary" />
                    <span className="absolute -right-1 top-3 h-4 w-4 rounded-full bg-primary/20" />
                    <span className="absolute bottom-4 left-2 h-2.5 w-2.5 rounded-full bg-primary/25" />
                  </div>

                  <p className="font-display text-2xl text-foreground">Your cart is empty</p>
                  <p className="mt-2 max-w-[260px] text-sm leading-6 text-muted-foreground">
                    Start with a personalized Elamora creation, then review it here before checkout.
                  </p>

                  <button
                    onClick={handleContinueShopping}
                    className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-90"
                  >
                    Explore creations
                  </button>

                  <p className="mt-4 text-xs text-muted-foreground">
                    You can still personalize the name, message and details before ordering.
                  </p>
                </div>
              ) : (
                <div className="px-5 py-4 space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 p-3 rounded-xl border border-border/60 bg-surface/60"
                    >
                      {/* Thumbnail */}
                      <img
                        src={item.imageUrl}
                        alt={item.creationName}
                        loading="lazy"
                        decoding="async"
                        className="h-16 w-16 rounded-lg object-cover flex-shrink-0 shadow-soft"
                      />

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-display text-sm leading-tight text-foreground">
                            {item.creationName}
                          </p>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="h-6 w-6 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            aria-label="Remove"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Personalization */}
                        <div className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                          {item.firstName && (
                            <p><span className="text-foreground/50">Name:</span> {item.firstName}</p>
                          )}
                          {item.ribbonColor && (
                            <p><span className="text-foreground/50">Ribbon:</span> {item.ribbonColor}</p>
                          )}
                          {item.message && (
                            <p className="line-clamp-2">
                              <span className="text-foreground/50">Message:</span>{" "}
                              <em>{item.message}</em>
                            </p>
                          )}
                          {item.customRequests && (
                            <p className="line-clamp-1">
                              <span className="text-foreground/50">Request:</span>{" "}
                              <em>{item.customRequests}</em>
                            </p>
                          )}
                          {!item.firstName && !item.ribbonColor && !item.message && !item.customRequests && (
                            <p className="italic opacity-60">No personalization</p>
                          )}
                        </div>

                        {/* Price */}
                        <p className="mt-1.5 text-sm font-medium text-primary">
                          {formatPrice(item.basePriceCents)}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Note */}
                  <p className="text-[11px] text-muted-foreground italic leading-relaxed pt-2 border-t border-border/40">
                    Multiple gifts are combined in one order. Personalizations are included per creation.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            {cartCount > 0 && (
              <div className="px-5 py-4 border-t border-border/60 bg-background space-y-3">
                {/* Total */}
                <div className="flex justify-between items-center">
                  <span className="font-display text-base text-foreground">Total</span>
                  <span className="font-display text-xl text-primary">
                    {formatPrice(cartTotalCents)}
                    <span className="text-xs text-muted-foreground font-normal ml-1">est.</span>
                  </span>
                </div>

                {/* Proceed */}
                <button
                  onClick={handleProceedToCheckout}
                  className="w-full px-4 py-3 rounded-full font-semibold text-sm bg-primary text-primary-foreground hover:opacity-90 shadow-soft transition-all"
                >
                  Proceed to checkout →
                </button>

                {/* Continue shopping */}
                <button
                  onClick={handleContinueShopping}
                  className="w-full px-4 py-2.5 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  + Add another creation
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
