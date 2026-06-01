import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Check } from "lucide-react";
import { getPublicOrder, type ApiOrder } from "@/lib/orders-api";
import { formatDate, formatPrice } from "@/lib/format";

export const Route = createFileRoute("/confirmation")({
  head: () => ({
    meta: [
      { title: "Order confirmed - Elamora" },
      { name: "description", content: "Your order has been received." },
    ],
  }),
  component: ConfirmationPage,
});

function ConfirmationPage() {
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const reference = new URLSearchParams(window.location.search).get("reference");

    if (!reference) {
      setIsLoading(false);
      return;
    }

    getPublicOrder(reference)
      .then(setOrder)
      .catch(() => setOrder(null))
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
            Please create and place an order before opening the confirmation page.
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

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="h-16 w-16 mx-auto rounded-full bg-success text-success-foreground flex items-center justify-center shadow-bloom">
          <Check className="h-7 w-7" />
        </div>

        <h1 className="font-display text-4xl mt-6">Thank you for your order</h1>
        <p className="mt-3 text-muted-foreground">
          Your personalized gift bucket has been received. We will contact you soon.
        </p>

        <div className="mt-8 bg-surface/80 border border-border/60 rounded-2xl p-6 shadow-soft text-left">
          <div className="grid sm:grid-cols-2 gap-4">
            <Info label="Order number" value={order.reference} />
            <Info label="Status" value={order.status} />
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
