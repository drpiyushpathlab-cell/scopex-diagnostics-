# ScopeX Diagnostics Backend

Production-ready Express backend for a home-collection-only pathology lab model.

## Core Model

- Only home sample collection is supported.
- JWT patient auth after MSG91 OTP verification.
- Admin auth is separate by email/password.
- Database is InsForge/Postgres compatible.
- Payments use Razorpay order creation + HMAC signature verification.

## Main Modules

- Auth: `POST /auth/send-otp`, `POST /auth/verify-otp`
- User profile: `GET /user/profile`, `PATCH /user/profile`
- Family: `POST /family/add`, `PATCH /family/:id`, `GET /family/list`
- Cart: `GET /cart`, `POST /cart/items`, `DELETE /cart/items/:id`, `DELETE /cart/clear`
- Catalog: `GET /tests`, `GET /packages`
- Booking: `POST /booking/create`, `PATCH /booking/:id`, `GET /booking/drafts`, `GET /booking/history`
- Tracking: `GET /booking/track/:id`
- Admin operations: `POST /booking/assign`, `POST /booking/status-update`
- Payments: `POST /payment/create-order`, `POST /payment/verify`
- Reports: `GET /reports/user`, `GET /reports/:id`, `POST /reports/upload`
- Admin CRUD: `/admin/tests`, `/admin/packages`, `/admin/offers`, `/admin/bookings`, `/admin/phlebotomists`, `/admin/reports`

## Booking Status Timeline

`draft -> confirmed -> assigned -> on_the_way -> collected -> processing -> completed`

Cancelled orders use `cancelled`.

## Payment Rules

- Online payment: full Razorpay payment.
- COD: creates booking with `advance_amount = 100` or payable amount if lower.
- Booking is editable before payment.
- Booking is locked after payment verification by setting `locked_at`.

## Database Schema

Apply:

```bash
npx @insforge/cli db import backend/schema.infoge.sql
```

Key tables:

- `users`
- `family_members`
- `cart_items`
- `bookings`
- `booking_items`
- `booking_status_events`
- `payments`
- `reports`
- `phlebotomists`

## Environment

Required:

```env
INSFORGE_BASE_URL=
INSFORGE_ANON_KEY=
MSG91_AUTH_KEY=
MSG91_TEMPLATE_ID=
MSG91_SENDER_ID=SCOPEX
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
APP_JWT_SECRET=
OTP_HASH_SECRET=
```

Optional WhatsApp:

```env
META_WHATSAPP_TOKEN=
META_WHATSAPP_PHONE_NUMBER_ID=
META_WHATSAPP_BOOKING_TEMPLATE=scopex_booking_created
META_WHATSAPP_AGENT_TEMPLATE=scopex_agent_assigned
META_WHATSAPP_COLLECTED_TEMPLATE=scopex_sample_collected
META_WHATSAPP_REPORT_TEMPLATE=scopex_report_ready
```
