import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Elamora — Personalized gifts for unforgettable moments" },
      {
        name: "description",
        content:
          "Premium personalized gift boutique: bubble balloons, gift boxes, flowers, plush toys and custom messages for special occasions.",
      },
      { property: "og:title", content: "Elamora — The art of personalized gifting" },
      {
        property: "og:description",
        content: "Handcrafted personalized gift compositions for your most precious moments.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: HomePage,
});

const categories = [
  {
    label: "Birthdays",
    sub: "Flowers",
    img: "/creations/bubble-balloon-pink.jpg",
    bg: "bg-primary-soft/40",
    offset: "",
  },
  {
    label: "Baby Shower",
    sub: "Newborn gifts",
    img: "/creations/baby-elephant-pink.jpg",
    bg: "bg-muted/70",
    offset: "md:pt-12",
  },
  {
    label: "Wedding & Couple",
    sub: "Personalized glasses",
    img: "/creations/couple-glasses.jpg",
    bg: "bg-primary-soft/30",
    offset: "",
  },
  {
    label: "Gift Boxes",
    sub: "Handcrafted sets",
    img: "/creations/baby-shower-pink.jpg",
    bg: "bg-muted/70",
    offset: "md:pt-12",
  },
] as const;

const products = [
  {
    name: "Pastel Signature Gift Box",
    tag: "Personalizable",
    price: "from €65.00",
    badge: "Best Seller",
    img: "/creations/baby-shower-pink.jpg",
  },
  {
    name: "Personalized Crystal Glasses",
    tag: "Hand-finished details",
    price: "from €45.00",
    badge: "New",
    img: "/creations/couple-glasses.jpg",
  },
  {
    name: "Plush & Bubble Balloon Duo",
    tag: "Name included",
    price: "from €85.00",
    badge: null,
    img: "/creations/baby-elephant-pink.jpg",
  },
] as const;

