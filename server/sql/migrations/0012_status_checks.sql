ALTER TABLE orders
  ALTER COLUMN status SET DEFAULT 'pending_bank_transfer';

ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (
    status IN (
      'pending_bank_transfer',
      'confirmed',
      'preparing',
      'ready_for_pickup',
      'shipped',
      'completed',
      'cancelled',
      'refunded'
    )
  )
  NOT VALID;

ALTER TABLE orders
  ADD CONSTRAINT orders_payment_status_check
  CHECK (
    payment_status IN (
      'pending',
      'paid',
      'cancelled',
      'refunded'
    )
  )
  NOT VALID;

ALTER TABLE order_notifications
  ADD CONSTRAINT order_notifications_status_check
  CHECK (
    status IN (
      'pending',
      'sent',
      'failed'
    )
  )
  NOT VALID;

ALTER TABLE orders
  VALIDATE CONSTRAINT orders_status_check;

ALTER TABLE orders
  VALIDATE CONSTRAINT orders_payment_status_check;

ALTER TABLE order_notifications
  VALIDATE CONSTRAINT order_notifications_status_check;
