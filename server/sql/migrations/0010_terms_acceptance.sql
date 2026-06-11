-- Elamora — required terms acceptance at checkout

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS cgv_accepted_at timestamptz;
