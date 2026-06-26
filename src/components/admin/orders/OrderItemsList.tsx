import type { ApiOrderItem } from "@/lib/orders-api";
import { formatPrice } from "@/lib/format";
import { OrderDetailCard } from "./order-detail-ui";

export function OrderItemsList({
  items,
}: {
  items: ApiOrderItem[];
}) {
  return (
    <OrderDetailCard title="Preparation items">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No items found for this order.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <OrderItemRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </OrderDetailCard>
  );
}

function OrderItemRow({
  item,
}: {
  item: ApiOrderItem;
}) {
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

        <p className="font-medium whitespace-nowrap">
          {formatPrice(total)}
        </p>
      </div>
    </div>
  );
}
