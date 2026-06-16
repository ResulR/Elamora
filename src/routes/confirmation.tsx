import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Check, Copy, Mail } from "lucide-react";
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

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="h-16 w-16 mx-auto rounded-full bg-success text-success-foreground flex items-center justify-center shadow-bloom">
          <Check className="h-7 w-7" />
        </div>

        <h1 className="font-display text-4xl mt-6">Thank you for your order</h1>
        <p className="mt-3 text-muted-foreground">
          Your order has been saved. Please complete the bank transfer using the details below.
          We will prepare your order after the payment is received and approved.
        </p>

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
            <h2 className="font-display text-xl">Bank transfer instructions</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Please make a bank transfer for the exact total amount. Use your order number as
              the payment reference so we can match your payment quickly.
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
              Your order will remain pending until the bank transfer is received and approved by our team.
              You will receive a confirmation email after approval.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Info label="Order number" value={order.reference} />
            <Info label="Status" value={formatOrderStatus(order.status)} />
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
  if (status === "pending_bank_transfer") {
    return "Awaiting bank transfer";
  }

  return status.replaceAll("_", " ");
}
