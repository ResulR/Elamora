import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AdminSidebar } from "./AdminSidebar";
import { getCurrentAdmin, type AdminSession } from "@/lib/admin-auth";

export function AdminLayout({ children, title }: { children: ReactNode; title: string }) {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<AdminSession | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getCurrentAdmin()
      .then((currentAdmin) => {
        if (!isMounted) return;

        if (!currentAdmin) {
          navigate({ to: "/login" });
          return;
        }

        setAdmin(currentAdmin);
      })
      .finally(() => {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <p className="text-sm text-muted-foreground">Checking admin session...</p>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <div className="min-h-screen flex">
      <AdminSidebar adminEmail={admin.email} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border/60 bg-surface/60 backdrop-blur-sm px-6 flex items-center">
          <h1 className="font-display text-xl">{title}</h1>
        </header>
        <main className="flex-1 p-6 md:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
