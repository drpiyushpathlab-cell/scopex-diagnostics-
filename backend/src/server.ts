import { loadLocalEnv } from "@/backend/src/lib/load-env";

loadLocalEnv();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { backendEnv } from "@/backend/src/config/env";
import { authRouter } from "@/backend/src/routes/auth";
import { testsRouter } from "@/backend/src/routes/tests";
import { bookingsRouter } from "@/backend/src/routes/bookings";
import { paymentsRouter } from "@/backend/src/routes/payments";
import { reportsRouter } from "@/backend/src/routes/reports";
import { adminRouter } from "@/backend/src/routes/admin";
import { familyRouter } from "@/backend/src/routes/family";
import { packagesRouter } from "@/backend/src/routes/packages";
import { cartRouter } from "@/backend/src/routes/cart";
import { userRouter } from "@/backend/src/routes/user";
import { HttpError } from "@/backend/src/lib/http-error";

const app = express();
const otpRateLimit = new Map<string, { count: number; resetAt: number }>();
const apiRateLimit = new Map<string, { count: number; resetAt: number }>();

function apiRateLimiter(request: express.Request, _response: express.Response, next: express.NextFunction) {
  if (request.path === "/health") return next();

  const key = `${request.ip || "unknown"}:${request.path}`;
  const now = Date.now();
  const current = apiRateLimit.get(key);

  if (!current || current.resetAt <= now) {
    apiRateLimit.set(key, { count: 1, resetAt: now + 5 * 60 * 1000 });
    return next();
  }

  if (current.count >= 300) {
    return next(new HttpError(429, "Too many requests. Please slow down and try again shortly."));
  }

  current.count += 1;
  apiRateLimit.set(key, current);
  return next();
}

function otpRateLimiter(request: express.Request, _response: express.Response, next: express.NextFunction) {
  const key = request.ip || "unknown";
  const now = Date.now();
  const current = otpRateLimit.get(key);

  if (!current || current.resetAt <= now) {
    otpRateLimit.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return next();
  }

  if (current.count >= 5) {
    return next(new HttpError(429, "Too many OTP requests. Please try again after 15 minutes."));
  }

  current.count += 1;
  otpRateLimit.set(key, current);
  return next();
}

app.use(
  cors({
    origin: [backendEnv.FRONTEND_ORIGIN, backendEnv.NEXT_PUBLIC_SITE_URL].filter(Boolean) as string[],
    credentials: true
  })
);
app.disable("x-powered-by");
app.use((_request, response, next) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.setHeader("Content-Security-Policy", "default-src 'self'; frame-ancestors 'none'");
  next();
});
app.use(express.json({ limit: "25mb" }));
app.use(cookieParser());
app.use(apiRateLimiter);

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

app.use("/auth/send-otp", otpRateLimiter);
app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/tests", testsRouter);
app.use("/packages", packagesRouter);
app.use("/family", familyRouter);
app.use("/cart", cartRouter);
app.use("/booking", bookingsRouter);
app.use("/payment", paymentsRouter);
app.use("/report", reportsRouter);
app.use("/reports", reportsRouter);
app.use("/admin", adminRouter);

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  if (error instanceof HttpError) {
    return response.status(error.statusCode).json({ success: false, message: error.message });
  }

  if (error && typeof error === "object" && "issues" in error) {
    return response.status(400).json({ success: false, message: "Invalid request payload.", error });
  }

  const message = error instanceof Error ? error.message : "Unexpected backend error.";
  return response.status(500).json({ success: false, message });
});

app.listen(backendEnv.BACKEND_PORT, () => {
  console.log(`ScopeX backend listening on http://localhost:${backendEnv.BACKEND_PORT}`);
});
