import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { EmptyState } from "@/components/ui-kit/EmptyState";
import {
  getAdminOrder,
  updateAdminOrderStatus,
  type ApiOrder,
  type ApiOrderItem,
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
  "confirmed",
  "preparing",
  "ready_for_pickup",
  "shipped",
  "completed",
  "cancelled",
  "refunded",
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
        paymentStatus: updatedOrder.paymentStatus,
        paymentProvider: updatedOrder.paymentProvider,
        paymentReference: updatedOrder.paymentReference,
        paidAt: updatedOrder.paidAt,
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

      <div className="space-y-6">
        <section className="bg-surface/80 border border-border/60 rounded-2xl p-4 md:p-6 shadow-soft">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Order reference
              </p>
              <h2 className="font-display text-3xl md:text-4xl mt-1">
                {order.reference}
              </h2>

              <div className="flex flex-wrap gap-2 mt-4">
                <StatusBadge status={order.status} />
                <SimpleBadge value={formatPaymentStatus(order.paymentStatus)} />
                <SimpleBadge value={order.customer.deliveryMethod} />
              </div>
            </div>

            <div className="md:text-right">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="font-display text-3xl">{formatPrice(order.totalCents)}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Created {formatDate(order.createdAt)}
              </p>
            </div>
          </div>
        </section>

        <div className="grid xl:grid-cols-[1fr_0.9fr] gap-6">
          <div className="space-y-6">
            <Card title="Preparation items">
              {(order.items ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No items found for this order.</p>
              ) : (
                <div className="space-y-3">
                  {(order.items ?? []).map((item) => (
                    <OrderItemRow key={item.id} item={item} />
                  ))}
                </div>
              )}
            </Card>

            <Card title="Personalization">
              <InfoRow label="Personalized name" value={order.customName || "-"} />
              <InfoRow label="Message" value={order.customMessage || "-"} />
              <InfoRow label="Internal notes" value={order.internalNotes || "-"} />
            </Card>

            <Card title="Delivery / pickup">
              <InfoRow label="Method" value={formatDeliveryMethod(order.customer.deliveryMethod)} />
              <InfoRow label="Date" value={formatOptionalDate(order.customer.deliveryDate)} />
              <InfoRow label="Time slot" value={order.customer.deliveryTimeSlot || "-"} />
              <InfoRow label="Recipient phone" value={order.customer.recipientPhone || order.customer.phone || "-"} />
              <InfoRow label="Address" value={<AddressBlock order={order} />} />
              <InfoRow label="Instructions" value={order.customer.deliveryInstructions || "-"} />
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Actions">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Status</label>
                <select
                  value={order.status}
                  disabled={isUpdatingStatus}
                  onChange={(event) => handleStatusChange(event.target.value as OrderStatus)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {formatOrderStatus(status)}
                    </option>
                  ))}
                </select>

                {statusError ? (
                  <p className="text-xs text-destructive">{statusError}</p>
                ) : null}

                <p className="text-xs text-muted-foreground">
                  Changing to confirmed marks the bank transfer as paid. Changing to ready for pickup or shipped sends a client notification.
                </p>
              </div>
            </Card>

            <Card title="Customer">
              <InfoRow
                label="Name"
                value={`${order.customer.firstName} ${order.customer.lastName}`.trim() || "-"}
              />
              <InfoRow label="Email" value={order.customer.email || "-"} />
              <InfoRow label="Phone" value={order.customer.phone || "-"} />
            </Card>

            <Card title="Payment">
              <InfoRow label="Status" value={formatPaymentStatus(order.paymentStatus)} />
              <InfoRow label="Provider" value={formatPaymentProvider(order.paymentProvider)} />
              <InfoRow label="Reference" value={order.paymentReference || order.reference} />
              <InfoRow label="Paid at" value={order.paidAt ? formatDate(order.paidAt) : "-"} />
              <InfoRow label="Subtotal" value={formatPrice(order.subtotalCents)} />
              <InfoRow label="Shipping" value={formatPrice(order.shippingCents)} />
              <InfoRow label="Tax" value={formatPrice(order.taxCents)} />
              <InfoRow label="Total" value={formatPrice(order.totalCents)} />
            </Card>

            <Card title="System">
              <InfoRow label="Order ID" value={order.id} />
              <InfoRow label="Created at" value={formatDate(order.createdAt)} />
              <InfoRow label="Updated at" value={formatDate(order.updatedAt)} />
            </Card>
          </div>
        </div>
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
    <section className="bg-surface/80 border border-border/60 rounded-2xl p-4 md:p-5 shadow-soft">
      <h2 className="font-display text-xl mb-4">{title}</h2>
      {children}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/50 py-3 last:border-b-0">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right break-words min-w-0">{value}</span>
    </div>
  );
}

function OrderItemRow({ item }: { item: ApiOrderItem }) {
  const total = item.unitPriceCents * item.quantity;

  return (
    <div className="border border-border/60 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold">{item.productName}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Qty {item.quantity} × {formatPrice(item.unitPriceCents)}
          </p>

          {item.colorName ? (
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              {item.colorHex ? (
                <span
                  className="h-4 w-4 rounded-full border border-border shrink-0"
                  style={{ background: item.colorHex }}
                />
              ) : null}
              <span>{item.colorName}</span>
            </div>
          ) : null}
        </div>

        <p className="font-medium whitespace-nowrap">{formatPrice(total)}</p>
      </div>
    </div>
  );
}

function AddressBlock({ order }: { order: ApiOrder }) {
  const lines = [
    order.customer.address || order.customer.addressLine1,
    order.customer.addressLine2,
    [order.customer.postalCode, order.customer.city].filter(Boolean).join(" "),
    order.customer.country,
  ].filter(Boolean);

  const hasRealAddress = lines.some((line) => line !== order.customer.country);

  if (lines.length === 0 || !hasRealAddress) {
    return order.customer.deliveryMethod === "pickup"
      ? "Pickup location to be confirmed"
      : "-";
  }

  return (
    <span className="block text-right">
      {lines.map((line) => (
        <span key={line} className="block">
          {line}
        </span>
      ))}
    </span>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className="inline-flex rounded-full border border-border px-2.5 py-1 text-xs capitalize">
      {formatOrderStatus(status)}
    </span>
  );
}

function SimpleBadge({ value }: { value: string }) {
  return (
    <span className="inline-flex rounded-full border border-border px-2.5 py-1 text-xs capitalize">
      {value.replaceAll("_", " ")}
    </span>
  );
}

function formatPaymentStatus(status: string) {
  return status.replaceAll("_", " ");
}

function formatPaymentProvider(provider: string) {
  if (!provider || provider === "bank_transfer") return "Bank transfer";
  return provider.replaceAll("_", " ");
}

function formatDeliveryMethod(method: string) {
  return method === "delivery" ? "Delivery" : "Pickup";
}

function formatOptionalDate(value?: string) {
  return value ? formatDate(value) : "-";
}

function formatOrderStatus(status: OrderStatus) {
  if (status === "pending_bank_transfer") {
    return "Awaiting bank transfer";
  }

  return status.replaceAll("_", " ");
}
