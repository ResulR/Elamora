import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ShoppingBag, Package, Flower2, LogOut } from "lucide-react";
import { logoutAdmin } from "@/lib/admin-auth";

const items: Array<{
  to: "/admin" | "/admin/orders" | "/admin/products";
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}> = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/products", label: "Products", icon: Package },
];

export function AdminSidebar({ adminEmail }: { adminEmail: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutAdmin();
    navigate({ to: "/login" });
  };

  return (
    <aside className="w-64 shrink-0 border-r border-primary/15 bg-surface/75 backdrop-blur-md hidden md:flex md:flex-col shadow-soft">
      <div className="h-16 flex items-center gap-3 px-5 border-b border-primary/15">
        <span className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-soft">
          <Flower2 className="h-4 w-4" />
        </span>
        <div>
          <span className="font-display text-lg leading-tight block">Elamora</span>
          <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Admin</span>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1.5">
        {items.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? pathname === to : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm transition-colors ${
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
        <p className="text-xs text-muted-foreground break-all">{adminEmail}</p>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-background/60 px-3 py-2.5 text-sm text-muted-foreground hover:bg-primary-soft/30 hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
