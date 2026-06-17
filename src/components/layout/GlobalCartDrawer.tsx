/**
 * GlobalCartDrawer — accessible from any page via the elamora-open-cart event.
 * No dependency on ConfiguratorContext — reads directly from cart-storage.
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  CART_KEY,
  type CartItem,
  loadCartItems,
  removeCartItem,
  updateCartItemQuantity,
  clearCart,
  getCartItemCount,
  getCartTotalCents,
} from "@/lib/cart-storage";
import { formatPrice } from "@/lib/format";
import { Minus, Plus, X, Trash2, ShoppingBag } from "lucide-react";

export function GlobalCartDrawer() {
  const navigate = useNavigate();
  const [open, setOpen]         = useState(false);
  const [items, setItems]       = useState<CartItem[]>([]);

  const refresh = useCallback(() => {
    setItems(loadCartItems());
  }, []);

  useEffect(() => {
    refresh();

    // Open via event (PublicHeader, OrderSummary, StickyCheckoutBar → openGlobalCart())
    const handleOpen = () => { setOpen(true); refresh(); };
    // Refresh count/items whenever cart changes in this tab or another tab.
    const handleUpdate = () => refresh();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === CART_KEY) refresh();
    };

    window.addEventListener("elamora-open-cart",    handleOpen);
    window.addEventListener("elamora-cart-updated", handleUpdate);
    window.addEventListener("storage",              handleStorage);
    return () => {
      window.removeEventListener("elamora-open-cart",    handleOpen);
      window.removeEventListener("elamora-cart-updated", handleUpdate);
      window.removeEventListener("storage",              handleStorage);
    };
  }, [refresh]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const handleRemove = (id: string) => {
    const updated = removeCartItem(id);
    setItems(updated);
  };

  const handleQuantityChange = (id: string, quantity: number) => {
    const updated = updateCartItemQuantity(id, quantity);
    setItems(updated);
  };

  const handleProceed = () => {
    setOpen(false);
    void navigate({ to: "/checkout" });
  };

  const handleContinue = () => {
    setOpen(false);
  };

  const handleExploreCreations = () => {
    setOpen(false);
    void navigate({ to: "/configure" });
  };

  const total = getCartTotalCents(items);
  const count = getCartItemCount(items);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="gcart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <motion.div
            key="gcart-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-background shadow-elevated flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="font-display text-lg leading-tight">Your cart</h2>
                  <p className="text-xs text-muted-foreground">
                    {count === 0 ? "Empty" : `${count} creation${count > 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                aria-label="Close cart"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {count === 0 ? (
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
                    onClick={handleExploreCreations}
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
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3 p-3 rounded-xl border border-border/60 bg-surface/60">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.creationName}
                          className="h-16 w-16 rounded-lg object-cover flex-shrink-0 shadow-soft"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-display text-sm leading-tight">{item.creationName}</p>
                          <button
                            onClick={() => handleRemove(item.id)}
                            className="h-6 w-6 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            aria-label="Remove"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                          {item.firstName && <p><span className="opacity-60">Name:</span> {item.firstName}</p>}
                          {item.ribbonColor && <p><span className="opacity-60">Ribbon:</span> {item.ribbonColor}</p>}
                          {item.message   && <p className="line-clamp-2 italic">{item.message}</p>}
                          {item.customRequests && <p className="line-clamp-1 italic opacity-80">{item.customRequests}</p>}
                          {!item.firstName && !item.ribbonColor && !item.message && !item.customRequests && (
                            <p className="italic opacity-50">No personalization</p>
                          )}
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="inline-flex items-center rounded-full border border-border bg-background/80 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              aria-label={`Decrease quantity for ${item.creationName}`}
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="min-w-8 text-center text-xs font-semibold tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              disabled={item.quantity >= 99}
                              className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              aria-label={`Increase quantity for ${item.creationName}`}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-medium text-primary">
                              {formatPrice(item.basePriceCents * item.quantity)}
                            </p>
                            {item.quantity > 1 && (
                              <p className="text-[10px] text-muted-foreground">
                                {formatPrice(item.basePriceCents)} each
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <p className="text-[11px] text-muted-foreground italic leading-relaxed pt-2 border-t border-border/40">
                    Quantities duplicate the same personalized creation.
                    Add separate creations for different names or messages.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            {count > 0 && (
              <div className="px-5 py-4 border-t border-border/60 bg-background space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-display text-base">Total</span>
                  <span className="font-display text-xl text-primary">
                    {formatPrice(total)}
                    <span className="text-xs text-muted-foreground font-normal ml-1">est.</span>
                  </span>
                </div>
                <button
                  onClick={handleProceed}
                  className="w-full px-4 py-3 rounded-full font-semibold text-sm bg-primary text-primary-foreground hover:opacity-90 shadow-soft transition-all"
                >
                  Proceed to checkout →
                </button>
                <button
                  onClick={handleContinue}
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
