import { z } from "zod";
import { loadLocalEnv } from "@/backend/src/lib/load-env";

loadLocalEnv();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  BACKEND_PORT: z.coerce.number().default(4000),
  FRONTEND_ORIGIN: z.string().default("http://localhost:3000"),
  NEXT_PUBLIC_SITE_URL: z.string().optional(),
  INSFORGE_BASE_URL: z.string().url(),
  INSFORGE_ANON_KEY: z.string().min(1),
  INSFORGE_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1000).max(30000).default(8000),
  MSG91_AUTH_KEY: z.string().min(1),
  MSG91_TEMPLATE_ID: z.string().min(1),
  MSG91_SENDER_ID: z.string().default("SCOPEX"),
  MSG91_DLT_TEMPLATE_ID: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  APP_JWT_SECRET: z.string().min(16),
  OTP_HASH_SECRET: z.string().min(8),
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

export const backendEnv = parsed.data;
