-- Elamora — delivery blackout dates and delivery time slots
-- Default rule: delivery available every day from 09:00 to 22:00.
-- Future night slots are supported by allowing end_time <= start_time to mean "ends next day".

BEGIN;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_time_slot text;

CREATE TABLE IF NOT EXISTS delivery_blackout_dates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  blackout_date date NOT NULL,
  country_code text,
  reason text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT delivery_blackout_dates_unique UNIQUE (blackout_date, country_code)
);

CREATE TABLE IF NOT EXISTS delivery_time_slots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  day_of_week integer NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  country_code text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT delivery_time_slots_day_check CHECK (day_of_week BETWEEN 0 AND 6),
  CONSTRAINT delivery_time_slots_unique UNIQUE (name, day_of_week, country_code)
);

CREATE INDEX IF NOT EXISTS idx_delivery_blackout_dates_lookup
  ON delivery_blackout_dates (is_active, blackout_date, country_code);

CREATE INDEX IF NOT EXISTS idx_delivery_time_slots_lookup
  ON delivery_time_slots (is_active, day_of_week, country_code, sort_order);

INSERT INTO delivery_time_slots (
  name,
  day_of_week,
  start_time,
  end_time,
  country_code,
  is_active,
  sort_order
)
SELECT
  '09:00-22:00',
  day_number,
  '09:00'::time,
  '22:00'::time,
  NULL,
  true,
  1
FROM generate_series(0, 6) AS day_number
ON CONFLICT (name, day_of_week, country_code) DO NOTHING;

COMMIT;
