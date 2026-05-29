import type { ReactNode } from "react";
import { PublicHeader } from "./PublicHeader";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        (c) {new Date().getFullYear()} Elamora - All rights reserved
      </footer>
    </div>
  );
}
