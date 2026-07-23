CREATE TABLE instagram_media_children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_media_id uuid NOT NULL
    REFERENCES instagram_media(id)
    ON DELETE CASCADE,
  instagram_child_id text NOT NULL,
  media_type text NOT NULL,
  media_url text,
  thumbnail_url text,
  instagram_timestamp timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT instagram_media_children_parent_child_unique
    UNIQUE (parent_media_id, instagram_child_id),

  CONSTRAINT instagram_media_children_type_check
    CHECK (media_type IN ('IMAGE', 'VIDEO')),

  CONSTRAINT instagram_media_children_sort_order_check
    CHECK (sort_order >= 0)
);

CREATE INDEX instagram_media_children_parent_order_idx
  ON instagram_media_children (
    parent_media_id,
    sort_order ASC
  );
