import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Check } from "lucide-react";

export const Route = createFileRoute("/confirmation")({
  head: () => ({
    meta: [
      { title: "Order confirmed — Elamora" },
      { name: "description", content: "Your order has been received." },
    ],
  }),
  component: ConfirmationPage,
});

function ConfirmationPage() {
  // TODO: retrieve the real order number from the backend.
  const fakeOrderNumber = "ELA-000000";

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="h-16 w-16 mx-auto rounded-full bg-success text-success-foreground flex items-center justify-center shadow-bloom">
          <Check className="h-7 w-7" />
        </div>
        <h1 className="font-display text-4xl mt-6">Thank you for your order</h1>
        <p className="mt-3 text-muted-foreground">
          Your personalized gift bucket is being prepared.
          You will receive a confirmation email soon.
        </p>

        <div className="mt-8 inline-block bg-surface/80 border border-border/60 rounded-2xl px-6 py-4 shadow-soft">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Order number</p>
          <p className="font-display text-2xl text-primary mt-1">{fakeOrderNumber}</p>
        </div>

        <div className="mt-10">
          <Link
            to="/"
            className="inline-block px-6 py-3 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Back to homepage
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
