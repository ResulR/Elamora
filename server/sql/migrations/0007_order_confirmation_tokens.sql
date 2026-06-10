ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS confirmation_token_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS orders_confirmation_token_hash_key
  ON orders(confirmation_token_hash)
  WHERE confirmation_token_hash IS NOT NULL;
