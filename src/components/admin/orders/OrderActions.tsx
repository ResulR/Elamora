import type { ApiOrder } from "@/lib/orders-api";
import type { OrderStatus } from "@/types";
import {
  formatOrderStatus,
  OrderDetailCard,
} from "./order-detail-ui";

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

export function OrderActions({
  order,
  isUpdatingStatus,
  isUpdatingPayment,
  isSendingPaymentReminder,
  statusError,
  paymentReminderMessage,
  isShippingFormOpen,
  trackingCarrier,
  trackingNumber,
  onStatusChange,
  onSendPaymentReminder,
  onToggleShippingForm,
  onTrackingCarrierChange,
  onTrackingNumberChange,
  onMarkShipped,
}: {
  order: ApiOrder;
  isUpdatingStatus: boolean;
  isUpdatingPayment: boolean;
  isSendingPaymentReminder: boolean;
  statusError: string | null;
  paymentReminderMessage: string | null;
  isShippingFormOpen: boolean;
  trackingCarrier: string;
  trackingNumber: string;
  onStatusChange: (status: OrderStatus) => void;
  onSendPaymentReminder: () => void;
  onToggleShippingForm: () => void;
  onTrackingCarrierChange: (value: string) => void;
  onTrackingNumberChange: (value: string) => void;
  onMarkShipped: () => void;
}) {
  const actionsDisabled =
    isUpdatingStatus ||
    isUpdatingPayment ||
    isSendingPaymentReminder;

  return (
    <OrderDetailCard title="Actions">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">
            Current status
          </label>

          <select
            value={order.status}
            disabled={actionsDisabled}
            onChange={(event) =>
              onStatusChange(event.target.value as OrderStatus)
            }
            className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {statuses
              .filter(
                (status) =>
                  (order.status !== "pending_bank_transfer" &&
                    order.paymentStatus === "paid") ||
                  status !== "shipped"
              )
              .map((status) => (
                <option key={status} value={status}>
                  {formatOrderStatus(status)}
                </option>
              ))}
          </select>

          {statusError ? (
            <p className="text-xs text-destructive">
              {statusError}
            </p>
          ) : null}
        </div>

        {order.status === "pending_bank_transfer" ||
        order.paymentStatus !== "paid" ? (
          <div className="rounded-2xl border border-border/60 bg-background p-4 space-y-3">
            <div>
              <p className="text-sm font-medium">
                Payment pending
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Confirm the bank transfer first. This will mark the
                order as paid and confirmed.
              </p>
            </div>

            <button
              type="button"
              disabled={actionsDisabled}
              onClick={() => onStatusChange("confirmed")}
              className="w-full rounded-xl bg-primary text-primary-foreground px-4 py-3 text-sm font-medium disabled:opacity-50"
            >
              Confirm payment
            </button>

            <button
              type="button"
              disabled={actionsDisabled}
              onClick={onSendPaymentReminder}
              className="w-full rounded-xl border border-border px-4 py-3 text-sm font-medium hover:border-primary/60 transition-colors disabled:opacity-50"
            >
              {isSendingPaymentReminder
                ? "Sending reminder..."
                : "Send payment reminder to customer"}
            </button>

            {paymentReminderMessage ? (
              <p className="text-xs text-primary">
                {paymentReminderMessage}
              </p>
            ) : null}
          </div>
        ) : order.status === "cancelled" ||
          order.status === "refunded" ||
          order.status === "completed" ? (
          <div className="rounded-2xl border border-border/60 bg-background p-4">
            <p className="text-sm font-medium">
              No primary action available
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This order is {formatOrderStatus(order.status)}.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/60 bg-background p-4 space-y-3">
            <div>
              <p className="text-sm font-medium">
                {order.status === "shipped"
                  ? "Shipping tracking"
                  : "Ready to ship"}
              </p>

              <p className="text-xs text-muted-foreground mt-1">
                {order.status === "shipped"
                  ? "You can update the carrier or tracking number."
                  : "Add the carrier and tracking number before sending the shipped email."}
              </p>
            </div>

            <button
              type="button"
              onClick={onToggleShippingForm}
              className="w-full rounded-xl bg-primary text-primary-foreground px-4 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {order.status === "shipped"
                ? "Update tracking"
                : "Mark as shipped with tracking"}
            </button>

            {isShippingFormOpen ? (
              <div className="space-y-3 rounded-2xl border border-border/60 bg-surface p-4">
                <label className="block">
                  <span className="text-xs text-muted-foreground">
                    Carrier
                  </span>
                  <input
                    value={trackingCarrier}
                    onChange={(event) =>
                      onTrackingCarrierChange(event.target.value)
                    }
                    placeholder="Colissimo, Chronopost, Bpost..."
                    className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/60"
                  />
                </label>

                <label className="block">
                  <span className="text-xs text-muted-foreground">
                    Tracking number
                  </span>
                  <input
                    value={trackingNumber}
                    onChange={(event) =>
                      onTrackingNumberChange(event.target.value)
                    }
                    placeholder="Tracking number"
                    className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/60"
                  />
                </label>

                <button
                  type="button"
                  disabled={actionsDisabled}
                  onClick={onMarkShipped}
                  className="w-full rounded-xl bg-primary text-primary-foreground px-4 py-3 text-sm font-medium disabled:opacity-50"
                >
                  {order.status === "shipped"
                    ? "Save tracking"
                    : "Confirm shipping"}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </OrderDetailCard>
  );
}
