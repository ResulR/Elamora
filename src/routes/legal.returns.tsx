import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";

export const Route = createFileRoute("/legal/returns")({
  head: () => ({
    meta: [
      { title: "Returns & Support Policy - Elamora" },
      {
        name: "description",
        content:
          "Elamora returns and support policy for personalized gifts, cancellations, refunds, defects and customer service.",
      },
      { property: "og:title", content: "Returns & Support Policy - Elamora" },
      {
        property: "og:description",
        content:
          "Returns, refunds and support rules for Elamora personalized gifts.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ReturnsPolicyPage,
});

const sections = [
  {
    title: "1. Personalized products",
    body: [
      "Most Elamora products are personalized and prepared according to the customer's choices, such as name, message, colors, composition, flowers, balloons, plush toys or gift style.",
      "Because of this personalization, an order cannot normally be cancelled, returned or refunded once preparation has started, except where mandatory consumer law requires otherwise.",
    ],
  },
  {
    title: "2. Cancellation before preparation",
    body: [
      "If the customer wants to cancel an order, they should contact Elamora as soon as possible at orders@elamora.eu.",
      "If preparation has not started and no custom item has been ordered or prepared, Elamora may accept the cancellation and refund the payment where applicable.",
      "If preparation has already started, cancellation may be refused or only partially refunded depending on the work and materials already used.",
    ],
  },
  {
    title: "3. Defective, damaged or incorrect orders",
    body: [
      "If an order is defective, damaged before delivery, materially different from the confirmed order, or prepared incorrectly by Elamora, the customer should contact Elamora as soon as possible.",
      "The customer should provide the order reference, a clear description of the issue and photos where relevant.",
      "Depending on the situation, Elamora may offer a correction, replacement, partial refund or full refund.",
    ],
  },
  {
    title: "4. Non-refundable situations",
    body: [
      "A personalized product is normally not refundable simply because the customer changed their mind after preparation started or after delivery.",
      "Elamora is not responsible for errors caused by incorrect personalization text, wrong delivery details, unreachable recipient information or incomplete instructions provided by the customer.",
      "Perishable or fragile items such as flowers and balloons may naturally vary in appearance and availability.",
    ],
  },
  {
    title: "5. Refund method and timing",
    body: [
      "If a refund is approved, it is normally made using the original payment method where possible.",
      "Refund timing may depend on the payment provider, bank processing time and the payment method used.",
      "For bank transfer orders, Elamora may ask for the necessary refund details.",
    ],
  },
  {
    title: "6. Customer support",
    body: [
      "For any issue with an order, cancellation, refund, delivery or pickup, the customer can contact Elamora at orders@elamora.eu.",
      "The customer should include the order reference to help Elamora handle the request quickly.",
    ],
  },
] as const;

function ReturnsPolicyPage() {
  return (
    <AppLayout>
      <section className="bg-background">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="mb-10">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">
              Legal
            </p>
            <h1 className="mt-3 font-display text-4xl text-foreground sm:text-5xl">
              Returns & Support Policy
            </h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Last updated: 11 June 2026
            </p>
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
              Personalized products are normally not refundable once preparation has
              started, except in case of defect, damage, incorrect preparation or
              mandatory consumer rights.
            </div>
          </div>

          <div className="space-y-8">
            {sections.map((section) => (
              <article
                key={section.title}
                className="rounded-3xl border border-border/70 bg-card/70 p-6 shadow-sm"
              >
                <h2 className="font-display text-2xl text-foreground">
                  {section.title}
                </h2>
                <div className="mt-4 space-y-3">
                  {section.body.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-sm leading-7 text-muted-foreground"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/legal/shipping"
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Shipping & Pickup
            </Link>
            <Link
              to="/legal/cgv"
              className="inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-3 text-sm font-medium text-foreground transition hover:bg-accent"
            >
              Terms of Sale
            </Link>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
