import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ShoppingBag, Package, Settings, Flower2, LogOut } from "lucide-react";
import { logoutAdmin } from "@/lib/admin-auth";

const items: Array<{
  to: "/admin" | "/admin/orders" | "/admin/products" | "/admin/settings";
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}> = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar({ adminEmail }: { adminEmail: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutAdmin();
    navigate({ to: "/login" });
  };

  return (
    <aside className="w-60 shrink-0 border-r border-border/60 bg-surface/60 backdrop-blur-sm hidden md:flex md:flex-col">
      <div className="h-16 flex items-center gap-2 px-5 border-b border-border/60">
        <span className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
          <Flower2 className="h-4 w-4" />
        </span>
        <span className="font-display text-base">Admin</span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {items.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? pathname === to : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border/60 space-y-3">
        <p className="text-xs text-muted-foreground break-all">{adminEmail}</p>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
