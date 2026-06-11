import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";

export const Route = createFileRoute("/legal/cookies")({
  head: () => ({
    meta: [
      { title: "Cookie Policy - Elamora" },
      {
        name: "description",
        content:
          "Elamora cookie policy explaining the functional cookies and local storage used by the website.",
      },
      { property: "og:title", content: "Cookie Policy - Elamora" },
      {
        property: "og:description",
        content:
          "Learn which cookies and local storage are used by Elamora and why they are necessary.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: CookiePolicyPage,
});

const sections = [
  {
    title: "1. What this policy covers",
    body: [
      "This Cookie Policy explains how Elamora uses cookies, local storage and similar technologies on the website.",
      "At this stage, Elamora does not use analytics cookies, advertising pixels, social tracking cookies or marketing cookies.",
    ],
  },
  {
    title: "2. Strictly necessary cookies",
    body: [
      "Elamora may use strictly necessary cookies to make the website work correctly and securely.",
      "For example, the admin area uses a secure session cookie so authorized administrators can stay logged in.",
      "These cookies are required for security and website operation and are not used for advertising or profiling.",
    ],
  },
  {
    title: "3. Functional local storage",
    body: [
      "The website may use local storage to remember functional choices on the visitor's device.",
      "This includes the shopping cart, temporary gift configuration and whether the intro animation has already been seen.",
      "This storage is used only to improve the user experience and keep the website working properly.",
    ],
  },
  {
    title: "4. No analytics or marketing trackers",
    body: [
      "Elamora currently does not load Google Analytics, Google Tag Manager, Meta Pixel, TikTok Pixel, Hotjar, Microsoft Clarity or similar tracking tools.",
      "Because only necessary or functional storage is currently used, Elamora does not show a cookie consent banner at this stage.",
      "If analytics, advertising pixels, social tracking or optional marketing cookies are added later, Elamora should add a consent banner and block those tools until the visitor gives consent where required by applicable law.",
    ],
  },
  {
    title: "5. Managing cookies and local storage",
    body: [
      "Visitors can delete cookies and local storage from their browser settings at any time.",
      "Deleting functional storage may clear the cart, reset the intro animation or require an administrator to log in again.",
    ],
  },
  {
    title: "6. Updates",
    body: [
      "Elamora may update this Cookie Policy if the website adds new tools, payment providers, analytics services or advertising pixels.",
      "The latest version published on this page applies from the date shown above.",
    ],
  },
] as const;

function CookiePolicyPage() {
  return (
    <AppLayout>
      <section className="bg-background">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="mb-10">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">
              Legal
            </p>
            <h1 className="mt-3 font-display text-4xl text-foreground sm:text-5xl">
              Cookie Policy
            </h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Last updated: 11 June 2026
            </p>
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm leading-6 text-emerald-900">
              Elamora currently uses only necessary cookies and functional local
              storage. No analytics or marketing tracker is currently loaded.
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
              to="/legal/confidentialite"
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Privacy Policy
            </Link>
            <Link
              to="/legal/mentions"
              className="inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-3 text-sm font-medium text-foreground transition hover:bg-accent"
            >
              Legal Notice
            </Link>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
