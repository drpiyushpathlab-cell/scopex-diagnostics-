# Supabase Booking Foundation

This repository is a Next.js 15 project with an existing Express/InsForge booking backend. The Supabase work added here is an additive foundation so ScopeX can move bookings, payments, serviceability, slots, admin operations, and attribution to Postgres safely without breaking the current UI.

## Added Files

- `migrations/20260911090000_supabase_booking_foundation.sql`
- `lib/supabase.ts`
- `lib/supabase-booking.ts`
- `app/api/supabase/catalog/route.ts`
- `app/api/supabase/serviceability/route.ts`
- `app/api/supabase/slots/route.ts`
- `app/api/supabase/slot-holds/route.ts`
- `app/api/supabase/bookings/route.ts`
- `app/api/supabase/payments/create-order/route.ts`
- `app/api/supabase/payments/verify/route.ts`
- `supabase/functions/create-payment-order/index.ts`
- `supabase/functions/verify-payment/index.ts`
- `supabase/functions/razorpay-webhook/index.ts`

## Database

Apply the SQL migration in Supabase SQL editor or through the Supabase CLI:

```bash
supabase db push
```

The schema includes:

- Active tests and packages
- Package-test relationships
- Pincode service areas
- Collection centres
- Collection slots
- Transactional slot holds with expiry
- Patients
- Bookings and booking items
- Razorpay payment records
- Collection executive assignment
- Reports
- Marketing attribution
- Booking session tracking
- Notification logs
- Admin roles

RLS is enabled on every table. Public access is read-only for active catalog, serviceability, centres, and future slots. Writes for booking, payment, slot conversion, reporting, notifications, and attribution are intended to run through server routes or Supabase Edge Functions using the service role key.

## Environment

Set these values in local `.env.local` and in production:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
META_ACCESS_TOKEN=
META_PIXEL_ID=
NEXT_PUBLIC_META_PIXEL_ID=
NEXT_PUBLIC_GA4_MEASUREMENT_ID=
GOOGLE_ADS_CONVERSION_ID=
GOOGLE_ADS_CONVERSION_LABEL=
```

Do not expose `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, webhook secrets, WhatsApp access tokens, or Meta access tokens to the browser.

## API Routes

The Next.js routes provide a server-side integration path:

- `GET /api/supabase/catalog`
- `GET /api/supabase/serviceability?pincode=226010`
- `GET /api/supabase/slots?serviceAreaId=<uuid>&date=2026-09-12`
- `POST /api/supabase/slot-holds`
- `POST /api/supabase/bookings`
- `POST /api/supabase/payments/create-order`
- `POST /api/supabase/payments/verify`

Prices are loaded from Supabase on the server for booking creation. The frontend must not be trusted for final totals.

## Edge Functions

The `supabase/functions` directory contains deployable templates for secure Razorpay order creation, signature verification, and webhook processing:

```bash
supabase functions deploy create-payment-order
supabase functions deploy verify-payment
supabase functions deploy razorpay-webhook
```

Configure function secrets:

```bash
supabase secrets set RAZORPAY_KEY_ID=...
supabase secrets set RAZORPAY_KEY_SECRET=...
supabase secrets set RAZORPAY_WEBHOOK_SECRET=...
```

## Admin Setup

Create admin users through Supabase Auth, then insert their user id into `public.admin_roles`:

```sql
insert into public.admin_roles (user_id, role)
values ('AUTH_USER_UUID', 'super_admin');
```

The migration policies allow admins to manage operational tables through authenticated server/admin clients.

## Current Scope

Implemented:

- Database architecture and RLS foundation
- Pincode serviceability route
- Slot availability route
- Transactional slot hold route
- Server-side booking creation with DB-priced items
- Secure Razorpay order creation and verification routes
- Supabase Edge Function templates
- Environment documentation

Still to wire in a future UI pass:

- Replace the existing hardcoded booking catalog in the React booking flow with `/api/supabase/catalog`
- Add serviceability and slot UI to the booking screens
- Add authenticated Supabase admin screens for service areas, slots, reports, and assignments
- Connect WhatsApp Cloud API and Meta CAPI notification jobs
- Add GA4/Google Ads conversion dispatch from confirmed booking events

## Verification Checklist

- Migration applies cleanly in Supabase
- Public catalog/serviceability/slot reads work with anon key
- Service role key is available only server-side
- Slot holds cannot exceed capacity under concurrent requests
- Razorpay order amount matches `bookings.payable_amount`
- Payment verification updates `payments` and `bookings`
- RLS blocks public writes to operational tables
- Existing Next.js build still passes
