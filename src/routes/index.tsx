import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Elamora — Personalized gifts for unforgettable moments" },
      { name: "description", content: "Custom gift boxes, bubble balloons and floral compositions made by hand for birthdays, baby showers, weddings and more." },
      { property: "og:title", content: "Elamora — Personalized gifts for unforgettable moments" },
      { property: "og:description", content: "Handcrafted personalized gift compositions." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: HomePage,
});

// ─── Data ─────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { label: "Baby Gifts",      img: "/creations/baby-elephant-pink.jpg",  alt: "Baby gift with pink elephant plush" },
  { label: "Bubble Balloons", img: "/creations/bubble-balloon-pink.jpg", alt: "Pink personalized bubble balloon"   },
  { label: "Gift Boxes",      img: "/creations/baby-shower-pink.jpg",    alt: "Pink gift box composition"          },
  { label: "Baby Boy Gifts",  img: "/creations/baby-shower-blue.jpg",    alt: "Blue baby boy gift composition"     },
  { label: "Couple Gifts",    img: "/creations/couple-glasses.jpg",      alt: "Personalized couple glasses"        },
] as const;

const CREATIONS = [
  { src: "/creations/baby-elephant-pink.jpg",  alt: "Baby girl composition with pink bubble balloon and elephant plush", label: "Baby Girl Composition" },
  { src: "/creations/couple-glasses.jpg",       alt: "Personalized couple champagne glasses with ivory ribbons",          label: "Couple Glasses"        },
  { src: "/creations/baby-shower-pink.jpg",     alt: "Pink baby shower gift with balloon, bunny plush and flowers",      label: "Baby Shower Gift"      },
  { src: "/creations/baby-shower-blue.jpg",     alt: "Blue baby boy composition with balloon, clothing and flowers",     label: "Baby Boy Composition"  },
  { src: "/creations/bubble-balloon-pink.jpg",  alt: "Pink bubble balloon with personalized text and flowers",           label: "Personalized Balloon"  },
] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

