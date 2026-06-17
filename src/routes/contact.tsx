import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, MessageCircle, Instagram, MapPin, Clock, FileText } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact - Elamora" },
      {
        name: "description",
        content:
          "Contact Elamora for order questions, bank transfer support, delivery, pickup, returns and personalized gift requests.",
      },
      { property: "og:title", content: "Contact - Elamora" },
      {
        property: "og:description",
        content:
          "Contact Elamora customer support for orders, delivery, pickup and personalized gift requests.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ContactPage,
});

const contactCards = [
  {
    title: "Email support",
    value: "orders@elamora.eu",
    description:
      "Use this email for order questions, payment references, delivery, pickup, cancellation or refund requests.",
    icon: Mail,
    href: "mailto:orders@elamora.eu",
    cta: "Email Elamora",
  },
  {
    title: "WhatsApp",
    value: "To be completed",
    description:
      "A public WhatsApp contact number has not been published yet. Until then, please use email for official support.",
    icon: MessageCircle,
  },
  {
    title: "Instagram",
    value: "To be completed",
    description:
      "The official Instagram profile must be confirmed before publication on the website.",
    icon: Instagram,
  },
  {
    title: "Business location",
    value: "Kosovo",
    description:
      "The full registered postal address must be completed before final legal publication and live payment activation.",
    icon: MapPin,
  },
] as const;

function ContactPage() {
  return (
    <AppLayout>
      <section className="bg-background">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">
              Contact
            </p>
            <h1 className="mt-3 font-display text-4xl text-foreground sm:text-5xl">
              Contact Elamora
            </h1>
            <p className="mt-5 text-sm leading-7 text-muted-foreground sm:text-base">
              For any question about an order, bank transfer, pickup, delivery,
              cancellation, return or personalized request, contact Elamora using
              the official details below.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {contactCards.map((card) => {
              const Icon = card.icon;

              const content = (
                <article className="h-full rounded-3xl border border-border/70 bg-card/70 p-6 shadow-sm transition hover:border-primary/30 hover:shadow-soft">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-display text-2xl text-foreground">
                        {card.title}
                      </h2>
                      <p className="mt-1 font-medium text-primary">{card.value}</p>
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">
                        {card.description}
                      </p>
                      {"cta" in card ? (
                        <span className="mt-5 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">
                          {card.cta}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </article>
              );

              return "href" in card ? (
                <a key={card.title} href={card.href} className="block">
                  {content}
                </a>
              ) : (
                <div key={card.title}>{content}</div>
              );
            })}
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-3xl border border-border/70 bg-surface/80 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-2xl text-foreground">
                    Support hours
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    Elamora currently handles customer support by email. Response
                    times may vary depending on order volume, weekends, holidays
                    and product preparation periods.
                  </p>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    For urgent order changes, contact us as soon as possible and
                    include your order reference.
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-950 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-2xl">
                    Business information to complete
                  </h2>
                  <p className="mt-3 text-sm leading-7">
                    WhatsApp, Instagram and the full registered postal address
                    are not published yet. These details should be completed
                    before final legal publication and live payment activation.
                  </p>
                </div>
              </div>
            </article>
          </div>

          <div className="mt-10 rounded-3xl border border-border/70 bg-card/70 p-6 shadow-sm">
            <h2 className="font-display text-2xl text-foreground">
              Before contacting us
            </h2>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-muted-foreground">
              <li>• For an existing order, include your order reference.</li>
              <li>• For bank transfer questions, include the payment reference used.</li>
              <li>• For delivery or pickup questions, include the preferred date and city.</li>
              <li>• For damaged or incorrect products, include clear photos if relevant.</li>
            </ul>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <a
              href="mailto:orders@elamora.eu"
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Contact by email
            </a>
            <Link
              to="/legal/mentions"
              className="inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-3 text-sm font-medium text-foreground transition hover:bg-accent"
            >
              Legal notice
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
