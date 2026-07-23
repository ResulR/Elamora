import { useEffect, useState } from "react";
import { ExternalLink, ImageIcon, Images, Instagram, Play } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { fetchPublicInstagramMedia, type PublicInstagramMedia } from "@/lib/instagram-api";

export function InstagramShowcase() {
  const [media, setMedia] = useState<PublicInstagramMedia[]>([]);

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

  if (media.length === 0) {
    return null;
  }

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

          <a
            href={media.find((item) => item.permalink)?.permalink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 self-start rounded-full border border-primary/30 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors hover:bg-primary-soft/50"
          >
            <Instagram className="h-4 w-4" />
            Visit Instagram
          </a>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: media.length > 3,
          }}
          className="px-1 md:px-12"
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
              <CarouselPrevious className="left-0 hidden border-primary/20 bg-background/90 md:inline-flex" />
              <CarouselNext className="right-0 hidden border-primary/20 bg-background/90 md:inline-flex" />
            </>
          ) : null}
        </Carousel>
      </div>
    </section>
  );
}

function InstagramCard({ item }: { item: PublicInstagramMedia }) {
  const isVideo = item.mediaType === "VIDEO";

  const previewUrl = isVideo ? item.thumbnailUrl : item.mediaUrl || item.thumbnailUrl;

  const title = item.displayTitle.trim() || formatMediaType(item.mediaType);

  const description = item.displayDescription.trim() || item.caption.trim();

  const content = (
    <article className="group overflow-hidden rounded-[28px] border border-primary/10 bg-background shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated">
      <div className="relative aspect-[4/5] overflow-hidden bg-primary-soft/25">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-foreground/45 via-transparent to-transparent" />

        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-background/85 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] backdrop-blur-md">
          <MediaIcon type={item.mediaType} />
          {formatMediaType(item.mediaType)}
        </span>

        {isVideo ? (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-background/85 text-foreground shadow-lg backdrop-blur-md transition-transform group-hover:scale-105">
              <Play className="ml-0.5 h-5 w-5 fill-current" />
            </span>
          </span>
        ) : null}

        <span className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/85 text-foreground backdrop-blur-md">
          <ExternalLink className="h-4 w-4" />
        </span>
      </div>

      <div className="p-5">
        <h3 className="font-display text-xl">{title}</h3>

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

  if (!item.permalink) {
    return content;
  }

  return (
    <a
      href={item.permalink}
      target="_blank"
      rel="noreferrer"
      aria-label={`Open ${title} on Instagram`}
    >
      {content}
    </a>
  );
}

function MediaIcon({ type }: { type: PublicInstagramMedia["mediaType"] }) {
  if (type === "VIDEO") {
    return <Play className="h-3.5 w-3.5" />;
  }

  if (type === "CAROUSEL_ALBUM") {
    return <Images className="h-3.5 w-3.5" />;
  }

  return <ImageIcon className="h-3.5 w-3.5" />;
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
