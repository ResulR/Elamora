import fs from "node:fs";
import path from "node:path";

function loadEnvFileIfPresent(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFileIfPresent(path.resolve(process.cwd(), ".env"));
loadEnvFileIfPresent(
  path.resolve(process.cwd(), "server/.env")
);

const [{ config }, { pool }, { logger }] =
  await Promise.all([
    import("../config.js"),
    import("../db.js"),
    import("../logger.js"),
  ]);

type InstagramMediaType =
  | "IMAGE"
  | "VIDEO"
  | "CAROUSEL_ALBUM";

type InstagramMediaChild = {
  id?: unknown;
  media_type?: unknown;
  media_url?: unknown;
  thumbnail_url?: unknown;
  timestamp?: unknown;
};

type InstagramMedia = {
  id?: unknown;
  media_type?: unknown;
  media_product_type?: unknown;
  media_url?: unknown;
  thumbnail_url?: unknown;
  permalink?: unknown;
  caption?: unknown;
  timestamp?: unknown;
  children?: {
    data?: unknown;
  };
};

type InstagramMediaResponse = {
  data?: unknown;
  paging?: {
    next?: unknown;
  };
  error?: {
    message?: unknown;
    type?: unknown;
    code?: unknown;
    error_subcode?: unknown;
  };
};

type ExistingMediaRow = {
  instagram_media_id: string;
};

const MAX_PAGES = 100;
const PAGE_LIMIT = 100;

const requestedFields = [
  "id",
  "media_type",
  "media_product_type",
  "media_url",
  "thumbnail_url",
  "permalink",
  "caption",
  "timestamp",
  [
    "children",
    "{",
    [
      "id",
      "media_type",
      "media_url",
      "thumbnail_url",
      "timestamp",
    ].join(","),
    "}",
  ].join(""),
].join(",");

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function parseMediaList(
  value: unknown
): InstagramMedia[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRecord) as InstagramMedia[];
}

function parseChildren(
  media: InstagramMedia
): InstagramMediaChild[] {
  const data = media.children?.data;

  if (!Array.isArray(data)) {
    return [];
  }

  return data.filter(isRecord) as InstagramMediaChild[];
}

function readRequiredString(
  value: unknown,
  fieldName: string
): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new Error(
      `Instagram media field is missing: ${fieldName}`
    );
  }

  return value.trim();
}

function readMediaType(
  value: unknown
): InstagramMediaType {
  const mediaType = readRequiredString(
    value,
    "media_type"
  );

  if (
    mediaType !== "IMAGE" &&
    mediaType !== "VIDEO" &&
    mediaType !== "CAROUSEL_ALBUM"
  ) {
    throw new Error(
      `Unsupported Instagram media type: ${mediaType}`
    );
  }

  return mediaType;
}

async function fetchInstagramMedia() {
  const token = config.instagram.accessToken;

  if (!config.instagram.configured || !token) {
    throw new Error(
      "Instagram access token is not configured"
    );
  }

  const allMedia: InstagramMedia[] = [];
  let nextUrl: string | null = null;
  let pageCount = 0;

  do {
    pageCount += 1;

    if (pageCount > MAX_PAGES) {
      throw new Error(
        `Instagram pagination exceeded ${MAX_PAGES} pages`
      );
    }

    const endpoint = nextUrl
      ? new URL(nextUrl)
      : new URL(
          "https://graph.instagram.com/me/media"
        );

    if (!nextUrl) {
      endpoint.searchParams.set(
        "fields",
        requestedFields
      );
      endpoint.searchParams.set(
        "limit",
        String(PAGE_LIMIT)
      );
      endpoint.searchParams.set(
        "access_token",
        token
      );
    }

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(30_000),
    });

    const body =
      (await response.json()) as InstagramMediaResponse;

    if (!response.ok) {
      const errorCode =
        typeof body.error?.code === "number"
          ? body.error.code
          : null;

      const errorSubcode =
        typeof body.error?.error_subcode === "number"
          ? body.error.error_subcode
          : null;

      throw new Error(
        [
          `Instagram API request failed with HTTP ${response.status}`,
          errorCode === null
            ? null
            : `code=${errorCode}`,
          errorSubcode === null
            ? null
            : `subcode=${errorSubcode}`,
        ]
          .filter(Boolean)
          .join(" ")
      );
    }

    allMedia.push(...parseMediaList(body.data));

    nextUrl =
      typeof body.paging?.next === "string" &&
      body.paging.next.length > 0
        ? body.paging.next
        : null;
  } while (nextUrl);

  return {
    media: allMedia,
    pageCount,
  };
}

