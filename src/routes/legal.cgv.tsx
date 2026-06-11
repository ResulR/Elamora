import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";

export const Route = createFileRoute("/legal/cgv")({
  head: () => ({
    meta: [
      { title: "Terms of Sale - Elamora" },
      {
        name: "description",
        content:
          "Elamora terms of sale for personalized gifts, custom orders, payment, delivery, cancellations and returns.",
      },
      { property: "og:title", content: "Terms of Sale - Elamora" },
      {
        property: "og:description",
        content:
          "Read the terms that apply when ordering a personalized Elamora gift.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: TermsOfSalePage,
});

const sections = [
  {
    title: "1. Purpose",
    body: [
      "These Terms of Sale explain the conditions that apply when a customer places an order on Elamora for personalized gifts, gift boxes, flowers, balloons, plush toys, custom names, messages and related accessories.",
      "By placing an order, the customer confirms that they have read and accepted these Terms of Sale before payment or order confirmation.",
    ],
  },
  {
    title: "2. Seller information",
    body: [
      "Elamora is a personalized gift business located in Kosovo.",
      "The full legal registration details, business address and tax details must be completed before live payment activation and before using this page as a final legal document.",
      "Contact email: orders@elamora.eu",
    ],
  },
  {
    title: "3. Products and personalization",
    body: [
      "Elamora products are prepared according to the customer's choices, including gift model, flowers, balloons, colors, plush toys, name, message and other personalization details.",
      "Product photos are examples of style and presentation. Because products are handmade and may include flowers or decorative items, small differences in color, shape, availability or arrangement may occur.",
      "If a selected item is unavailable, Elamora may contact the customer to agree on a suitable replacement of similar style and value before preparation.",
    ],
  },
  {
    title: "4. Prices and payment",
    body: [
      "Prices are displayed before checkout and may include the selected product, personalization options and any applicable delivery fee.",
      "The order is processed after payment confirmation or manual approval, depending on the payment method available at checkout.",
      "For bank transfer orders, the customer must use the order reference when paying. The order may remain pending until payment is confirmed.",
    ],
  },
  {
    title: "5. Order confirmation",
    body: [
      "After placing an order, the customer receives an order reference. This confirms that the order request has been received, but preparation may depend on payment confirmation, availability and delivery details.",
      "Elamora may contact the customer if information is missing, unclear or impossible to fulfill.",
    ],
  },
  {
    title: "6. Delivery and pickup",
    body: [
      "Available delivery and pickup options are shown during checkout.",
      "Delivery dates and time slots are estimates and may depend on product availability, preparation time, local delivery conditions and customer responsiveness.",
      "If pickup is selected, the exact pickup location or instructions may be confirmed separately when the order is ready.",
    ],
  },
  {
    title: "7. Cancellations and personalized items",
    body: [
      "Because Elamora products are customized and prepared according to the customer's personal choices, cancellation or return may be refused once preparation has started, except where mandatory consumer law requires otherwise.",
      "This includes items personalized with a name, message, chosen colors, selected composition or other customer-specific details.",
      "If the customer needs to cancel an order, they should contact Elamora as soon as possible. If preparation has not started, Elamora may accept the cancellation and refund the payment where applicable.",
    ],
  },
  {
    title: "8. Returns and refunds",
    body: [
      "Personalized products cannot normally be returned simply because the customer changed their mind after preparation has started or after delivery.",
      "A refund or replacement may be offered if the product is defective, damaged before delivery, materially different from the confirmed order, or if Elamora made an error.",
      "The customer should contact Elamora as soon as possible with the order reference, a description of the issue and clear photos where relevant.",
    ],
  },
  {
    title: "9. Customer responsibilities",
    body: [
      "The customer is responsible for providing accurate contact, delivery, personalization and payment information.",
      "Elamora is not responsible for failed delivery, delays or personalization errors caused by incorrect or incomplete information provided by the customer.",
    ],
  },
  {
    title: "10. Limitation of liability",
    body: [
      "Elamora is not responsible for indirect loss, loss of opportunity or issues caused by events outside its reasonable control.",
      "Nothing in these Terms of Sale excludes rights that cannot legally be excluded under applicable mandatory consumer protection law.",
    ],
  },
  {
    title: "11. Applicable law",
    body: [
      "These Terms of Sale are intended for a business located in Kosovo and customers ordering in Kosovo.",
      "They must be reviewed by a qualified legal professional before live launch to confirm the applicable law, mandatory consumer rights, business identity requirements and refund wording.",
    ],
  },
  {
    title: "12. Contact",
    body: [
      "For any question about an order, cancellation, return or refund, the customer can contact Elamora by email.",
      "Email: orders@elamora.eu",
    ],
  },
] as const;

function TermsOfSalePage() {
  return (
    <AppLayout>
      <section className="bg-background">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="mb-10">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">
              Legal
            </p>
            <h1 className="mt-3 font-display text-4xl text-foreground sm:text-5xl">
              Terms of Sale
            </h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Last updated: 11 June 2026
            </p>
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
              This page is a practical legal template for Elamora and must be reviewed by a
              qualified legal professional in Kosovo before live payment activation.
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
              to="/configure"
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Create your gift
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-3 text-sm font-medium text-foreground transition hover:bg-accent"
            >
              Back to home
            </Link>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
