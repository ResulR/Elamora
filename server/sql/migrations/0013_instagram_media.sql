-- Elamora — Instagram media awaiting manual homepage publication
-- Importing a media item never publishes it automatically.

CREATE TABLE instagram_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  instagram_media_id text NOT NULL UNIQUE,
  media_type text NOT NULL,

  media_url text,
  thumbnail_url text,
  permalink text,
  caption text,
  instagram_timestamp timestamptz NOT NULL,

  display_title text,
  display_description text,

  local_file_path text,

  status text NOT NULL DEFAULT 'pending',
  sort_order integer NOT NULL DEFAULT 0,

  imported_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  ignored_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT instagram_media_status_check
    CHECK (
      status IN (
        'pending',
        'published',
        'ignored'
      )
    ),

  CONSTRAINT instagram_media_sort_order_check
    CHECK (sort_order >= 0)
);

CREATE INDEX instagram_media_status_idx
  ON instagram_media(status);

CREATE INDEX instagram_media_public_order_idx
  ON instagram_media(status, sort_order, instagram_timestamp DESC);

CREATE INDEX instagram_media_instagram_timestamp_idx
  ON instagram_media(instagram_timestamp DESC);
