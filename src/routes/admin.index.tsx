import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { formatPrice } from "@/lib/format";
import { getAdminOrders, type ApiAdminOrder } from "@/lib/orders-api";
import { fetchAdminCatalog } from "@/lib/admin-catalog-api";
import { ShoppingBag, Clock, TrendingUp, Package } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — Admin" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const [orders, setOrders] = useState<ApiAdminOrder[]>([]);
  const [activeProductsCount, setActiveProductsCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setIsLoading(true);
        setLoadError(null);

        const [nextOrders, catalog] = await Promise.all([
          getAdminOrders(),
          fetchAdminCatalog(),
        ]);

        if (!cancelled) {
          setOrders(nextOrders);
          setActiveProductsCount(
            catalog.allProducts.filter((product) => product.active).length
          );
        }
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setLoadError("Could not load dashboard data from the database.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const pendingOrders = orders.filter((order) =>
      order.status === "pending_bank_transfer"
    ).length;
    const revenueCents = orders.reduce((sum, order) => sum + order.totalCents, 0);

    return [
      {
        label: "Total orders",
        value: isLoading ? "…" : String(orders.length),
        icon: ShoppingBag,
        note: "Database orders",
      },
      {
        label: "Pending orders",
        value: isLoading ? "…" : String(pendingOrders),
        icon: Clock,
        note: "Awaiting bank transfer",
      },
      {
        label: "Revenue",
        value: isLoading ? "…" : formatPrice(revenueCents),
        icon: TrendingUp,
        note: "From database orders",
      },
      {
        label: "Active products",
        value: isLoading ? "…" : String(activeProductsCount ?? 0),
        icon: Package,
        note: "From PostgreSQL catalog",
      },
    ];
  }, [orders, activeProductsCount, isLoading]);

  const recentOrders = orders.slice(0, 5);

  return (
    <AdminLayout title="Dashboard">
      {loadError ? (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError}
        </div>
      ) : null}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-surface/80 border border-border/60 rounded-2xl p-5 shadow-soft"
          >
            <div className="flex items-start justify-between">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <s.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 font-display text-3xl">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1 italic">{s.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-surface/80 border border-border/60 rounded-2xl p-6 shadow-soft">
        <h2 className="font-display text-lg mb-2">Recent activity</h2>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">
            Loading recent orders from database...
          </p>
        ) : recentOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No database orders yet. The latest orders will appear here.
          </p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border border-border/60 rounded-xl px-4 py-3"
              >
                <div>
                  <p className="font-medium">{order.reference}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.customer.firstName} {order.customer.lastName} — {order.status}
                  </p>
                </div>
                <p className="text-sm font-medium">{formatPrice(order.totalCents)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
