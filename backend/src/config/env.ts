import { z } from "zod";
import { loadLocalEnv } from "@/backend/src/lib/load-env";

loadLocalEnv();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  BACKEND_PORT: z.coerce.number().default(4000),
  FRONTEND_ORIGIN: z.string().default("http://localhost:3000"),
  NEXT_PUBLIC_SITE_URL: z.string().optional(),
  INSFORGE_BASE_URL: z.string().default(""),
  INSFORGE_ANON_KEY: z.string().default(""),
  INSFORGE_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1000).max(30000).default(8000),
  MSG91_AUTH_KEY: z.string().default(""),
  MSG91_TEMPLATE_ID: z.string().default(""),
  MSG91_SENDER_ID: z.string().default("SCOPEX"),
  MSG91_DLT_TEMPLATE_ID: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().default(""),
  RAZORPAY_KEY_SECRET: z.string().default(""),
  APP_JWT_SECRET: z.string().default(""),
  OTP_HASH_SECRET: z.string().default(""),
  SMTP_SENDER_NAME: z.string().default("ScopeX Diagnostics"),
  SMTP_SENDER_EMAIL: z.string().email().default("team@scopexdiagnostics.in"),
  SMTP_HOST: z.string().optional().default("smtp.hostinger.com"),
  SMTP_PORT: z.coerce.number().default(465),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASSWORD: z.string().optional().default(""),
  NOTIFICATION_EMAIL_TO: z.string().optional().default("")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
  throw new Error(`Invalid backend environment configuration. ${issues}`);
}

const data = parsed.data;

export const backendEnv = {
  ...data,
  INSFORGE_BASE_URL:
    data.INSFORGE_BASE_URL ||
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_INSFORGE_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "",
  INSFORGE_ANON_KEY:
    data.INSFORGE_ANON_KEY ||
    process.env.API_KEY ||
    process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY ||
    process.env.ANON_KEY ||
    "",
  MSG91_AUTH_KEY:
    data.MSG91_AUTH_KEY ||
    process.env.ScopexOTPKey ||
    process.env.SCOPEX_OTP_KEY ||
    "",
  MSG91_TEMPLATE_ID:
    data.MSG91_TEMPLATE_ID ||
    process.env.MSG91_FLOW_ID ||
    process.env.MSG91_OTP_TEMPLATE_ID ||
    "",
  MSG91_DLT_TEMPLATE_ID:
    data.MSG91_DLT_TEMPLATE_ID ||
    process.env.MSG91_DLT_TE_ID ||
    process.env.DLT_TE_ID ||
    process.env.DLT_TEMPLATE_ID ||
    process.env.MSG91_DLT_ID ||
    ""
};

export function requireBackendEnv(key: keyof typeof backendEnv) {
  const value = backendEnv[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}
