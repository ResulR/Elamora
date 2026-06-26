import type { ApiOrder } from "@/lib/orders-api";
import { formatDate, formatPrice } from "@/lib/format";
import {
  formatPaymentStatus,
  OrderSimpleBadge,
  OrderStatusBadge,
} from "./order-detail-ui";

export function OrderHeader({
  order,
}: {
  order: ApiOrder;
}) {
  return (
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
            <OrderStatusBadge status={order.status} />
            <OrderSimpleBadge
              value={formatPaymentStatus(order.paymentStatus)}
            />
            <OrderSimpleBadge
              value={order.customer.deliveryMethod}
            />
          </div>
        </div>

        <div className="md:text-right">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="font-display text-3xl">
            {formatPrice(order.totalCents)}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Created {formatDate(order.createdAt)}
          </p>
        </div>
      </div>
    </section>
  );
}
