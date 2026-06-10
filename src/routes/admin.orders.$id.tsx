import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { EmptyState } from "@/components/ui-kit/EmptyState";
import {
  getAdminOrder,
  updateAdminOrderStatus,
  type ApiOrder,
} from "@/lib/orders-api";
import { formatDate, formatPrice } from "@/lib/format";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import type { OrderStatus } from "@/types";

export const Route = createFileRoute("/admin/orders/$id")({
  head: () => ({ meta: [{ title: "Order details - Admin" }] }),
  component: AdminOrderDetailPage,
});

const statuses: OrderStatus[] = [
  "pending_bank_transfer",
  "pending",
  "confirmed",
  "preparing",
  "completed",
  "cancelled",
];

function AdminOrderDetailPage() {
  const { id } = Route.useParams();
  const [order, setOrder] = useState<ApiOrder | null | undefined>(undefined);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    getAdminOrder(id)
      .then(setOrder)
      .catch(() => setOrder(null));
  }, [id]);

  const handleStatusChange = async (status: OrderStatus) => {
    if (!order) return;

    setIsUpdatingStatus(true);
    setStatusError(null);

    try {
      const updatedOrder = await updateAdminOrderStatus(order.reference, status);
      setOrder({
        ...order,
        status: updatedOrder.status,
        updatedAt: updatedOrder.updatedAt,
      });
    } catch {
      setStatusError("Could not update order status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (order === undefined) {
    return (
      <AdminLayout title={`Order #${id}`}>
        <p className="text-sm text-muted-foreground">Loading order details...</p>
      </AdminLayout>
    );
  }

  if (order === null) {
    return (
      <AdminLayout title={`Order #${id}`}>
        <BackLink />
        <EmptyState
          icon={<ShoppingBag className="h-5 w-5" />}
          title="Order not found"
          description="This database order does not exist."
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Order #${order.reference}`}>
      <BackLink />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Order overview">
          <InfoRow label="Reference" value={order.reference} />
          <InfoRow
            label="Status"
            value={
              <div className="space-y-2">
                <select
                  value={order.status}
                  disabled={isUpdatingStatus}
                  onChange={(event) => handleStatusChange(event.target.value as OrderStatus)}
                  className="rounded-lg border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                {statusError ? (
                  <p className="text-xs text-destructive">{statusError}</p>
                ) : null}
              </div>
            }
          />
          <InfoRow label="Date" value={formatDate(order.createdAt)} />
          <InfoRow label="Total" value={formatPrice(order.totalCents)} />
          <InfoRow label="Payment status" value={formatPaymentStatus(order.paymentStatus)} />
          <InfoRow label="Payment provider" value={order.paymentProvider || "-"} />
          <InfoRow label="Payment reference" value={order.paymentReference || order.reference} />
          <InfoRow label="Paid at" value={order.paidAt ? formatDate(order.paidAt) : "-"} />
        </Card>

        <Card title="Customer information">
          <InfoRow
            label="Customer"
            value={`${order.customer.firstName} ${order.customer.lastName}`.trim() || "-"}
          />
          <InfoRow label="Email" value={order.customer.email || "-"} />
          <InfoRow label="Phone" value={order.customer.phone || "-"} />
          <InfoRow label="Address" value={order.customer.address || "-"} />
          <InfoRow label="Delivery method" value={order.customer.deliveryMethod} />
        </Card>

        <Card title="Bucket composition">
          {(order.items ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No items found for this order.</p>
          ) : (
            <div className="space-y-3">
              {(order.items ?? []).map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 border border-border/60 rounded-xl px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                    {item.colorName ? (
                      <p className="text-xs text-muted-foreground">Color: {item.colorName}</p>
                    ) : null}
                  </div>
                  <p className="text-sm font-medium">
                    {formatPrice(item.unitPriceCents * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Name & message">
          <InfoRow label="Personalized name" value={order.customName || "-"} />
          <InfoRow label="Message" value={order.customMessage || "-"} />
          <InfoRow label="Internal notes" value={order.internalNotes || "-"} />
          <InfoRow label="Updated at" value={formatDate(order.updatedAt)} />
        </Card>
      </div>
    </AdminLayout>
  );
}

function BackLink() {
  return (
    <Link
      to="/admin/orders"
      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
    >
      <ArrowLeft className="h-4 w-4" /> Back to orders
    </Link>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bg-surface/80 border border-border/60 rounded-2xl p-5 shadow-soft">
      <h2 className="font-display text-lg mb-3">{title}</h2>
      {children}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/50 py-2 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

function formatPaymentStatus(status: string) {
  return status.replaceAll("_", " ");
}
