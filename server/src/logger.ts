import pino from "pino";
import { config } from "./config.js";

const REDACTED = "[REDACTED]";

const redactPaths = [
  "password",
  "passwordHash",
  "password_hash",
  "token",
  "jwt",
  "secret",
  "cookie",
  "authorization",
  "confirmationToken",
  "confirmation_token",
  "confirmationTokenHash",
  "confirmation_token_hash",
  "customer.email",
  "customer.phone",
  "customer.address",
  "customer.addressLine1",
  "customer.addressLine2",
  "customer.recipientPhone",
  "req.headers.authorization",
  "req.headers.cookie",
  "req.body.password",
  "req.body.email",
  "req.body.customer.email",
  "req.body.customer.phone",
  "req.body.customer.address",
  "req.body.customer.addressLine1",
  "req.body.customer.addressLine2",
  "req.body.customer.recipientPhone",
];

export const logger = pino({
  level: config.logLevel,
  base: {
    service: "elamora-api",
    env: config.nodeEnv,
  },
  redact: {
    paths: redactPaths,
    censor: REDACTED,
    remove: false,
  },
  serializers: {
    err: pino.stdSerializers.err,
  },
});

export function logError(error: unknown, message: string, context: Record<string, unknown> = {}) {
  logger.error(
    {
      ...context,
      err: error,
    },
    message
  );
}
