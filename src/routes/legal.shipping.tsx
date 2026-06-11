import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";

export const Route = createFileRoute("/legal/shipping")({
  head: () => ({
    meta: [
      { title: "Shipping & Pickup Policy - Elamora" },
      {
        name: "description",
        content:
          "Elamora shipping and pickup policy explaining delivery availability, fees, time slots and customer responsibilities.",
      },
      { property: "og:title", content: "Shipping & Pickup Policy - Elamora" },
      {
        property: "og:description",
        content:
          "Delivery, pickup, fees and time slot information for Elamora personalized gifts.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ShippingPolicyPage,
});

const sections = [
  {
    title: "1. Pickup",
    body: [
      "Customers may choose store pickup when this option is available during checkout.",
      "Pickup is free. The exact pickup location and instructions may be confirmed by Elamora when the order is ready.",
      "The customer should wait for confirmation that the order is ready before coming to pick it up.",
    ],
  },
  {
    title: "2. Delivery availability",
    body: [
      "Delivery is available only in the areas covered by Elamora at checkout.",
      "The customer must enter a delivery country and postal code to check whether delivery is available.",
      "If the checkout displays that the delivery area is not covered yet, the customer must choose pickup or contact Elamora before placing the order.",
    ],
  },
  {
    title: "3. Delivery fees",
    body: [
      "Delivery fees are calculated automatically during checkout based on the delivery area.",
      "The final delivery fee is recalculated securely before the order is confirmed.",
      "If no delivery fee is displayed or the area is not covered, delivery is not confirmed.",
    ],
  },
  {
    title: "4. Delivery dates and time slots",
    body: [
      "Customers may select a preferred delivery date and an available delivery time slot when delivery is available.",
      "Current delivery time slots may be shown between 09:00 and 22:00, depending on availability.",
      "Delivery dates and time slots are estimates. They may depend on preparation time, item availability, local conditions and customer responsiveness.",
    ],
  },
  {
    title: "5. Delivery information",
    body: [
      "The customer is responsible for providing accurate delivery details, including address, postal code, city, recipient phone and delivery instructions.",
      "Elamora is not responsible for failed or delayed delivery caused by incorrect, incomplete or unreachable delivery information.",
      "If delivery information is unclear, Elamora may contact the customer before preparing or delivering the order.",
    ],
  },
  {
    title: "6. Delays and unavailable items",
    body: [
      "Because Elamora prepares personalized gifts, delays may occur if a selected product, flower, balloon, plush toy or decorative item is unavailable.",
      "If a replacement is needed, Elamora may contact the customer to agree on a suitable alternative of similar style and value.",
    ],
  },
] as const;

function ShippingPolicyPage() {
  return (
    <AppLayout>
      <section className="bg-background">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="mb-10">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">
              Legal
            </p>
            <h1 className="mt-3 font-display text-4xl text-foreground sm:text-5xl">
              Shipping & Pickup Policy
            </h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Last updated: 11 June 2026
            </p>
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
              Delivery zones and fees are based on the options available during checkout.
              If no delivery zone is available for an address, delivery is not confirmed.
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
              to="/checkout"
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Go to checkout
            </Link>
            <Link
              to="/legal/returns"
              className="inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-3 text-sm font-medium text-foreground transition hover:bg-accent"
            >
              Returns & Support
            </Link>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