async function main() {
  const fetched = await fetchInstagramMedia();

  const normalized = fetched.media.map((media) => {
    const id = readRequiredString(
      media.id,
      "id"
    );

    const mediaType = readMediaType(
      media.media_type
    );

    const timestamp = readRequiredString(
      media.timestamp,
      "timestamp"
    );

    const parsedTimestamp = new Date(timestamp);

    if (
      Number.isNaN(parsedTimestamp.getTime())
    ) {
      throw new Error(
        "Instagram media timestamp is invalid"
      );
    }

    const children = parseChildren(media);

    return {
      id,
      mediaType,
      mediaProductType:
        typeof media.media_product_type === "string"
          ? media.media_product_type
          : null,
      hasMediaUrl:
        typeof media.media_url === "string" &&
        media.media_url.length > 0,
      hasThumbnailUrl:
        typeof media.thumbnail_url === "string" &&
        media.thumbnail_url.length > 0,
      hasPermalink:
        typeof media.permalink === "string" &&
        media.permalink.length > 0,
      hasCaption:
        typeof media.caption === "string" &&
        media.caption.length > 0,
      timestamp: parsedTimestamp,
      childCount: children.length,
    };
  });

  const duplicateIds = normalized
    .map((media) => media.id)
    .filter(
      (id, index, values) =>
        values.indexOf(id) !== index
    );

  if (duplicateIds.length > 0) {
    throw new Error(
      "Duplicate media identifiers returned by Instagram"
    );
  }

  const existingResult =
    await pool.query<ExistingMediaRow>(
      `
        SELECT instagram_media_id
        FROM instagram_media
      `
    );

  const existingIds = new Set(
    existingResult.rows.map(
      (row) => row.instagram_media_id
    )
  );

  const newMedia = normalized.filter(
    (media) => !existingIds.has(media.id)
  );

  const countByType = Object.fromEntries(
    ["IMAGE", "VIDEO", "CAROUSEL_ALBUM"].map(
      (mediaType) => [
        mediaType,
        normalized.filter(
          (media) =>
            media.mediaType === mediaType
        ).length,
      ]
    )
  );

  const newCountByType = Object.fromEntries(
    ["IMAGE", "VIDEO", "CAROUSEL_ALBUM"].map(
      (mediaType) => [
        mediaType,
        newMedia.filter(
          (media) =>
            media.mediaType === mediaType
        ).length,
      ]
    )
  );

  const summary = {
    ok: true,
    mode: "dry_run",
    pagesChecked: fetched.pageCount,
    instagramMediaCount: normalized.length,
    existingDatabaseCount: existingIds.size,
    newMediaCount: newMedia.length,
    countByType,
    newCountByType,
    carouselChildCount: normalized.reduce(
      (total, media) =>
        total + media.childCount,
      0
    ),
    databaseWrites: 0,
    mediaDownloads: 0,
    tokenDisplayed: false,
    mediaIdsDisplayed: false,
    urlsDisplayed: false,
    captionsDisplayed: false,
  };

  logger.info({
    event: "instagram_media_sync_dry_run_done",
    ...summary,
  });

  console.log(JSON.stringify(summary));
}

main()
  .catch((error) => {
    const message =
      error instanceof Error
        ? error.message
        : "unknown_instagram_sync_error";

    logger.error({
      event: "instagram_media_sync_dry_run_failed",
      error: message,
    });

    console.error(
      JSON.stringify({
        ok: false,
        mode: "dry_run",
        error: message,
        databaseWrites: 0,
        mediaDownloads: 0,
        tokenDisplayed: false,
      })
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
