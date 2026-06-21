import dotenv from "dotenv";
import { z } from "zod";

// Prefer .env over stale shell exports (e.g. FH2_PROJECT_UUID=marafiq1122)
const envFile = dotenv.config();
if (envFile.parsed) {
  for (const key of Object.keys(envFile.parsed)) {
    process.env[key] = envFile.parsed[key] ?? "";
  }
}

const envSchema = z.object({
  PORT: z.coerce.number().default(8080),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.string().default("info"),
  FH2_MODE: z.enum(["mock", "live"]).default("mock"),
  FH2_BASE_URL: z.string().url().default("https://es-flight-api-us.djigate.com"),
  FH2_ORG_TOKEN: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().optional(),
  ),
  FH2_PROJECT_UUID: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().uuid().optional(),
  ),
  FH2_LANGUAGE: z.enum(["en", "zh"]).default("en"),
  MARAFIQ_API_KEYS: z.string().default("demo-marafiq-key"),
  MARAFIQ_IP_ALLOWLIST: z.string().default(""),
  WEBHOOK_SECRET: z.string().default("change-me-webhook-secret"),
  DATABASE_URL: z
    .string()
    .default("postgres://shamal:shamal@localhost:5432/shamal_middleware"),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  MARAFIQ_EVENT_CALLBACK_URL: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().url().optional(),
  ),
  MARAFIQ_EVENT_CALLBACK_SECRET: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().optional(),
  ),
  TELEMETRY_SSE_INTERVAL_MS: z.coerce.number().min(3000).default(10_000),
  CC_USERS: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  MARAFIQ_API_KEY_ROLES: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().optional(),
  ),
  CC_SESSION_SECRET: z.string().default("change-me-cc-session-secret"),
  CC_ADMIN_ID: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  CC_ADMIN_PASSWORD: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().optional(),
  ),
  admin_id: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  admin_password: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().optional(),
  ),
  CC_OPERATOR_ID: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  CC_OPERATOR_PASSWORD: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().optional(),
  ),
  CC_VIEWER_ID: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  CC_VIEWER_PASSWORD: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().optional(),
  ),
  FH2_LIVE_SHARE_URL: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().url().optional(),
  ),
  FH2_COCKPIT_URL: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().url().optional(),
  ),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  ...parsed.data,
  marafiqApiKeys: parsed.data.MARAFIQ_API_KEYS.split(",")
    .map((k) => k.trim())
    .filter(Boolean),
  marafiqIpAllowlist: parsed.data.MARAFIQ_IP_ALLOWLIST.split(",")
    .map((ip) => ip.trim())
    .filter(Boolean),
  fh2LiveReady:
    parsed.data.FH2_MODE === "live" &&
    Boolean(parsed.data.FH2_ORG_TOKEN) &&
    Boolean(parsed.data.FH2_PROJECT_UUID),
  ccAdminId: (parsed.data.CC_ADMIN_ID ?? parsed.data.admin_id)?.trim(),
  ccAdminPassword: (parsed.data.CC_ADMIN_PASSWORD ?? parsed.data.admin_password)?.trim(),
  ccOperatorId: parsed.data.CC_OPERATOR_ID?.trim(),
  ccOperatorPassword: parsed.data.CC_OPERATOR_PASSWORD?.trim(),
  ccViewerId: parsed.data.CC_VIEWER_ID?.trim(),
  ccViewerPassword: parsed.data.CC_VIEWER_PASSWORD?.trim(),
};

/** Re-read .env so login picks up credential changes without restarting the server. */
export function reloadEnvFromDotenv(): void {
  const envFile = dotenv.config({ override: true });
  if (envFile.parsed) {
    for (const key of Object.keys(envFile.parsed)) {
      process.env[key] = envFile.parsed[key] ?? "";
    }
  }
}

export function readCcCredentialEnv() {
  reloadEnvFromDotenv();
  return {
    ccUsers: process.env.CC_USERS?.trim(),
    ccAdminId: (process.env.CC_ADMIN_ID ?? process.env.admin_id)?.trim(),
    ccAdminPassword: (process.env.CC_ADMIN_PASSWORD ?? process.env.admin_password)?.trim(),
    ccOperatorId: process.env.CC_OPERATOR_ID?.trim(),
    ccOperatorPassword: process.env.CC_OPERATOR_PASSWORD?.trim(),
    ccViewerId: process.env.CC_VIEWER_ID?.trim(),
    ccViewerPassword: process.env.CC_VIEWER_PASSWORD?.trim(),
    marafiqApiKeys: (process.env.MARAFIQ_API_KEYS ?? "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
  };
}
