import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Check, Copy, Mail, RefreshCw } from "lucide-react";
import {
  getBankTransferInfo,
  getPublicOrder,
  requestOrderRecapEmail,
  type ApiOrder,
  type BankTransferInfo,
} from "@/lib/orders-api";
import { formatDate, formatPrice } from "@/lib/format";

export const Route = createFileRoute("/confirmation")({
  head: () => ({
    meta: [
      { title: "Order confirmed - Elamora" },
      { name: "description", content: "Your order has been received." },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: ConfirmationPage,
});

function ConfirmationPage() {
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [bankTransferInfo, setBankTransferInfo] = useState<BankTransferInfo | null>(null);
  const [confirmationAccess, setConfirmationAccess] = useState<{ reference: string; token: string } | null>(null);
  const [recapStatus, setRecapStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference");
    const token = params.get("token");

    if (!reference || !token) {
      setConfirmationAccess(null);
      setIsLoading(false);
      return;
    }

    setConfirmationAccess({ reference, token });

    Promise.all([getPublicOrder(reference, token), getBankTransferInfo()])
      .then(([loadedOrder, loadedBankTransferInfo]) => {
        setOrder(loadedOrder);
        setBankTransferInfo(loadedBankTransferInfo);
      })
      .catch(() => {
        setOrder(null);
        setBankTransferInfo(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-20 text-center">
          <p className="text-muted-foreground">Loading order confirmation...</p>
        </div>
      </AppLayout>
    );
  }

  if (!order) {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-20 text-center">
          <h1 className="font-display text-4xl">No order found</h1>
          <p className="mt-3 text-muted-foreground">
            Please create and place an order before opening the confirmation page. For security, the confirmation link must include the private order token.
          </p>
          <Link
            to="/configure"
            className="inline-block mt-8 px-6 py-3 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Back to configurator
          </Link>
        </div>
      </AppLayout>
    );
  }


  async function handleSendRecapEmail() {
    if (!confirmationAccess || recapStatus === "sending") {
      return;
    }

    setRecapStatus("sending");

    try {
      await requestOrderRecapEmail(confirmationAccess.reference, confirmationAccess.token);
      setRecapStatus("sent");
    } catch {
      setRecapStatus("error");
    }
  }

  async function handleRefreshStatus() {
    if (!confirmationAccess || isRefreshingStatus) {
      return;
    }

    setIsRefreshingStatus(true);

    try {
      const loadedOrder = await getPublicOrder(confirmationAccess.reference, confirmationAccess.token);
      setOrder(loadedOrder);
    } finally {
      setIsRefreshingStatus(false);
    }
  }

  const statusDetails = getConfirmationStatusDetails(
    order.status,
    order.paymentStatus,
    order.customer?.deliveryMethod
  );

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="h-16 w-16 mx-auto rounded-full bg-success text-success-foreground flex items-center justify-center shadow-bloom">
          <Check className="h-7 w-7" />
        </div>

        <h1 className="font-display text-4xl mt-6">Thank you for your order</h1>
        <p className="mt-3 text-muted-foreground">
          This private confirmation page is linked to your order and always reloads the latest status from our server.
        </p>

        <div className="mt-6 rounded-2xl border border-border/70 bg-surface/80 px-5 py-4 text-left shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Current status</p>
              <h2 className="font-display text-2xl mt-1">{statusDetails.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {statusDetails.description}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void handleRefreshStatus()}
              disabled={isRefreshingStatus}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={["h-4 w-4", isRefreshingStatus ? "animate-spin" : ""].join(" ")} />
              {isRefreshingStatus ? "Refreshing..." : "Refresh status"}
            </button>
          </div>

          <div className="mt-4 grid sm:grid-cols-3 gap-3 text-sm">
            <Info label="Order status" value={formatOrderStatus(order.status)} />
            <Info label="Payment" value={formatPaymentStatus(order.paymentStatus)} />
            <Info label="Last updated" value={formatDate(order.updatedAt)} />
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-left">
          <p className="text-sm font-medium">Save this page or check your email.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This private page contains your order details and bank transfer instructions. Avoid sharing the link.
          </p>
          <button
            type="button"
            onClick={() => void handleSendRecapEmail()}
            disabled={recapStatus === "sending"}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/30 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Mail className="h-4 w-4" />
            {recapStatus === "sending" ? "Sending..." : "Send me a recap email"}
          </button>
          {recapStatus === "sent" ? (
            <p className="mt-2 text-xs text-success">Recap email sent.</p>
          ) : null}
          {recapStatus === "error" ? (
            <p className="mt-2 text-xs text-destructive">Could not send the recap email. Please try again later.</p>
          ) : null}
        </div>

        <div className="mt-8 bg-surface/80 border border-border/60 rounded-2xl p-6 shadow-soft text-left">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 mb-6">
            <h2 className="font-display text-xl">
              {order.paymentStatus === "paid" ? "Payment details" : "Bank transfer instructions"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {order.paymentStatus === "paid"
                ? "Your payment has been approved. You can still keep these details for your records."
                : "Please make a bank transfer for the exact total amount. Use your order number as the payment reference so we can match your payment quickly."}
            </p>

            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              <BankInfo label="Beneficiary" value={bankTransferInfo?.beneficiary ?? "-"} />
              <BankInfo label="Bank name" value={bankTransferInfo?.bankName ?? "-"} />
              <BankInfo label="IBAN" value={bankTransferInfo?.iban ?? "-"} copyable />
              <BankInfo label="Currency" value={bankTransferInfo?.currency ?? "EUR"} />
              <BankInfo label="Amount" value={formatPrice(order.totalCents)} />
              <BankInfo label="Payment reference" value={order.reference} copyable />
            </div>

            <p className="mt-4 text-xs text-muted-foreground italic">
              {order.paymentStatus === "paid"
                ? "Your order is now moving through the preparation and delivery workflow."
                : "Your order will remain pending until the bank transfer is received and approved by our team. You will receive a confirmation email after approval."}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Info label="Order number" value={order.reference} />
            <Info label="Status" value={formatOrderStatus(order.status)} />
            <Info label="Payment" value={formatPaymentStatus(order.paymentStatus)} />
            <Info label="Created at" value={formatDate(order.createdAt)} />
            <Info label="Total" value={formatPrice(order.totalCents)} />
          </div>

          <div className="mt-6 border-t border-border pt-4">
            <h2 className="font-display text-lg mb-3">Composition</h2>
            <ul className="space-y-2">
              {(order.items ?? []).map((item) => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.productName} x {item.quantity}
                  </span>
                  <span>{formatPrice(item.unitPriceCents * item.quantity)}</span>
                </li>
              ))}
            </ul>
          </div>

          {(order.customName || order.customMessage) && (
            <div className="mt-6 border-t border-border pt-4">
              <h2 className="font-display text-lg mb-3">Personalization</h2>
              {order.customName && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Name:</span>{" "}
                  {order.customName}
                </p>
              )}
              {order.customMessage && (
                <p className="text-sm mt-1">
                  <span className="text-muted-foreground">Message:</span>{" "}
                  {order.customMessage}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-10">
          <Link
            to="/configure"
            className="inline-block px-6 py-3 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Create another gift
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function BankInfo({
  label,
  value,
  copyable = false,
}: {
  label: string;
  value: string;
  copyable?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center justify-between gap-3">
        <p className="font-medium break-all">{value}</p>
        {copyable ? (
          <button
            type="button"
            onClick={() => void navigator.clipboard?.writeText(value)}
            className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            aria-label={`Copy ${label}`}
          >
            <Copy className="h-3 w-3" />
            Copy
          </button>
        ) : null}
      </div>
    </div>
  );
}

function formatOrderStatus(status: string) {
  const labels: Record<string, string> = {
    pending_bank_transfer: "Awaiting bank transfer",
    confirmed: "Payment confirmed",
    preparing: "Preparing",
    ready_for_pickup: "Ready for pickup",
    shipped: "Shipped",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return labels[status] ?? status.replaceAll("_", " ");
}

function formatPaymentStatus(status?: string) {
  const labels: Record<string, string> = {
    pending: "Pending",
    paid: "Paid",
    cancelled: "Cancelled",
    refunded: "Refunded",
  };

  return labels[status ?? "pending"] ?? String(status ?? "pending").replaceAll("_", " ");
}

function getConfirmationStatusDetails(
  status: string,
  paymentStatus?: string,
  deliveryMethod?: string
) {
  if (status === "pending_bank_transfer" || paymentStatus === "pending") {
    return {
      title: "Awaiting bank transfer",
      description:
        "We have received your order. Please complete the bank transfer using the payment reference shown below.",
    };
  }

  if (status === "confirmed" || paymentStatus === "paid") {
    return {
      title: "Payment confirmed",
      description:
        "Your payment has been approved. Our team will now prepare your personalized gift.",
    };
  }

  if (status === "preparing") {
    return {
      title: "Preparing your gift",
      description:
        "Your personalized gift is currently being prepared by our team.",
    };
  }

  if (status === "ready_for_pickup") {
    return {
      title: "Ready for pickup",
      description:
        "Your order is ready for pickup. Please bring your order reference with you.",
    };
  }

  if (status === "shipped") {
    return {
      title: deliveryMethod === "pickup" ? "Ready for pickup" : "Shipped",
      description:
        deliveryMethod === "pickup"
          ? "Your order is ready for pickup. Please bring your order reference with you."
          : "Your order has been shipped. We will contact you if any delivery detail needs confirmation.",
    };
  }

  if (status === "completed") {
    return {
      title: "Order completed",
      description:
        "This order has been completed. Thank you for choosing Elamora.",
    };
  }

  if (status === "cancelled") {
    return {
      title: "Order cancelled",
      description:
        "This order has been cancelled. Contact us if you think this is a mistake.",
    };
  }

  return {
    title: formatOrderStatus(status),
    description:
      "This page shows the latest status available for your order.",
  };
}
