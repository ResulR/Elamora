ALTER TABLE shop_settings
  ADD COLUMN IF NOT EXISTS bank_beneficiary text,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS bank_iban text;

UPDATE shop_settings
SET
  currency = 'EUR',
  bank_beneficiary = COALESCE(NULLIF(bank_beneficiary, ''), shop_name, 'Elamora'),
  bank_name = COALESCE(NULLIF(bank_name, ''), 'Elamora'),
  bank_iban = COALESCE(NULLIF(bank_iban, ''), '')
WHERE id = (
  SELECT id FROM shop_settings ORDER BY created_at ASC LIMIT 1
);

ALTER TABLE shop_settings
  ALTER COLUMN bank_beneficiary SET DEFAULT 'Elamora',
  ALTER COLUMN bank_beneficiary SET NOT NULL,
  ALTER COLUMN bank_name SET DEFAULT 'Elamora',
  ALTER COLUMN bank_name SET NOT NULL,
  ALTER COLUMN bank_iban SET DEFAULT '',
  ALTER COLUMN bank_iban SET NOT NULL;
