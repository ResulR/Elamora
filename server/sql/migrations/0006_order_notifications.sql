CREATE TABLE IF NOT EXISTS order_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  provider TEXT DEFAULT 'resend',
  provider_message_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  UNIQUE (order_id, notification_type)
);

CREATE INDEX IF NOT EXISTS order_notifications_order_id_idx
  ON order_notifications(order_id);

CREATE INDEX IF NOT EXISTS order_notifications_notification_type_idx
  ON order_notifications(notification_type);

CREATE INDEX IF NOT EXISTS order_notifications_status_idx
  ON order_notifications(status);
