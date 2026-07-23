import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, ImageIcon, Instagram } from "lucide-react";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  fetchPublicInstagramMedia,
  type PublicInstagramMedia,
  type PublicInstagramMediaChild,
} from "@/lib/instagram-api";

const MAIN_AUTOPLAY_DELAY_MS = 20_000;
const INNER_AUTOPLAY_DELAY_MS = 5_000;

export function InstagramShowcase() {
  const [media, setMedia] = useState<PublicInstagramMedia[]>([]);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const interactionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInteractingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    fetchPublicInstagramMedia()
      .then((result) => {
        if (!cancelled) {
          setMedia(result);
        }
      })
      .catch((error) => {
        console.error("Could not load public Instagram media", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!carouselApi || media.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      if (isInteractingRef.current) {
        return;
      }

      carouselApi.scrollNext();
    }, MAIN_AUTOPLAY_DELAY_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [carouselApi, media.length]);

  useEffect(() => {
    return () => {
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
    };
  }, []);

  const pauseAutoplayTemporarily = useCallback(() => {
    isInteractingRef.current = true;

    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
    }

    interactionTimeoutRef.current = setTimeout(() => {
      isInteractingRef.current = false;
    }, MAIN_AUTOPLAY_DELAY_MS);
  }, []);

  if (media.length === 0) {
    return null;
  }

  const instagramUrl = media.find((item) => item.permalink)?.permalink || undefined;

  return (
    <section className="overflow-hidden bg-card py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="mb-4 block text-[10px] font-semibold uppercase tracking-[0.3em] text-primary">
              Follow our creations
            </span>

            <h2 className="font-display text-4xl md:text-5xl">From our Instagram</h2>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Discover recent Elamora creations, personalized details and special moments shared on
              Instagram.
            </p>
          </div>

          {instagramUrl ? (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 self-start rounded-full border border-primary/30 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors hover:bg-primary-soft/50"
            >
              <Instagram className="h-4 w-4" />
              Visit Instagram
            </a>
          ) : null}
        </div>

        <Carousel
          setApi={setCarouselApi}
          opts={{
            align: "start",
            loop: true,
            slidesToScroll: 1,
          }}
          className="touch-pan-y px-1 md:px-12"
          onPointerDown={pauseAutoplayTemporarily}
          onTouchStart={pauseAutoplayTemporarily}
          onKeyDown={pauseAutoplayTemporarily}
        >
          <CarouselContent className="-ml-4">
            {media.map((item) => (
              <CarouselItem key={item.id} className="basis-[88%] pl-4 sm:basis-1/2 lg:basis-1/3">
                <InstagramCard item={item} />
              </CarouselItem>
            ))}
          </CarouselContent>

          {media.length > 1 ? (
            <>
              <CarouselPrevious
                onPointerDown={pauseAutoplayTemporarily}
                className="left-0 hidden border-primary/20 bg-background/90 md:inline-flex"
              />
              <CarouselNext
                onPointerDown={pauseAutoplayTemporarily}
                className="right-0 hidden border-primary/20 bg-background/90 md:inline-flex"
              />
            </>
          ) : null}
        </Carousel>
      </div>
    </section>
  );
}

function InstagramCard({ item }: { item: PublicInstagramMedia }) {
  const title = item.displayTitle.trim() || formatMediaType(item.mediaType);

  const description = item.displayDescription.trim() || item.caption.trim();

  const slides = useMemo(() => getMediaSlides(item), [item]);

  return (
    <article className="group overflow-hidden rounded-[28px] border border-primary/10 bg-background shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated">
      <InstagramMediaFrame item={item} slides={slides} title={title} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-display text-xl">{title}</h3>

          {item.permalink ? (
            <a
              href={item.permalink}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${title} on Instagram`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/15 transition-colors hover:bg-primary-soft/50"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
        </div>

        {description ? (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}

        <p className="mt-4 text-[10px] uppercase tracking-[0.18em] text-primary">
          {formatInstagramDate(item.instagramTimestamp)}
        </p>
      </div>
    </article>
  );
}

function InstagramMediaFrame({
  item,
  slides,
  title,
}: {
  item: PublicInstagramMedia;
  slides: PublicInstagramMediaChild[];
  title: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [item.id]);

  useEffect(() => {
    if (item.mediaType !== "CAROUSEL_ALBUM" || slides.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, INNER_AUTOPLAY_DELAY_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [item.mediaType, slides.length]);

  return (
    <div className="relative aspect-[4/5] overflow-hidden bg-primary-soft/25">
      <div
        className="flex h-full transition-transform duration-1000 ease-in-out"
        style={{
          transform: `translateX(-${activeIndex * 100}%)`,
        }}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            aria-hidden={activeIndex !== index}
            className="h-full min-w-full shrink-0"
          >
            <MediaContent
              mediaType={slide.mediaType}
              mediaUrl={slide.mediaUrl}
              thumbnailUrl={slide.thumbnailUrl}
              title={title}
              eager={index === 0}
            />
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-foreground/30 via-transparent to-transparent" />

      {slides.length > 1 ? (
        <div className="absolute inset-x-0 bottom-4 z-30 flex justify-center gap-1.5">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show carousel image ${index + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                activeIndex === index ? "w-6 bg-background" : "w-1.5 bg-background/55"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MediaContent({
  mediaType,
  mediaUrl,
  thumbnailUrl,
  title,
  eager = false,
}: {
  mediaType: "IMAGE" | "VIDEO";
  mediaUrl: string;
  thumbnailUrl: string;
  title: string;
  eager?: boolean;
}) {
  if (mediaType === "VIDEO" && mediaUrl) {
    return (
      <video
        src={mediaUrl}
        poster={thumbnailUrl || undefined}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={title}
        className="h-full w-full object-contain sm:object-cover"
      />
    );
  }

  const imageUrl = mediaUrl || thumbnailUrl;

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={title}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className="h-full w-full object-contain transition-transform duration-700 ease-out sm:object-cover sm:group-hover:scale-[1.04]"
      />
    );
  }

  return (
    <div className="flex h-full items-center justify-center">
      <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
    </div>
  );
}

function getMediaSlides(item: PublicInstagramMedia): PublicInstagramMediaChild[] {
  if (item.mediaType === "CAROUSEL_ALBUM" && item.children.length > 0) {
    return [...item.children].sort((left, right) => left.sortOrder - right.sortOrder);
  }

  if (item.mediaType === "VIDEO") {
    return [
      {
        id: item.id,
        mediaType: "VIDEO",
        mediaUrl: item.mediaUrl,
        thumbnailUrl: item.thumbnailUrl,
        sortOrder: 0,
      },
    ];
  }

  return [
    {
      id: item.id,
      mediaType: "IMAGE",
      mediaUrl: item.mediaUrl,
      thumbnailUrl: item.thumbnailUrl,
      sortOrder: 0,
    },
  ];
}

function formatMediaType(type: PublicInstagramMedia["mediaType"]) {
  if (type === "CAROUSEL_ALBUM") {
    return "Carousel";
  }

  if (type === "VIDEO") {
    return "Video";
  }

  return "Photo";
}

function formatInstagramDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}
