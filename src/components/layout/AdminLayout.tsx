import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Flower2,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingBag,
} from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";
import { getCurrentAdmin, logoutAdmin, type AdminSession } from "@/lib/admin-auth";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const mobileItems: Array<{
  to: "/admin" | "/admin/orders" | "/admin/products";
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}> = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/products", label: "Products", icon: Package },
];

export function AdminLayout({ children, title }: { children: ReactNode; title: string }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [admin, setAdmin] = useState<AdminSession | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const handleLogout = async () => {
    await logoutAdmin();
    setIsMobileMenuOpen(false);
    navigate({ to: "/login" });
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_left,var(--color-primary-soft),transparent_34%),var(--color-background)] px-4">
        <div className="rounded-3xl border border-border/60 bg-surface/85 px-6 py-5 shadow-soft">
          <p className="text-sm text-muted-foreground">Checking admin session...</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-[radial-gradient(circle_at_top_left,var(--color-primary-soft),transparent_32%),var(--color-background)]">
      <AdminSidebar adminEmail={admin.email} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-primary/15 bg-surface/85 backdrop-blur-md px-4 md:px-6 flex items-center gap-3 sticky top-0 z-20 shadow-soft">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="md:hidden h-10 w-10 rounded-2xl border border-primary/20 bg-background/80 shadow-soft flex items-center justify-center text-foreground hover:border-primary/40 transition-colors"
                aria-label="Open admin menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>

            <SheetContent side="left" className="w-[82vw] max-w-xs p-0 border-primary/15 bg-surface">
              <SheetHeader className="sr-only">
                <SheetTitle>Admin menu</SheetTitle>
              </SheetHeader>

              <div className="h-full flex flex-col bg-[radial-gradient(circle_at_top_left,var(--color-primary-soft),transparent_36%),var(--color-surface)]">
                <div className="h-16 flex items-center gap-3 px-5 border-b border-primary/15">
                  <span className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-soft">
                    <Flower2 className="h-4 w-4" />
                  </span>
                  <span className="font-display text-lg">Elamora Admin</span>
                </div>

                <nav className="flex-1 p-3 space-y-1">
                  {mobileItems.map(({ to, label, icon: Icon, exact }) => {
                    const active = exact ? pathname === to : pathname.startsWith(to);

                    return (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors ${
                          active
                            ? "bg-primary text-primary-foreground shadow-soft"
                            : "text-muted-foreground hover:bg-primary-soft/35 hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </Link>
                    );
                  })}
                </nav>

                <div className="p-4 border-t border-primary/15 space-y-3">
                  <p className="text-xs text-muted-foreground break-all">{admin.email}</p>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-background/60 px-3 py-3 text-sm text-muted-foreground hover:bg-primary-soft/30 hover:text-foreground transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.28em] text-primary font-semibold hidden sm:block">
              Back office
            </p>
            <h1 className="font-display text-lg md:text-xl truncate leading-tight">{title}</h1>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
