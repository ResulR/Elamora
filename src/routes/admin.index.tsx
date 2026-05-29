import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { loadOrders, type LocalOrder } from "@/lib/order-storage";
import { formatPrice } from "@/lib/format";
import { ShoppingBag, Clock, TrendingUp, Package } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — Admin" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const [orders, setOrders] = useState<LocalOrder[]>([]);

  useEffect(() => {
    setOrders(loadOrders());
  }, []);

  const stats = useMemo(() => {
    const pendingOrders = orders.filter((order) => order.status === "pending").length;
    const revenueCents = orders.reduce((sum, order) => sum + order.totalCents, 0);

    return [
      {
        label: "Total orders",
        value: String(orders.length),
        icon: ShoppingBag,
        note: "Local orders",
      },
      {
        label: "Pending orders",
        value: String(pendingOrders),
        icon: Clock,
        note: "Awaiting confirmation",
      },
      {
        label: "Local revenue",
        value: formatPrice(revenueCents),
        icon: TrendingUp,
        note: "From local orders",
      },
      {
        label: "Active products",
        value: "—",
        icon: Package,
        note: "Catalog stats not wired yet",
      },
    ];
  }, [orders]);

  const recentOrders = orders.slice(0, 5);

  return (
    <AdminLayout title="Dashboard">
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

        {recentOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No local orders yet. The latest orders will appear here.
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
