-- Elamora — store order totals breakdown
-- total_cents already exists and remains the final amount.
-- subtotal_cents is the item subtotal before shipping/tax.
-- shipping_cents and tax_cents default to 0 for now.

BEGIN;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS subtotal_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_cents integer NOT NULL DEFAULT 0;

UPDATE orders
SET subtotal_cents = total_cents - shipping_cents - tax_cents
WHERE subtotal_cents = 0
  AND total_cents <> 0;

COMMIT;
