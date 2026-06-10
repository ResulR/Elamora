ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_provider TEXT NOT NULL DEFAULT 'bank_transfer',
  ADD COLUMN IF NOT EXISTS payment_reference TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

UPDATE orders
SET payment_provider = 'bank_transfer'
WHERE payment_provider IS NULL;

UPDATE orders
SET payment_reference = reference
WHERE payment_reference IS NULL;

CREATE INDEX IF NOT EXISTS orders_payment_status_idx
  ON orders(payment_status);

CREATE INDEX IF NOT EXISTS orders_payment_provider_idx
  ON orders(payment_provider);
