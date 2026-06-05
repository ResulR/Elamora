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
            <nav className="flex items-center gap-6 text-xs text-muted-foreground">
              <a href="#creations" className="hover:text-foreground transition-colors">Creations</a>
              <Link to="/configure" className="hover:text-foreground transition-colors">Create a gift</Link>
              <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
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
