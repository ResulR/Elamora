export type PublicInstagramMediaType = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";

export type PublicInstagramMediaChild = {
  id: string;
  mediaType: Exclude<PublicInstagramMediaType, "CAROUSEL_ALBUM">;
  mediaUrl: string;
  thumbnailUrl: string;
  sortOrder: number;
};

export type PublicInstagramMedia = {
  id: string;
  mediaType: PublicInstagramMediaType;
  mediaUrl: string;
  thumbnailUrl: string;
  permalink: string;
  caption: string;
  displayTitle: string;
  displayDescription: string;
  instagramTimestamp: string;
  children: PublicInstagramMediaChild[];
};

type PublicInstagramResponse = {
  ok: boolean;
  media?: PublicInstagramMedia[];
  error?: string;
};

export async function fetchPublicInstagramMedia(): Promise<PublicInstagramMedia[]> {
  const response = await fetch("/api/instagram-media", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const payload = (await response.json().catch(() => null)) as PublicInstagramResponse | null;

  if (!response.ok || !payload?.ok || !Array.isArray(payload.media)) {
    throw new Error(payload?.error || "Could not load Instagram media");
  }

  return payload.media;
}
