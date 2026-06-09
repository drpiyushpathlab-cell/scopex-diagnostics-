# SCOPEX Diagnostics Backend + Website

Production-ready ScopeX Diagnostics platform with a Next.js marketing/booking frontend and a Node.js + Express backend powered by InsForge-style database APIs.

## Stack

- Next.js App Router
- Tailwind CSS
- Node.js + Express backend
- InsForge database SDK
- MSG91 OTP login
- Razorpay orders and payment verification
- Google Sheets + email lead notification

## Core Frontend Routes

- `/` landing page
- `/book-home-collection` booking flow
- `/patient/login` OTP login
- `/patient` patient dashboard shell
- `/admin/login` admin login
- `/admin` admin overview
- `/packages`
- `/tests`
- `/health-advisor`

## Backend Routes

- `POST /auth/send-otp`
- `POST /auth/verify-otp`
- `POST /auth/admin/login`
- `POST /family/add`
- `GET /family/list`
- `GET /tests`
- `GET /packages`
- `POST /booking/create`
- `GET /booking/user`
- `GET /booking/history`
- `POST /payment/create-order`
- `POST /payment/verify`
- `GET /report/:id`
- `GET /admin/dashboard`
- `GET /admin/:resource`
- `POST /admin/:resource`
- `PATCH /admin/:resource/:id`
- `DELETE /admin/:resource/:id`

Admin resources: `tests`, `packages`, `offers`, `bookings`.

## Database

Apply the InsForge-compatible SQL schema:

- [`backend/schema.infoge.sql`](C:\Users\dell\OneDrive\Desktop\2 page scopex web\backend\schema.infoge.sql)
- [`backend/seed-catalog.infoge.sql`](C:\Users\dell\OneDrive\Desktop\2 page scopex web\backend\seed-catalog.infoge.sql)

Tables included:

- `users`
- `patients`
- `family_members`
- `tests`
- `packages`
- `package_tests`
- `bookings`
- `booking_items`
- `payments`
- `offers`
- `admins`
- `otp_logs`
- `otp_verification`
- `reports`
- `memberships`
- `referrals`

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment file:
   ```bash
   cp .env.example .env.local
   ```

3. Start backend:
   ```bash
   npm run dev:backend
   ```

4. Start frontend:
   ```bash
   npm run dev
   ```

Frontend runs on `http://localhost:3000`.
Backend runs on `http://localhost:4000`.

## Build Checks

```bash
npm run build
npm run build:backend
```

## Deployment Notes

- Deploy the Next.js frontend to Vercel with `npm run build`.
- Deploy the Express backend as a Node service.
- Set `NEXT_PUBLIC_BACKEND_URL` to the backend URL in Vercel.
- Keep all secrets in environment variables only.
