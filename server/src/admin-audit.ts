import type { AdminRequest } from "./middleware/require-admin.js";
import { pool } from "./db.js";
import { logError } from "./logger.js";

type AuditPayload = Record<string, unknown>;

const REDACTED = "[REDACTED]";

const sensitiveKeyPatterns = [
  "password",
  "passwordhash",
  "password_hash",
  "token",
  "jwt",
  "secret",
  "cookie",
  "authorization",
  "confirmationtoken",
  "confirmation_token",
  "confirmation_token_hash",
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function shouldRedactKey(key: string) {
  const normalized = key.toLowerCase().replace(/[^a-z0-9_]/g, "");

  return sensitiveKeyPatterns.some((pattern) => normalized.includes(pattern));
}

function redactSensitiveData(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveData(item));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      shouldRedactKey(key) ? REDACTED : redactSensitiveData(item),
    ])
  );
}

export async function logAdminAction(
  req: AdminRequest,
  input: {
    action: string;
    targetType: string;
    targetId?: string | null;
    payload?: AuditPayload;
  }
) {
  const adminId = req.admin?.sub;

  if (!adminId) {
    return;
  }

  try {
    await pool.query(
      `
        INSERT INTO admin_audit_log (
          admin_id,
          action,
          target_type,
          target_id,
          payload
        )
        VALUES ($1, $2, $3, $4, $5::jsonb)
      `,
      [
        adminId,
        input.action,
        input.targetType,
        input.targetId ?? null,
        JSON.stringify(redactSensitiveData(input.payload ?? {})),
      ]
    );
  } catch (error) {
    logError(error, "admin_audit_log_failed", {
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
    });
  }
}
