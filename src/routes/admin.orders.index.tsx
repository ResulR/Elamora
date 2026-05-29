import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { EmptyState } from "@/components/ui-kit/EmptyState";
import { getAdminOrders, type ApiOrder } from "@/lib/orders-api";
import { formatDate, formatPrice } from "@/lib/format";
import { ShoppingBag } from "lucide-react";
import type { OrderStatus } from "@/types";

export const Route = createFileRoute("/admin/orders/")({
  head: () => ({ meta: [{ title: "Orders - Admin" }] }),
  component: AdminOrdersPage,
});

const filters: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "preparing", label: "Preparing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function AdminOrdersPage() {
  const [active, setActive] = useState<OrderStatus | "all">("all");
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    getAdminOrders()
      .then((loadedOrders) => {
        setOrders(loadedOrders);
        setLoadError(null);
      })
      .catch(() => {
        setLoadError("Could not load database orders.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const filteredOrders = useMemo(() => {
    if (active === "all") return orders;
    return orders.filter((order) => order.status === active);
  }, [active, orders]);

  return (
    <AdminLayout title="Orders">
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setActive(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
              active === f.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-surface border-border hover:border-primary/60"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading database orders...</p>
      ) : loadError ? (
        <EmptyState
          icon={<ShoppingBag className="h-5 w-5" />}
          title="Could not load orders"
          description={loadError}
        />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="h-5 w-5" />}
          title={orders.length === 0 ? "No orders yet" : "No orders for this status"}
          description={
            orders.length === 0
              ? "Database customer orders will appear here after checkout."
              : "Try another filter to see more database orders."
          }
        />
      ) : (
        <div className="bg-surface/80 border border-border/60 rounded-2xl overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Reference</th>
                  <th className="text-left font-medium px-4 py-3">Customer</th>
                  <th className="text-left font-medium px-4 py-3">Email</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-left font-medium px-4 py-3">Total</th>
                  <th className="text-left font-medium px-4 py-3">Date</th>
                  <th className="text-right font-medium px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-t border-border/60">
                    <td className="px-4 py-3 font-medium">{order.reference}</td>
                    <td className="px-4 py-3">
                      {order.customer.firstName} {order.customer.lastName}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{order.customer.email}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 font-medium">{formatPrice(order.totalCents)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to="/admin/orders/$id"
                        params={{ id: order.reference }}
                        className="text-primary hover:underline"
                      >
                        View details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className="inline-flex rounded-full border border-border px-2.5 py-1 text-xs capitalize">
      {status}
    </span>
  );
}
