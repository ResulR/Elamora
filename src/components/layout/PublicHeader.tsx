import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { loadCartItems, openGlobalCart } from "@/lib/cart-storage";

export function PublicHeader() {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    // Read initial count
    setCartCount(loadCartItems().length);

    // Refresh whenever cart changes
    const onUpdate = () => setCartCount(loadCartItems().length);
    window.addEventListener("elamora-cart-updated", onUpdate);
    return () => window.removeEventListener("elamora-cart-updated", onUpdate);
  }, []);

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-background/92 border-b border-border/70 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* Brand mark */}
        <Link to="/" className="flex flex-col items-start group flex-shrink-0">
          <span className="font-display text-xl tracking-tight text-foreground group-hover:text-primary transition-colors leading-tight">
            Elamora
          </span>
          <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground leading-none hidden sm:block">
            Gift Boutique
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#creations" className="hover:text-foreground transition-colors relative group">
            Creations
            <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-primary group-hover:w-full transition-all duration-300" />
          </a>
          <a href="#how" className="hover:text-foreground transition-colors relative group">
            How it works
            <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-primary group-hover:w-full transition-all duration-300" />
          </a>
          <Link to="/configure" className="hover:text-foreground transition-colors relative group">
            Configurator
            <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-primary group-hover:w-full transition-all duration-300" />
          </Link>
        </nav>

        {/* Right cluster: cart + CTA */}
        <div className="flex items-center gap-3 flex-shrink-0">

          {/* Cart icon — always visible, badge only when items > 0 */}
          <button
            onClick={() => openGlobalCart()}
            aria-label={cartCount > 0 ? `Open cart (${cartCount} items)` : "Open cart"}
            className="relative h-9 w-9 flex items-center justify-center rounded-full hover:bg-primary-soft/40 transition-colors"
          >
            <ShoppingBag className="h-5 w-5 text-foreground" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4.5 w-4.5 min-w-[18px] rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center leading-none px-1">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </button>

          {/* CTA */}
          <Link
            to="/configure"
            className="text-sm px-5 py-2.5 rounded-full bg-primary text-primary-foreground shadow-soft hover:opacity-90 transition-opacity font-semibold"
          >
            <span className="hidden sm:inline">✦ Create your gift</span>
            <span className="sm:hidden">Create</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
