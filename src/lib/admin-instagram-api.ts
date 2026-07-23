export type AdminInstagramMediaStatus = "pending" | "published" | "ignored";

export type AdminInstagramMediaType = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";

export type AdminInstagramMedia = {
  id: string;
  mediaType: AdminInstagramMediaType;
  mediaUrl: string;
  thumbnailUrl: string;
  permalink: string;
  caption: string;
  displayTitle: string;
  displayDescription: string;
  localFilePath: string;
  status: AdminInstagramMediaStatus;
  sortOrder: number;
  instagramTimestamp: string;
  importedAt: string;
  publishedAt: string | null;
  ignoredAt: string | null;
  updatedAt: string;
};

export type AdminInstagramCounts = {
  total: number;
  pending: number;
  published: number;
  ignored: number;
};

export type AdminInstagramResult = {
  media: AdminInstagramMedia[];
  counts: AdminInstagramCounts;
};

type AdminInstagramListResponse = {
  ok: boolean;
  media?: AdminInstagramMedia[];
  counts?: AdminInstagramCounts;
  error?: string;
};

type AdminInstagramMediaResponse = {
  ok: boolean;
  media?: AdminInstagramMedia;
  error?: string;
};

export async function fetchAdminInstagramMedia(
  status: AdminInstagramMediaStatus | "all" = "all",
): Promise<AdminInstagramResult> {
  const params = new URLSearchParams();

  if (status !== "all") {
    params.set("status", status);
  }

  const query = params.toString();

  const response = await fetch(
    query ? `/api/admin/instagram-media?${query}` : "/api/admin/instagram-media",
    {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    },
  );

  const payload = (await response.json().catch(() => null)) as AdminInstagramListResponse | null;

  if (!response.ok || !payload?.ok || !Array.isArray(payload.media) || !payload.counts) {
    throw new Error(payload?.error || "Could not load Instagram media");
  }

  return {
    media: payload.media,
    counts: payload.counts,
  };
}

export async function updateAdminInstagramMediaStatus(
  id: string,
  status: AdminInstagramMediaStatus,
): Promise<AdminInstagramMedia> {
  const response = await fetch(`/api/admin/instagram-media/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      status,
    }),
  });

  const payload = (await response.json().catch(() => null)) as AdminInstagramMediaResponse | null;

  if (!response.ok || !payload?.ok || !payload.media) {
    throw new Error(payload?.error || "Could not update Instagram media status");
  }

  return payload.media;
}
