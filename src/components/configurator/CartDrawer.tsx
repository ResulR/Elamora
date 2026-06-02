import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useConfigurator } from "@/lib/configurator-context";
import { saveConfiguration } from "@/lib/configuration-storage";
import { formatPrice } from "@/lib/format";
import { X } from "lucide-react";

/**
 * CartDrawer — confirmation step before /checkout.
 *
 * v1: single-item only. The "cart" is a final review before placing the order.
 * Multi-item support requires backend changes and will come in a future version.
 */
export function CartDrawer() {
  const navigate = useNavigate();
  const {
    cartOpen,
    setCartOpen,
    setMobileStep,
    config,
    selectedDesign,
    totalPrice,
    findCatalogProduct,
  } = useConfigurator();

  const bucket = findCatalogProduct(config.bucketId);

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

  const handleProceed = () => {
    if (bucket) saveConfiguration(config);
    setCartOpen(false);
    void navigate({ to: "/checkout" });
  };

  const handleContinueEditing = () => {
    setCartOpen(false);
  };

  const handleChangeCreation = () => {
    setCartOpen(false);
    setMobileStep("creation");
  };

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />

          {/* ── Drawer panel ── */}
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
              <h2 className="font-display text-lg">Review your order</h2>
              <button
                onClick={() => setCartOpen(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

              {/* Creation thumbnail + name */}
              {selectedDesign && (
                <div className="flex items-center gap-4">
                  <img
                    src={selectedDesign.imageUrl}
                    alt={selectedDesign.name}
                    className="h-20 w-20 rounded-xl object-cover flex-shrink-0 shadow-soft"
                  />
                  <div className="min-w-0">
                    <p className="font-display text-base leading-tight">{selectedDesign.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                      {selectedDesign.includes}
                    </p>
                    <p className="text-sm font-medium text-primary mt-1.5">
                      {formatPrice(selectedDesign.basePriceCents)}
                      <span className="text-xs text-muted-foreground font-normal ml-1">est.</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Personalization details */}
              {(config.firstName || config.message || config.customRequests) && (
                <div className="rounded-xl border border-border bg-surface/70 px-4 py-3 space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    Personalization
                  </p>
                  {config.firstName && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Name:</span>{" "}
                      <span className="font-medium">{config.firstName}</span>
                    </p>
                  )}
                  {config.message && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Message:</span>{" "}
                      <span className="italic line-clamp-3">{config.message}</span>
                    </p>
                  )}
                  {config.customRequests && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Special request:</span>{" "}
                      <span className="italic line-clamp-3">{config.customRequests}</span>
                    </p>
                  )}
                </div>
              )}

              {/* No personalization placeholder */}
              {!config.firstName && !config.message && !config.customRequests && (
                <p className="text-xs text-muted-foreground italic">
                  No personalization added. You can still add a name or message if needed.
                </p>
              )}

              {/* v1 note */}
              <p className="text-[11px] text-muted-foreground italic leading-relaxed border-t border-border/40 pt-3">
                Each composition is ordered separately for now. For multiple gifts,
                please place separate orders.
              </p>
            </div>

            {/* Footer — fixed at bottom */}
            <div className="px-5 py-4 border-t border-border/60 space-y-2 bg-background">
              {/* Total */}
              {selectedDesign && (
                <div className="flex justify-between items-center mb-3">
                  <span className="font-display text-base">Estimated total</span>
                  <span className="text-primary font-display text-lg">
                    {formatPrice(selectedDesign.basePriceCents)}
                  </span>
                </div>
              )}

              {/* Proceed to checkout — the ONLY button that goes to /checkout */}
              <button
                onClick={handleProceed}
                disabled={!selectedDesign}
                className={`w-full px-4 py-3 rounded-full font-medium text-sm transition-all ${
                  selectedDesign
                    ? "bg-primary text-primary-foreground hover:opacity-90 shadow-soft"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                Proceed to checkout
              </button>

              {/* Secondary actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleContinueEditing}
                  className="flex-1 px-3 py-2 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Continue editing
                </button>
                <button
                  onClick={handleChangeCreation}
                  className="flex-1 px-3 py-2 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Change creation
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
