import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { OrderActions } from "@/components/admin/orders/OrderActions";
import { OrderHeader } from "@/components/admin/orders/OrderHeader";
import { OrderItemsList } from "@/components/admin/orders/OrderItemsList";
import { OrderTimeline } from "@/components/admin/orders/OrderTimeline";
import {
  OrderAddressBlock,
  OrderDetailCard,
  OrderInfoRow,
  formatDeliveryMethod,
  formatOptionalDate,
  formatPaymentProvider,
  formatPaymentStatus,
} from "@/components/admin/orders/order-detail-ui";
import { EmptyState } from "@/components/ui-kit/EmptyState";
import {
  getAdminOrder,
  sendAdminOrderPaymentReminder,
  updateAdminOrderPaymentStatus,
  updateAdminOrderStatus,
  type ApiOrder,
} from "@/lib/orders-api";
import { formatDate, formatPrice } from "@/lib/format";
import type { OrderStatus } from "@/types";

export const Route = createFileRoute("/admin/orders/$id")({
  head: () => ({
    meta: [{ title: "Order details - Admin" }],
  }),
  component: AdminOrderDetailPage,
});

type PaymentStatus =
  | "pending"
  | "paid"
  | "cancelled"
  | "refunded";

function AdminOrderDetailPage() {
  const { id } = Route.useParams();

  const [order, setOrder] = useState<
    ApiOrder | null | undefined
  >(undefined);

  const [isUpdatingStatus, setIsUpdatingStatus] =
    useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] =
    useState(false);
  const [
    isSendingPaymentReminder,
    setIsSendingPaymentReminder,
  ] = useState(false);

  const [statusError, setStatusError] =
    useState<string | null>(null);
  const [paymentError, setPaymentError] =
    useState<string | null>(null);
  const [
    paymentReminderMessage,
    setPaymentReminderMessage,
  ] = useState<string | null>(null);

  const [isShippingFormOpen, setIsShippingFormOpen] =
    useState(false);
  const [trackingCarrier, setTrackingCarrier] =
    useState("");
  const [trackingNumber, setTrackingNumber] =
    useState("");

  useEffect(() => {
    getAdminOrder(id)
      .then(setOrder)
      .catch(() => setOrder(null));
  }, [id]);

  function mergeUpdatedOrder(updatedOrder: ApiOrder) {
    setOrder((current) => {
      if (!current) return current;

      return {
        ...current,
        status: updatedOrder.status,
        paymentStatus: updatedOrder.paymentStatus,
        paymentProvider: updatedOrder.paymentProvider,
        paymentReference: updatedOrder.paymentReference,
        paidAt: updatedOrder.paidAt,
        trackingNumber: updatedOrder.trackingNumber,
        trackingCarrier: updatedOrder.trackingCarrier,
        updatedAt: updatedOrder.updatedAt,
      };
    });
  }

  async function handleStatusChange(status: OrderStatus) {
    if (!order) return;

    if (status === "shipped") {
      setTrackingCarrier(order.trackingCarrier || "");
      setTrackingNumber(order.trackingNumber || "");
      setIsShippingFormOpen(true);
      return;
    }

    setIsUpdatingStatus(true);
    setStatusError(null);

    try {
      const updatedOrder = await updateAdminOrderStatus(
        order.reference,
        status
      );

      mergeUpdatedOrder(updatedOrder);
    } catch {
      setStatusError("Could not update order status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  async function handlePaymentStatusChange(
    paymentStatus: PaymentStatus
  ) {
    if (!order) return;

    setIsUpdatingPayment(true);
    setPaymentError(null);

    try {
      const updatedOrder =
        await updateAdminOrderPaymentStatus(
          order.reference,
          paymentStatus
        );

      mergeUpdatedOrder(updatedOrder);
    } catch (error) {
      setPaymentError(
        error instanceof Error
          ? error.message
          : "Could not update payment status."
      );
    } finally {
      setIsUpdatingPayment(false);
    }
  }

  async function handleSendPaymentReminder() {
    if (!order) return;

    setIsSendingPaymentReminder(true);
    setPaymentError(null);
    setPaymentReminderMessage(null);

    try {
      await sendAdminOrderPaymentReminder(order.reference);
      setPaymentReminderMessage(
        "Payment reminder sent to the customer."
      );
    } catch (error) {
      setPaymentError(
        error instanceof Error
          ? error.message
          : "Could not send payment reminder."
      );
    } finally {
      setIsSendingPaymentReminder(false);
    }
  }

  async function handleMarkShipped() {
    if (!order) return;

    setIsUpdatingStatus(true);
    setStatusError(null);

    try {
      const updatedOrder = await updateAdminOrderStatus(
        order.reference,
        "shipped",
        {
          trackingCarrier,
          trackingNumber,
        }
      );

      mergeUpdatedOrder(updatedOrder);
      setIsShippingFormOpen(false);
    } catch {
      setStatusError("Could not mark order as shipped.");
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  function toggleShippingForm() {
    if (!order) return;

    setTrackingCarrier(order.trackingCarrier || "");
    setTrackingNumber(order.trackingNumber || "");
    setIsShippingFormOpen((current) => !current);
  }

  if (order === undefined) {
    return (
      <AdminLayout title={`Order #${id}`}>
        <p className="text-sm text-muted-foreground">
          Loading order details...
        </p>
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
        <OrderHeader order={order} />

        <div className="grid xl:grid-cols-[1fr_0.9fr] gap-6">
          <div className="space-y-6">
            <OrderItemsList items={order.items ?? []} />

            <OrderDetailCard title="Personalization">
              <OrderInfoRow
                label="Personalized name"
                value={order.customName || "-"}
              />
              <OrderInfoRow
                label="Message"
                value={order.customMessage || "-"}
              />
              <OrderInfoRow
                label="Internal notes"
                value={order.internalNotes || "-"}
              />
            </OrderDetailCard>

            <OrderDetailCard title="Delivery / pickup">
              <OrderInfoRow
                label="Method"
                value={formatDeliveryMethod(
                  order.customer.deliveryMethod
                )}
              />
              <OrderInfoRow
                label="Date"
                value={formatOptionalDate(
                  order.customer.deliveryDate
                )}
              />
              <OrderInfoRow
                label="Time slot"
                value={
                  order.customer.deliveryTimeSlot || "-"
                }
              />
              <OrderInfoRow
                label="Recipient phone"
                value={
                  order.customer.recipientPhone ||
                  order.customer.phone ||
                  "-"
                }
              />
              <OrderInfoRow
                label="Address"
                value={<OrderAddressBlock order={order} />}
              />
              <OrderInfoRow
                label="Instructions"
                value={
                  order.customer.deliveryInstructions || "-"
                }
              />
              <OrderInfoRow
                label="Carrier"
                value={order.trackingCarrier || "-"}
              />
              <OrderInfoRow
                label="Tracking number"
                value={order.trackingNumber || "-"}
              />
            </OrderDetailCard>
          </div>

          <div className="space-y-6">
            <OrderActions
              order={order}
              isUpdatingStatus={isUpdatingStatus}
              isUpdatingPayment={isUpdatingPayment}
              isSendingPaymentReminder={
                isSendingPaymentReminder
              }
              statusError={statusError}
              paymentReminderMessage={
                paymentReminderMessage
              }
              isShippingFormOpen={isShippingFormOpen}
              trackingCarrier={trackingCarrier}
              trackingNumber={trackingNumber}
              onStatusChange={handleStatusChange}
              onSendPaymentReminder={
                handleSendPaymentReminder
              }
              onToggleShippingForm={toggleShippingForm}
              onTrackingCarrierChange={
                setTrackingCarrier
              }
              onTrackingNumberChange={
                setTrackingNumber
              }
              onMarkShipped={handleMarkShipped}
            />

            <OrderDetailCard title="Customer">
              <OrderInfoRow
                label="Name"
                value={
                  `${order.customer.firstName} ${order.customer.lastName}`.trim() ||
                  "-"
                }
              />
              <OrderInfoRow
                label="Email"
                value={order.customer.email || "-"}
              />
              <OrderInfoRow
                label="Phone"
                value={order.customer.phone || "-"}
              />
            </OrderDetailCard>

            <OrderDetailCard title="Payment">
              <div className="space-y-3 pb-3 mb-1 border-b border-border/50">
                <label className="text-sm text-muted-foreground">
                  Payment status
                </label>

                <select
                  value={order.paymentStatus}
                  disabled={isUpdatingPayment}
                  onChange={(event) =>
                    handlePaymentStatusChange(
                      event.target.value as PaymentStatus
                    )
                  }
                  className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>

                {paymentError ? (
                  <p className="text-xs text-destructive">
                    {paymentError}
                  </p>
                ) : null}

                <p className="text-xs text-muted-foreground">
                  Setting payment to paid confirms the bank transfer and fills the paid date.
                </p>
              </div>

              <OrderInfoRow
                label="Status"
                value={formatPaymentStatus(
                  order.paymentStatus
                )}
              />
              <OrderInfoRow
                label="Provider"
                value={formatPaymentProvider(
                  order.paymentProvider
                )}
              />
              <OrderInfoRow
                label="Reference"
                value={
                  order.paymentReference ||
                  order.reference
                }
              />
              <OrderInfoRow
                label="Paid at"
                value={
                  order.paidAt
                    ? formatDate(order.paidAt)
                    : "-"
                }
              />
              <OrderInfoRow
                label="Subtotal"
                value={formatPrice(order.subtotalCents)}
              />
              <OrderInfoRow
                label="Shipping"
                value={formatPrice(order.shippingCents)}
              />
              <OrderInfoRow
                label="Tax"
                value={formatPrice(order.taxCents)}
              />
              <OrderInfoRow
                label="Total"
                value={formatPrice(order.totalCents)}
              />
            </OrderDetailCard>

            <OrderTimeline order={order} />
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
      <ArrowLeft className="h-4 w-4" />
      Back to orders
    </Link>
  );
}
