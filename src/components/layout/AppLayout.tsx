import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { PublicHeader } from "./PublicHeader";
import { GlobalCartDrawer } from "./GlobalCartDrawer";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      {/* Global cart drawer — available on every page, no context dependency */}
      <GlobalCartDrawer />

      <footer className="border-t border-border/60 bg-card/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Brand */}
            <div className="text-center sm:text-left">
              <p className="font-display text-lg text-foreground">Elamora</p>
              <p className="text-xs text-muted-foreground mt-0.5">Personalized gift boutique</p>
            </div>

            {/* Links */}
            <nav className="flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground sm:justify-end">
              <a href="/#creations" className="hover:text-foreground transition-colors">Creations</a>
              <Link to="/configure" className="hover:text-foreground transition-colors">Create a gift</Link>
              <a href="/#how" className="hover:text-foreground transition-colors">How it works</a>
              <Link to="/legal/cgv" className="hover:text-foreground transition-colors">Terms of Sale</Link>
              <Link to="/legal/mentions" className="hover:text-foreground transition-colors">Legal Notice</Link>
              <Link to="/legal/confidentialite" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link to="/legal/cookies" className="hover:text-foreground transition-colors">Cookie Policy</Link>
              <Link to="/legal/shipping" className="hover:text-foreground transition-colors">Shipping</Link>
              <Link to="/legal/returns" className="hover:text-foreground transition-colors">Returns</Link>
            </nav>

            {/* Copyright */}
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Elamora · Made with ♡
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
