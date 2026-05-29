import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { EmptyState } from "@/components/ui-kit/EmptyState";
import { findLocalOrder, type LocalOrder } from "@/lib/order-storage";
import { formatDate, formatPrice } from "@/lib/format";
import { ArrowLeft, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/admin/orders/$id")({
  head: () => ({ meta: [{ title: "Order details — Admin" }] }),
  component: AdminOrderDetailPage,
});

function AdminOrderDetailPage() {
  const { id } = Route.useParams();
  const [order, setOrder] = useState<LocalOrder | null | undefined>(undefined);

  useEffect(() => {
    setOrder(findLocalOrder(id));
  }, [id]);

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
          description="This local order does not exist in this browser storage."
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
          <InfoRow label="Status" value={order.status} />
          <InfoRow label="Date" value={formatDate(order.createdAt)} />
          <InfoRow label="Total" value={formatPrice(order.totalCents)} />
        </Card>

        <Card title="Customer information">
          <InfoRow
            label="Customer"
            value={`${order.customer.firstName} ${order.customer.lastName}`.trim() || "—"}
          />
          <InfoRow label="Email" value={order.customer.email || "—"} />
          <InfoRow label="Phone" value={order.customer.phone || "—"} />
          <InfoRow label="Address" value={order.customer.address || "—"} />
          <InfoRow label="Delivery method" value={order.customer.deliveryMethod} />
        </Card>

        <Card title="Bucket composition">
          {order.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items found for this order.</p>
          ) : (
            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 border border-border/60 rounded-xl px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
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
          <InfoRow label="Personalized name" value={order.configuration.firstName || "—"} />
          <InfoRow label="Message" value={order.configuration.message || "—"} />
          <InfoRow label="Bucket ID" value={order.configuration.bucketId || "—"} />
          <InfoRow label="Color ID" value={order.configuration.colorId || "—"} />
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
