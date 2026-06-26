import type { ApiOrder } from "@/lib/orders-api";
import { formatDate } from "@/lib/format";
import {
  OrderDetailCard,
  OrderInfoRow,
} from "./order-detail-ui";

export function OrderTimeline({
  order,
}: {
  order: ApiOrder;
}) {
  return (
    <OrderDetailCard title="System">
      <OrderInfoRow label="Order ID" value={order.id} />
      <OrderInfoRow
        label="Created at"
        value={formatDate(order.createdAt)}
      />
      <OrderInfoRow
        label="Updated at"
        value={formatDate(order.updatedAt)}
      />
    </OrderDetailCard>
  );
}
