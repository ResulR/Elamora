import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { EmptyState } from "@/components/ui-kit/EmptyState";
import { ShoppingBag } from "lucide-react";
import type { OrderStatus } from "@/types";

export const Route = createFileRoute("/admin/orders/")({
  head: () => ({ meta: [{ title: "Orders — Admin" }] }),
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
  // TODO: load orders from the backend.
  const orders: never[] = [];

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

      {orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="h-5 w-5" />}
          title="No orders yet"
          description="Customer orders will appear here once payment is enabled."
        />
      ) : (
        <div className="bg-surface/80 border border-border/60 rounded-2xl overflow-hidden">
          {/* TODO: responsive table */}
        </div>
      )}
    </AdminLayout>
  );
}
