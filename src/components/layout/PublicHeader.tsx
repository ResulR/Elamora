import { Link } from "@tanstack/react-router";
import { Flower2 } from "lucide-react";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-background/70 border-b border-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform">
            <Flower2 className="h-4 w-4" />
          </span>
          <span className="font-display text-lg tracking-tight">Elamora</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          <a href="#creations" className="hover:text-foreground transition-colors">Creations</a>
          <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
          <Link to="/configure" className="hover:text-foreground transition-colors">Configurator</Link>
        </nav>
        <Link
          to="/configure"
          className="text-sm px-4 py-2 rounded-full bg-primary text-primary-foreground shadow-soft hover:opacity-90 transition-opacity"
        >
          Create your gift
        </Link>
      </div>
    </header>
  );
}
