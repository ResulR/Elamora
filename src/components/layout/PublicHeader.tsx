import { Link } from "@tanstack/react-router";
import { Flower2 } from "lucide-react";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-background/90 border-b border-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Brand mark */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-soft group-hover:opacity-90 transition-opacity">
            <Flower2 className="h-3.5 w-3.5" />
          </span>
          <span className="font-display text-lg tracking-tight text-foreground">
            Elamora
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          <a href="#creations" className="hover:text-foreground transition-colors">Creations</a>
          <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
          <Link to="/configure" className="hover:text-foreground transition-colors">Configurator</Link>
        </nav>

        {/* CTA — lilac primary */}
        <Link
          to="/configure"
          className="text-sm px-5 py-2 rounded-full bg-primary text-primary-foreground shadow-soft hover:opacity-90 transition-opacity font-medium"
        >
          Create your gift
        </Link>
      </div>
    </header>
  );
}