function HomePage() {
  return (
    <AppLayout>

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-20 lg:pt-20 lg:pb-28">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

            {/* Left — text */}
            <div className="text-center lg:text-left max-w-xl mx-auto lg:mx-0">
              <div className="inline-flex items-center gap-2 mb-6">
                <span className="text-primary text-sm">♡</span>
                <p className="text-[10px] uppercase tracking-[0.3em] text-primary font-semibold">
                  Handcrafted with love
                </p>
                <span className="text-primary text-sm">♡</span>
              </div>

              <h1 className="font-display font-medium text-[2.6rem] sm:text-5xl lg:text-[3.6rem] text-foreground leading-[1.1] tracking-[-0.02em]">
                Personalized gifts<br className="hidden sm:block" />{" "}
                for <em className="italic text-primary not-italic font-normal">unforgettable</em>{" "}
                moments
              </h1>

              <p className="mt-6 text-[0.95rem] text-muted-foreground leading-[1.75] max-w-md mx-auto lg:mx-0">
                Bubble balloons, gift boxes and floral compositions made by hand —
                for birthdays, baby showers, weddings and every special occasion.
              </p>

              <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  to="/configure"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-bloom hover:opacity-90 transition-opacity"
                >
                  Create your gift ✦
                </Link>
                <a
                  href="#creations"
                  className="inline-flex items-center justify-center px-8 py-3.5 rounded-full border border-primary/30 text-sm font-medium text-foreground hover:border-primary/60 hover:bg-primary-soft/20 transition-all"
                >
                  View creations
                </a>
              </div>
            </div>

            {/* Right — image collage (desktop) */}
            <div className="relative hidden lg:grid grid-cols-2 gap-4 h-[520px]">
              <div className="rounded-3xl overflow-hidden shadow-elevated row-span-2">
                <img src="/creations/baby-shower-pink.jpg" alt="Pink baby shower gift composition"
                  className="w-full h-full object-cover" loading="eager" />
              </div>
              <div className="rounded-3xl overflow-hidden shadow-soft">
                <img src="/creations/couple-glasses.jpg" alt="Personalized couple champagne glasses"
                  className="w-full h-full object-cover" loading="eager" />
              </div>
              <div className="rounded-3xl overflow-hidden shadow-soft">
                <img src="/creations/bubble-balloon-pink.jpg" alt="Pink personalized bubble balloon"
                  className="w-full h-full object-cover" loading="eager" />
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-3 -left-3 bg-card shadow-elevated rounded-2xl px-4 py-3 border border-border/50">
                <p className="text-[9px] uppercase tracking-[0.2em] text-primary font-semibold mb-0.5">Handcrafted</p>
                <p className="font-display text-sm text-foreground font-medium">Every gift unique</p>
              </div>
            </div>

            {/* Mobile hero image */}
            <div className="lg:hidden rounded-3xl overflow-hidden shadow-elevated max-h-72 sm:max-h-96">
              <img src="/creations/baby-shower-pink.jpg" alt="Pink baby shower gift composition"
                className="w-full h-full object-cover" loading="eager" />
            </div>
          </div>
        </div>
      </section>

      {/* ══ CATEGORIES ════════════════════════════════════════════════════════ */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-[10px] uppercase tracking-[0.3em] text-primary mb-3 font-semibold">Collections</p>
            <h2 className="font-display font-medium text-3xl sm:text-4xl text-foreground tracking-[-0.02em]">
              Shop by category
            </h2>
            <div className="mt-4 mx-auto w-10 h-px bg-primary/25" />
          </div>

          <div className="flex flex-wrap justify-center gap-8 lg:gap-12">
            {CATEGORIES.map(({ label, img, alt }) => (
              <Link
                key={label}
                to="/configure"
                className="group flex flex-col items-center gap-3.5 w-24 sm:w-32"
              >
                <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full overflow-hidden shadow-soft border-2 border-border/50 group-hover:border-primary/40 group-hover:shadow-elevated transition-all duration-300">
                  <img src={img} alt={alt}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy" />
                </div>
                <span className="text-[11px] font-semibold text-center text-foreground/80 group-hover:text-primary transition-colors leading-tight tracking-wide">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CREATIONS GALLERY ═════════════════════════════════════════════════ */}
      <section id="creations" className="py-20 bg-primary-soft/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-[10px] uppercase tracking-[0.3em] text-primary mb-3 font-semibold">Gallery</p>
            <h2 className="font-display font-medium text-3xl sm:text-4xl text-foreground tracking-[-0.02em]">
              Made by hand, made for you
            </h2>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Every composition is crafted and personalized to order.
            </p>
            <div className="mt-4 mx-auto w-10 h-px bg-primary/25" />
          </div>

          <div className="columns-2 sm:columns-3 gap-4 space-y-4">
            {CREATIONS.map(({ src, alt, label }) => (
              <div key={src} className="break-inside-avoid">
                <div className="rounded-2xl overflow-hidden shadow-soft group relative">
                  <img src={src} alt={alt}
                    className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/55 to-transparent px-4 py-4 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    <p className="text-white text-xs font-semibold tracking-wide">{label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/configure"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-soft hover:opacity-90 transition-opacity">
              Create yours ✦
            </Link>
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ═════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-primary-soft/30 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-primary/6 pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-primary/5 pointer-events-none" />

        <div className="max-w-xl mx-auto px-4 sm:px-6 text-center relative">
          <div className="text-2xl mb-5 text-primary">♡</div>
          <h2 className="font-display font-medium text-3xl sm:text-[2.6rem] text-foreground mb-5 tracking-[-0.02em] leading-[1.15]">
            Ready to create something{" "}
            <em className="italic text-primary font-normal">truly special?</em>
          </h2>
          <p className="text-[0.95rem] text-muted-foreground mb-9 max-w-sm mx-auto leading-relaxed">
            Tell us the occasion, the name, the message —
            we'll craft a gift they'll never forget.
          </p>
          <Link
            to="/configure"
            className="inline-flex items-center justify-center gap-2 px-9 py-4 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-bloom hover:opacity-90 transition-opacity"
          >
            Create your personalized gift ✦
          </Link>
          <p className="mt-5 text-[11px] text-muted-foreground tracking-wide">
            Handcrafted · Personalized · Delivered with love
          </p>
        </div>
      </section>

    </AppLayout>
  );
}
