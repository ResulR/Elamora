CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_log_admin_id_idx
  ON admin_audit_log(admin_id);

CREATE INDEX IF NOT EXISTS admin_audit_log_action_idx
  ON admin_audit_log(action);

CREATE INDEX IF NOT EXISTS admin_audit_log_target_idx
  ON admin_audit_log(target_type, target_id);

CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx
  ON admin_audit_log(created_at DESC);
