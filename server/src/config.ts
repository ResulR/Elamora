import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4300),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  CORS_ORIGIN: z.string().min(1).default("http://localhost:8080"),
  COOKIE_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  BANK_BENEFICIARY: z.string().trim().min(1).optional(),
  BANK_NAME: z.string().trim().min(1).optional(),
  BANK_IBAN: z.string().trim().min(1).optional(),
  BANK_CURRENCY: z.string().trim().min(1).default("EUR"),
  RESEND_API_KEY: z.string().trim().min(1).optional(),
  EMAIL_FROM: z.string().trim().min(1).optional(),
  EMAIL_REPLY_TO: z.string().trim().email().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid API environment variables");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const bankTransferPlaceholders = new Set([
  "",
  "elamora",
  "[a modifier]",
  "XKX0123456789",
]);

const bankTransferConfigEntries = [
  ["BANK_BENEFICIARY", parsed.data.BANK_BENEFICIARY],
  ["BANK_NAME", parsed.data.BANK_NAME],
  ["BANK_IBAN", parsed.data.BANK_IBAN],
  ["BANK_CURRENCY", parsed.data.BANK_CURRENCY],
] as const;

const invalidBankTransferConfigEntries = bankTransferConfigEntries.filter(
  ([, value]) => !value || bankTransferPlaceholders.has(String(value))
);

if (parsed.data.NODE_ENV === "production" && invalidBankTransferConfigEntries.length > 0) {
  console.error("Invalid production bank transfer configuration");
  console.error(
    invalidBankTransferConfigEntries.map(
      ([key]) => `${key} is missing or still uses a placeholder`
    )
  );
  process.exit(1);
}

const invalidEmailConfigEntries = [
  ["RESEND_API_KEY", parsed.data.RESEND_API_KEY],
  ["EMAIL_FROM", parsed.data.EMAIL_FROM],
].filter(([, value]) => !value);

if (parsed.data.NODE_ENV === "production" && invalidEmailConfigEntries.length > 0) {
  console.error("Invalid production email configuration");
  console.error(
    invalidEmailConfigEntries.map(([key]) => `${key} is missing`)
  );
  process.exit(1);
}

export const config = {
  nodeEnv: parsed.data.NODE_ENV,
  port: parsed.data.PORT,
  databaseUrl: parsed.data.DATABASE_URL,
  jwtSecret: parsed.data.JWT_SECRET,
  corsOrigin: parsed.data.CORS_ORIGIN,
  cookieSecure: parsed.data.COOKIE_SECURE,
  bankTransfer: {
    configured: invalidBankTransferConfigEntries.length === 0,
    beneficiary: parsed.data.BANK_BENEFICIARY ?? "",
    bankName: parsed.data.BANK_NAME ?? "",
    iban: parsed.data.BANK_IBAN ?? "",
    currency: parsed.data.BANK_CURRENCY,
  },
  email: {
    configured: invalidEmailConfigEntries.length === 0,
    resendApiKey: parsed.data.RESEND_API_KEY ?? "",
    from: parsed.data.EMAIL_FROM ?? "",
    replyTo: parsed.data.EMAIL_REPLY_TO,
  },
};
