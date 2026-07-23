import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Clock3, ExternalLink, ImageIcon, Images, Play, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { EmptyState } from "@/components/ui-kit/EmptyState";
import {
  fetchAdminInstagramMedia,
  updateAdminInstagramMediaStatus,
  type AdminInstagramCounts,
  type AdminInstagramMedia,
  type AdminInstagramMediaStatus,
} from "@/lib/admin-instagram-api";

export const Route = createFileRoute("/admin/instagram")({
  head: () => ({
    meta: [{ title: "Instagram — Admin" }],
  }),
  component: AdminInstagramPage,
});

type StatusFilter = "all" | AdminInstagramMediaStatus;

const emptyCounts: AdminInstagramCounts = {
  total: 0,
  pending: 0,
  published: 0,
  ignored: 0,
};

const filters: Array<{
  value: StatusFilter;
  label: string;
  countKey: keyof AdminInstagramCounts;
}> = [
  {
    value: "all",
    label: "All",
    countKey: "total",
  },
  {
    value: "pending",
    label: "Pending",
    countKey: "pending",
  },
  {
    value: "published",
    label: "Published",
    countKey: "published",
  },
  {
    value: "ignored",
    label: "Ignored",
    countKey: "ignored",
  },
];

function AdminInstagramPage() {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [media, setMedia] = useState<AdminInstagramMedia[]>([]);
  const [counts, setCounts] = useState<AdminInstagramCounts>(emptyCounts);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadMedia(requestedStatus: StatusFilter = status) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchAdminInstagramMedia(requestedStatus);

      setMedia(result.media);
      setCounts(result.counts);
    } catch (loadError) {
      console.error(loadError);
      setError(loadError instanceof Error ? loadError.message : "Could not load Instagram media");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    fetchAdminInstagramMedia(status)
      .then((result) => {
        if (cancelled) return;

        setMedia(result.media);
        setCounts(result.counts);
      })
      .catch((loadError) => {
        if (cancelled) return;

        console.error(loadError);
        setError(loadError instanceof Error ? loadError.message : "Could not load Instagram media");
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [status]);

  const pendingDescription = useMemo(() => {
    if (counts.pending === 0) {
      return "No media waiting for review.";
    }

    return `${counts.pending} ${
      counts.pending === 1 ? "media item is" : "media items are"
    } waiting for review.`;
  }, [counts.pending]);

  async function changeStatus(item: AdminInstagramMedia, nextStatus: AdminInstagramMediaStatus) {
    setUpdatingId(item.id);
    setError(null);

    try {
      await updateAdminInstagramMediaStatus(item.id, nextStatus);

      await loadMedia(status);

      toast.success(
        nextStatus === "published"
          ? "Media published"
          : nextStatus === "ignored"
            ? "Media ignored"
            : "Media restored to pending",
      );
    } catch (updateError) {
      console.error(updateError);

      const message =
        updateError instanceof Error ? updateError.message : "Could not update media status";

      setError(message);
      toast.error(message);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <AdminLayout title="Instagram">
      <div className="space-y-5">
        <section className="rounded-2xl border border-border/60 bg-surface/80 p-4 shadow-soft md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="font-display text-xl">Instagram media</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Review imported Instagram posts before making them available to the public gallery.
                Nothing is published automatically.
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-background/70 px-4 py-3 text-sm">
              <p className="font-medium">Review queue</p>
              <p className="mt-1 text-xs text-muted-foreground">{pendingDescription}</p>
            </div>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {filters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatus(filter.value)}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm transition-colors ${
                  status === filter.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:border-primary/60"
                }`}
              >
                {filter.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    status === filter.value ? "bg-primary-foreground/15" : "bg-muted"
                  }`}
                >
                  {counts[filter.countKey]}
                </span>
              </button>
            ))}
          </div>
        </section>

        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-2xl border border-border/60 bg-surface/80 p-8 text-center text-sm text-muted-foreground shadow-soft">
            Loading Instagram media...
          </div>
        ) : media.length === 0 ? (
          <EmptyState
            icon={<Images className="h-5 w-5" />}
            title="No Instagram media found"
            description={
              status === "all"
                ? "Imported Instagram posts will appear here."
                : "No media currently has this status."
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {media.map((item) => (
              <InstagramMediaCard
                key={item.id}
                item={item}
                isUpdating={updatingId === item.id}
                onChangeStatus={(nextStatus) => changeStatus(item, nextStatus)}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function InstagramMediaCard({
  item,
  isUpdating,
  onChangeStatus,
}: {
  item: AdminInstagramMedia;
  isUpdating: boolean;
  onChangeStatus: (status: AdminInstagramMediaStatus) => void;
}) {
  const previewUrl =
    item.mediaType === "VIDEO"
      ? item.thumbnailUrl || item.mediaUrl
      : item.mediaUrl || item.thumbnailUrl;

  return (
    <article className="overflow-hidden rounded-2xl border border-border/60 bg-surface/80 shadow-soft">
      <div className="relative aspect-square overflow-hidden bg-muted/30">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground" />
          </div>
        )}

        <div className="absolute left-3 top-3">
          <MediaTypeBadge item={item} />
        </div>

        <div className="absolute right-3 top-3">
          <StatusBadge status={item.status} />
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <p className="line-clamp-3 text-sm">{item.caption || "No Instagram caption."}</p>

          <p className="mt-2 text-xs text-muted-foreground">
            {formatInstagramDate(item.instagramTimestamp)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {item.permalink ? (
            <a
              href={item.permalink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs hover:border-primary/60"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open Instagram
            </a>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
          {item.status !== "published" ? (
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => onChangeStatus("published")}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              {isUpdating ? "Updating..." : "Publish"}
            </button>
          ) : null}

          {item.status !== "ignored" ? (
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => onChangeStatus("ignored")}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-medium hover:border-primary/60 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
              Ignore
            </button>
          ) : null}

          {item.status !== "pending" ? (
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => onChangeStatus("pending")}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-medium hover:border-primary/60 disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Pending
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function MediaTypeBadge({ item }: { item: AdminInstagramMedia }) {
  const label =
    item.mediaType === "CAROUSEL_ALBUM"
      ? "Carousel"
      : item.mediaType === "VIDEO"
        ? "Video"
        : "Image";

  const Icon =
    item.mediaType === "CAROUSEL_ALBUM" ? Images : item.mediaType === "VIDEO" ? Play : ImageIcon;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-1 text-xs text-white backdrop-blur-sm">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: AdminInstagramMediaStatus }) {
  const config = {
    pending: {
      label: "Pending",
      className: "bg-amber-100 text-amber-800",
      icon: Clock3,
    },
    published: {
      label: "Published",
      className: "bg-emerald-100 text-emerald-800",
      icon: Check,
    },
    ignored: {
      label: "Ignored",
      className: "bg-slate-200 text-slate-700",
      icon: X,
    },
  }[status];

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium shadow-sm ${config.className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}

function formatInstagramDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
