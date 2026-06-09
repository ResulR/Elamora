-- Elamora — shipping zones and full delivery address model
-- Keeps orders.delivery_address as legacy/free-text compatibility field.
-- Real commercial delivery zones/prices must be seeded separately.

BEGIN;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS address_line1 text,
  ADD COLUMN IF NOT EXISTS address_line2 text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS country_code text,
  ADD COLUMN IF NOT EXISTS delivery_date date,
  ADD COLUMN IF NOT EXISTS delivery_instructions text,
  ADD COLUMN IF NOT EXISTS recipient_phone text;

CREATE TABLE IF NOT EXISTS delivery_zones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  country_code text NOT NULL,
  postal_pattern text NOT NULL,
  price_cents integer NOT NULL DEFAULT 0,
  lead_time_days integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT delivery_zones_price_cents_check CHECK (price_cents >= 0),
  CONSTRAINT delivery_zones_lead_time_days_check CHECK (lead_time_days >= 0)
);

CREATE INDEX IF NOT EXISTS idx_delivery_zones_active_country
  ON delivery_zones (is_active, country_code);

COMMIT;
