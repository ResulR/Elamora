import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Elamora — Personalized gifts for unforgettable moments" },
      { name: "description", content: "Custom gift boxes, bubble balloons and event compositions made with love for birthdays, baby showers, weddings and more." },
      { property: "og:title", content: "Elamora — Personalized gifts for unforgettable moments" },
      { property: "og:description", content: "Custom gift boxes, bubble balloons and event compositions made with love." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: HomePage,
});

// ─── Data ────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { label: "Bubble Balloons",     icon: "○", desc: "Personalized with a name, message or date" },
  { label: "Gift Boxes",          icon: "◻", desc: "Curated compositions for every occasion" },
  { label: "Baby Gifts",          icon: "☆", desc: "Newborn & baby shower creations" },
  { label: "Couple Gifts",        icon: "♡", desc: "Glasses, ribbons and romantic details" },
  { label: "Balloon Bouquets",    icon: "◯", desc: "Colourful arrangements for celebrations" },
  { label: "Personalized Details",icon: "✦", desc: "Names, dates, messages — made yours" },
] as const;

const CREATIONS = [
  { src: "/creations/baby-elephant-pink.jpg",  alt: "Baby girl composition with pink bubble balloon and elephant plush", label: "Baby Girl Composition" },
  { src: "/creations/couple-glasses.jpg",       alt: "Personalized couple champagne glasses with ivory ribbons",          label: "Couple Glasses"        },
  { src: "/creations/baby-shower-pink.jpg",     alt: "Pink baby shower gift with balloon, bunny plush and flowers",      label: "Baby Shower Gift"      },
  { src: "/creations/baby-shower-blue.jpg",     alt: "Blue baby boy composition with balloon, clothing and flowers",     label: "Baby Boy Composition"  },
  { src: "/creations/bubble-balloon-pink.jpg",  alt: "Pink bubble balloon with personalized text and flowers",           label: "Personalized Balloon"  },
] as const;

const HOW_IT_WORKS = [
  { step: "01", title: "Choose the occasion",       desc: "Birthday, baby shower, wedding, or any special moment." },
  { step: "02", title: "Add your personal details", desc: "A name, a date, a message — we make it unique." },
  { step: "03", title: "We prepare your gift",      desc: "Handcrafted with care and delivered to you." },
] as const;

// ─── Page ────────────────────────────────────────────────────────────────────

function HomePage() {
  return (
    <AppLayout>

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Soft decorative gradient already provided by body styles */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left — text */}
            <div className="text-center lg:text-left max-w-xl mx-auto lg:mx-0">
              <p className="text-xs uppercase tracking-[0.22em] text-primary mb-4 font-medium">
                Handcrafted with love
              </p>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-foreground leading-tight">
                Personalized gifts for{" "}
                <span className="italic text-primary">unforgettable</span>{" "}
                moments
              </h1>
              <p className="mt-5 text-base text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0">
                Balloon compositions, gift boxes and floral arrangements made by hand —
                for birthdays, baby showers, weddings and more.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  to="/configure"
                  className="inline-flex items-center justify-center px-7 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-soft hover:opacity-90 transition-opacity"
                >
                  Create your gift
                </Link>
                <a
                  href="#creations"
                  className="inline-flex items-center justify-center px-7 py-3.5 rounded-full border border-border text-sm font-medium text-foreground hover:bg-surface transition-colors"
                >
                  View creations
                </a>
              </div>
            </div>

            {/* Right — image collage */}
            <div className="relative hidden lg:grid grid-cols-2 gap-4 h-[520px]">
              {/* Large image left */}
              <div className="rounded-2xl overflow-hidden shadow-elevated row-span-2">
                <img
                  src="/creations/baby-shower-pink.jpg"
                  alt="Pink baby shower gift composition"
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>
              {/* Top-right */}
              <div className="rounded-2xl overflow-hidden shadow-soft">
                <img
                  src="/creations/couple-glasses.jpg"
                  alt="Personalized couple champagne glasses"
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>
              {/* Bottom-right */}
              <div className="rounded-2xl overflow-hidden shadow-soft">
                <img
                  src="/creations/bubble-balloon-pink.jpg"
                  alt="Pink personalized bubble balloon"
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>
            </div>

            {/* Mobile — single hero image */}
            <div className="lg:hidden rounded-2xl overflow-hidden shadow-elevated max-h-72 sm:max-h-96">
              <img
                src="/creations/baby-shower-pink.jpg"
                alt="Pink baby shower gift composition"
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ══ WHAT WE CREATE ════════════════════════════════════════════════════ */}
      <section className="py-20 bg-primary-soft/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.22em] text-primary mb-3">Our creations</p>
            <h2 className="font-display text-3xl sm:text-4xl text-foreground">
              What we create
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map(({ label, icon, desc }) => (
              <Link
                key={label}
                to="/configure"
                className="group flex flex-col items-center text-center p-5 rounded-2xl bg-surface hover:shadow-soft transition-shadow border border-border/40 hover:border-primary/30"
              >
                <span className="text-2xl text-primary mb-3 group-hover:scale-110 transition-transform block">
                  {icon}
                </span>
                <span className="font-display text-sm font-medium text-foreground leading-snug mb-1">
                  {label}
                </span>
                <span className="text-xs text-muted-foreground leading-snug hidden sm:block">
                  {desc}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CREATIONS GALLERY ═════════════════════════════════════════════════ */}
      <section id="creations" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.22em] text-primary mb-3">Gallery</p>
            <h2 className="font-display text-3xl sm:text-4xl text-foreground">
              Real creations
            </h2>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">
              Each composition is handcrafted and personalized to order.
            </p>
          </div>

          {/* Masonry-style grid */}
          <div className="columns-2 sm:columns-3 lg:columns-5 gap-4 space-y-4">
            {CREATIONS.map(({ src, alt, label }) => (
              <div key={src} className="break-inside-avoid">
                <div className="rounded-2xl overflow-hidden shadow-soft group relative">
                  <img
                    src={src}
                    alt={alt}
                    className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/40 to-transparent px-3 py-3 translate-y-1 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    <p className="text-white text-xs font-medium tracking-wide">{label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════════════════════════════ */}
      <section id="how" className="py-20 bg-primary-soft/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.22em] text-primary mb-3">Simple process</p>
            <h2 className="font-display text-3xl sm:text-4xl text-foreground">
              How it works
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/12 text-primary font-display text-lg mb-4 shadow-soft">
                  {step}
                </div>
                <h3 className="font-display text-lg text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ═════════════════════════════════════════════════════════ */}
      <section className="py-24">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-display text-3xl sm:text-4xl text-foreground mb-4">
            Ready to create something{" "}
            <span className="italic text-primary">special?</span>
          </h2>
          <p className="text-muted-foreground mb-8">
            Tell us the occasion, the name, the message — we'll take care of the rest.
          </p>
          <Link
            to="/configure"
            className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-bloom hover:opacity-90 transition-opacity"
          >
            Create your gift
          </Link>
        </div>
      </section>

    </AppLayout>
  );
}
