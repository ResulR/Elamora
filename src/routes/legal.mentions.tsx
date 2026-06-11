import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";

export const Route = createFileRoute("/legal/mentions")({
  head: () => ({
    meta: [
      { title: "Legal Notice - Elamora" },
      {
        name: "description",
        content:
          "Legal notice for Elamora, including publisher, hosting provider, contact information and website responsibility.",
      },
      { property: "og:title", content: "Legal Notice - Elamora" },
      {
        property: "og:description",
        content:
          "Publisher, hosting and contact information for the Elamora website.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: LegalNoticePage,
});

const sections = [
  {
    title: "Website publisher",
    rows: [
      ["Website name", "Elamora"],
      ["Activity", "Personalized gift boutique"],
      ["Business location", "Kosovo"],
      [
        "Legal registration details",
        "To be completed before live payment activation and final legal publication.",
      ],
      [
        "Registered business address",
        "To be completed before live payment activation and final legal publication.",
      ],
      [
        "Publication manager",
        "To be completed by the business owner before final legal publication.",
      ],
      ["Contact email", "orders@elamora.eu"],
    ],
  },
  {
    title: "Hosting provider",
    rows: [
      ["Hosting provider", "OVHcloud"],
      ["Hosting type", "OVH VPS"],
      ["Domain registrar", "OVH"],
      [
        "Hosting provider address",
        "OVHcloud, 2 rue Kellermann, 59100 Roubaix, France.",
      ],
    ],
  },
  {
    title: "Website development and maintenance",
    rows: [
      [
        "Development",
        "The website was developed and deployed for Elamora on an OVH VPS.",
      ],
      [
        "Technical stack",
        "React, TanStack Router, Express API, PostgreSQL, PM2 and Nginx.",
      ],
    ],
  },
] as const;

function LegalNoticePage() {
  return (
    <AppLayout>
      <section className="bg-background">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="mb-10">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">
              Legal
            </p>
            <h1 className="mt-3 font-display text-4xl text-foreground sm:text-5xl">
              Legal Notice
            </h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Last updated: 11 June 2026
            </p>
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
              This page is a practical legal notice template for Elamora. Missing
              business registration details must be completed and reviewed by a
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
                <dl className="mt-5 divide-y divide-border/70">
                  {section.rows.map(([label, value]) => (
                    <div
                      key={label}
                      className="grid gap-1 py-4 text-sm sm:grid-cols-[220px_1fr] sm:gap-6"
                    >
                      <dt className="font-medium text-foreground">{label}</dt>
                      <dd className="leading-7 text-muted-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>

          <article className="mt-8 rounded-3xl border border-border/70 bg-card/70 p-6 shadow-sm">
            <h2 className="font-display text-2xl text-foreground">
              Intellectual property
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              The Elamora name, website content, visuals, layout, text and product
              presentation are protected. Any reproduction or reuse without prior
              written permission is prohibited, except where allowed by applicable law.
            </p>
          </article>

          <article className="mt-8 rounded-3xl border border-border/70 bg-card/70 p-6 shadow-sm">
            <h2 className="font-display text-2xl text-foreground">
              Responsibility
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Elamora makes reasonable efforts to keep the website available and
              accurate. However, temporary interruptions, technical issues or content
              updates may occur. Customers should contact Elamora directly for any
              question about an order, product, payment or delivery.
            </p>
          </article>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/legal/cgv"
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Terms of Sale
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