function HomePage() {
  return (
    <AppLayout>
      <div className="bg-background text-foreground">
        {/* HERO */}
        <section className="relative min-h-[85vh] flex items-center overflow-hidden">
          <img
            src="/hero/hero-elamora.webp"
            alt="Premium personalized Elamora gift composition with bubble balloon, pastel flowers, satin ribbons and plush"
            className="absolute inset-0 w-full h-full object-cover object-right md:object-center"
            width={1600}
            height={1073}
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/58 to-background/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

          <div className="relative z-10 max-w-7xl mx-auto px-6 w-full py-24">
            <div className="max-w-xl bg-card/55 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] border border-white/60 shadow-[0_30px_80px_-30px_rgba(183,110,121,0.25)]">
              <span className="text-primary uppercase tracking-[0.3em] text-[10px] font-semibold mb-6 block">
                The art of emotion
              </span>

              <h1 className="font-display text-5xl md:text-6xl leading-[1.05] text-foreground mb-8 text-balance">
                Unique gifts
                <br />
                for your{" "}
                <span className="italic text-primary font-normal">precious</span>{" "}
                moments.
              </h1>

              <p className="text-muted-foreground mb-10 max-w-md leading-relaxed">
                Handcrafted personalized compositions with a name, message or date.
                Designed with care, prepared to make someone feel truly remembered.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  to="/configure"
                  className="px-9 py-4 bg-foreground text-background text-[11px] uppercase tracking-[0.2em] rounded-full hover:bg-primary hover:text-primary-foreground transition-colors duration-500"
                >
                  Discover the collection
                </Link>

                <Link
                  to="/configure"
                  className="px-9 py-4 border border-primary/40 text-foreground text-[11px] uppercase tracking-[0.2em] rounded-full hover:bg-primary-soft/60 transition-colors duration-500"
                >
                  Personalize a gift
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CATEGORIES */}
        <section id="creations" className="py-24 px-6 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-16 gap-4">
            <div>
              <h2 className="font-display text-4xl md:text-5xl text-foreground mb-2">
                Celebrate every moment
              </h2>
              <p className="text-muted-foreground text-sm italic">
                A creation for every occasion that matters
              </p>
            </div>

            <Link
              to="/configure"
              className="text-[11px] uppercase tracking-[0.2em] text-primary border-b border-primary/40 pb-1 self-start"
            >
              All collections →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {categories.map((category) => (
              <Link
                to="/configure"
                key={category.label}
                className={`group cursor-pointer ${category.offset}`}
              >
                <div
                  className={`aspect-[3/4] rounded-full overflow-hidden mb-6 border border-primary/10 ${category.bg}`}
                >
                  <img
                    src={category.img}
                    alt={category.label}
                    loading="lazy"
                    width={800}
                    height={1024}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>

                <p className="text-center text-[12px] uppercase tracking-[0.2em] font-medium">
                  {category.label}
                </p>
                <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                  {category.sub}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* PERSONALIZATION HIGHLIGHT */}
        <section id="how" className="bg-card py-24">
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 md:gap-20 items-center">
            <div className="relative">
              <div className="aspect-square bg-background rounded-3xl overflow-hidden">
                <img
                  src="/creations/bubble-balloon-pink.jpg"
                  alt="Personalized bubble balloon with name and delicate details"
                  loading="lazy"
                  width={1024}
                  height={1024}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="absolute -bottom-8 -right-4 md:-right-8 w-52 bg-primary-soft/70 backdrop-blur-md border border-white p-6 rounded-2xl hidden md:block shadow-lg">
                <div className="text-[10px] uppercase tracking-widest font-semibold mb-3 text-foreground/80">
                  Personalization
                </div>

                <div className="space-y-2">
                  <div className="h-1 w-full bg-primary/20 rounded-full" />
                  <div className="h-1 w-3/4 bg-primary/20 rounded-full" />
                  <div className="h-1 w-1/2 bg-primary rounded-full" />
                </div>

                <p className="mt-4 text-[10px] italic text-primary">
                  Name · message · date
                </p>
              </div>
            </div>

            <div>
              <span className="text-primary uppercase tracking-[0.3em] text-[10px] font-semibold mb-4 block">
                Our signature
              </span>

              <h3 className="font-display text-4xl md:text-5xl text-foreground leading-tight mb-6">
                A personal touch,
                <br />
                <span className="italic text-primary font-normal">
                  signed Elamora.
                </span>
              </h3>

              <p className="text-muted-foreground leading-relaxed mb-10 max-w-md">
                Every composition starts as a thoughtful base. Add a name, a date,
                an age, a message or a special request — then we prepare the gift
                with care and attention to detail.
              </p>

              <ol className="space-y-6 mb-12">
                {[
                  [
                    "Choose your creation",
                    "Start from our flowers, balloons, gift boxes or plush compositions.",
                  ],
                  [
                    "Personalize the details",
                    "Add a name, message, age, color mood or special request.",
                  ],
                  [
                    "Receive it with emotion",
                    "Your order is prepared clearly with every personal detail included.",
                  ],
                ].map(([title, sub], index) => (
                  <li key={title} className="flex gap-5 items-center">
                    <div
                      className={`size-12 shrink-0 rounded-full flex items-center justify-center font-display text-lg italic text-primary ${
                        index === 0
                          ? "bg-primary-soft/70"
                          : index === 1
                            ? "bg-muted"
                            : "bg-primary-soft/40"
                      }`}
                    >
                      {index + 1}
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold uppercase tracking-wider">
                        {title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {sub}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <Link
                to="/configure"
                className="inline-block w-full md:w-auto text-center px-10 py-5 bg-primary text-primary-foreground text-[11px] uppercase tracking-[0.2em] rounded-full shadow-lg hover:opacity-90 transition-opacity duration-500"
              >
                Start my creation
              </Link>
            </div>
          </div>
        </section>

        {/* FEATURED PRODUCTS */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-primary uppercase tracking-[0.3em] text-[10px] font-semibold mb-4 block">
              Best-sellers
            </span>
            <h2 className="font-display text-4xl md:text-5xl mb-5">
              Our favorites
            </h2>
            <div className="h-px w-20 bg-primary/40 mx-auto" />
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {products.map((product) => (
              <Link to="/configure" key={product.name} className="group flex flex-col">
                <div className="relative aspect-[4/5] bg-primary-soft/40 rounded-2xl overflow-hidden mb-6">
                  <img
                    src={product.img}
                    alt={product.name}
                    loading="lazy"
                    width={800}
                    height={1024}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />

                  {product.badge ? (
                    <div className="absolute top-4 right-4 bg-white/85 backdrop-blur px-3 py-1 rounded-full text-[9px] uppercase tracking-[0.2em] font-semibold text-foreground">
                      {product.badge}
                    </div>
                  ) : null}
                </div>

                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-sm font-medium tracking-wide">
                      {product.name}
                    </h3>
                    <p className="text-xs text-muted-foreground italic mt-1">
                      {product.tag}
                    </p>
                  </div>

                  <p className="text-sm font-medium text-primary whitespace-nowrap">
                    {product.price}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Mobile sticky CTA */}
        <div className="md:hidden fixed bottom-5 left-5 right-5 z-40">
          <Link
            to="/configure"
            className="flex w-full bg-foreground text-background py-4 rounded-full text-[11px] uppercase tracking-[0.2em] shadow-2xl items-center justify-center gap-3"
          >
            <span>Personalize a gift</span>
            <span className="size-5 bg-white/20 rounded-full grid place-items-center text-base leading-none">
              +
            </span>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
