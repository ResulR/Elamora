import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";

export const Route = createFileRoute("/legal/confidentialite")({
  head: () => ({
    meta: [
      { title: "Privacy Policy - Elamora" },
      {
        name: "description",
        content:
          "Elamora privacy policy explaining how personal data is collected, used, stored and protected.",
      },
      { property: "og:title", content: "Privacy Policy - Elamora" },
      {
        property: "og:description",
        content:
          "Learn how Elamora handles personal data for orders, delivery, payment, support and website security.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PrivacyPolicyPage,
});

const dataSections = [
  {
    title: "1. Data controller",
    body: [
      "Elamora is a personalized gift business located in Kosovo.",
      "For any privacy-related request, customers can contact Elamora at orders@elamora.eu.",
    ],
  },
  {
    title: "2. Personal data we collect",
    body: [
      "When a customer places an order, Elamora may collect identity and contact details such as first name, last name, email address, phone number and delivery information.",
      "Elamora may also collect order details such as selected products, personalization text, custom names, messages, colors, delivery method, order reference, payment status and customer support messages.",
      "Technical data may be processed for website security and operation, such as IP address, browser information, request logs and basic device information.",
    ],
  },
  {
    title: "3. Why we use personal data",
    body: [
      "Elamora uses personal data to process orders, prepare personalized gifts, manage payment confirmation, organize pickup or delivery, send order emails, provide customer support and protect the website against fraud or abuse.",
      "Elamora may also use limited data for accounting, administrative follow-up, dispute management and legal compliance.",
    ],
  },
  {
    title: "4. Legal bases",
    body: [
      "Order and delivery data is processed because it is necessary to perform the sale contract with the customer.",
      "Some data may be processed to comply with legal, tax, accounting or consumer protection obligations.",
      "Security logs, fraud prevention and internal administration may be processed on the basis of Elamora's legitimate interest in operating a safe and reliable service.",
      "If Elamora later adds optional marketing emails or non-essential cookies, consent should be collected where required by applicable law.",
    ],
  },
  {
    title: "5. Data retention",
    body: [
      "Order data is kept for as long as necessary to manage the order, customer service, accounting, legal obligations and potential disputes.",
      "Support messages are kept for the time necessary to respond and follow up on the request.",
      "Technical logs should be kept only for a limited period necessary for security, debugging and abuse prevention.",
      "Exact retention periods must be reviewed and completed with a qualified legal professional before live payment activation.",
    ],
  },
  {
    title: "6. Who can access the data",
    body: [
      "Personal data may be accessed by authorized Elamora administrators only when necessary for order processing, delivery, support, payment follow-up or website operation.",
      "Elamora may use technical service providers for hosting, email delivery, payment processing, database storage or website maintenance.",
      "Service providers should only process personal data according to Elamora's instructions and for the purposes described in this policy.",
    ],
  },
  {
    title: "7. International transfers",
    body: [
      "The website is hosted on an OVH VPS and may involve technical processing outside Kosovo depending on the hosting, email, payment or infrastructure providers used.",
      "Where required by applicable law, Elamora should ensure that appropriate safeguards are in place for international data transfers.",
    ],
  },
  {
    title: "8. Customer rights",
    body: [
      "Depending on applicable law, customers may have the right to access their personal data, request correction, request deletion, object to certain processing, request restriction, and request portability where applicable.",
      "Some requests may be refused or limited if Elamora must keep the data for accounting, legal, contractual, fraud prevention or dispute purposes.",
      "Customers can exercise their rights by contacting orders@elamora.eu with enough information to identify the relevant order or account.",
    ],
  },
  {
    title: "9. Security",
    body: [
      "Elamora applies reasonable technical and organizational measures to protect personal data, including secure admin access, server-side processing, HTTPS and restricted access to order administration.",
      "No online service can guarantee absolute security. Customers should contact Elamora immediately if they suspect an issue involving their personal data.",
    ],
  },
  {
    title: "10. Cookies and tracking",
    body: [
      "At this stage, the website is intended to use only technical cookies or local storage required for basic operation, cart behavior, admin sessions or user experience.",
      "If analytics, advertising pixels, social tracking or optional marketing cookies are added later, a dedicated cookie banner and consent settings should be implemented before activation.",
    ],
  },
  {
    title: "11. Updates to this policy",
    body: [
      "Elamora may update this Privacy Policy when the website, legal requirements, payment methods or service providers change.",
      "The latest version published on this page applies from the date shown above.",
    ],
  },
] as const;

function PrivacyPolicyPage() {
  return (
    <AppLayout>
      <section className="bg-background">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="mb-10">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">
              Legal
            </p>
            <h1 className="mt-3 font-display text-4xl text-foreground sm:text-5xl">
              Privacy Policy
            </h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Last updated: 11 June 2026
            </p>
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
              This page is a practical privacy policy template for Elamora. It must be
              reviewed by a qualified legal professional in Kosovo before live payment
              activation, especially for retention periods, data transfers and legal bases.
            </div>
          </div>

          <div className="space-y-8">
            {dataSections.map((section) => (
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
              to="/legal/mentions"
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Legal Notice
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
