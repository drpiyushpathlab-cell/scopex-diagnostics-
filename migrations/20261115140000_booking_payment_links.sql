-- Deferred booking payments. Review against the deployed schema before applying.
-- Additive only; this migration is not applied automatically.

alter table public.payments add column if not exists currency text not null default 'INR';
alter table public.payments add column if not exists updated_at timestamptz not null default now();

create table if not exists public.booking_payment_links (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  provider text not null default 'razorpay' check (provider = 'razorpay'),
  provider_link_id text unique,
  short_url text,
  amount numeric(10,2) not null check (amount > 0),
  currency text not null default 'INR',
  status text not null default 'creating'
    check (status in ('creating','created','paid','expired','cancelled','failed')),
  expires_at timestamptz,
  generated_by text not null,
  last_reminder_at timestamptz,
  reminder_count integer not null default 0 check (reminder_count >= 0),
  provider_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Only one open provider link per booking. A failed or expired link may be replaced.
create unique index if not exists booking_payment_links_one_open_per_booking
  on public.booking_payment_links(booking_id)
  where status in ('creating','created');
create index if not exists booking_payment_links_booking_created_idx
  on public.booking_payment_links(booking_id, created_at desc);

create table if not exists public.booking_payment_link_events (
  id uuid primary key default gen_random_uuid(),
  payment_link_id uuid not null references public.booking_payment_links(id) on delete restrict,
  booking_id uuid not null references public.bookings(id) on delete restrict,
  event_key text not null unique,
  event_type text not null,
  actor text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists booking_payment_link_events_booking_idx
  on public.booking_payment_link_events(booking_id, created_at desc);

alter table public.booking_payment_links enable row level security;
alter table public.booking_payment_links force row level security;
alter table public.booking_payment_link_events enable row level security;
alter table public.booking_payment_link_events force row level security;
revoke all on public.booking_payment_links, public.booking_payment_link_events from anon, authenticated;
grant all on public.booking_payment_links, public.booking_payment_link_events to service_role;

-- Webhooks are applied atomically with their deduplication record. The caller
-- must verify Razorpay's HMAC against the raw request body before invoking this.
create or replace function public.apply_booking_payment_link_event(
  p_event_id text,
  p_event_type text,
  p_provider_link_id text,
  p_provider_payment_id text,
  p_amount_paid_paise bigint
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_link public.booking_payment_links%rowtype;
  v_event_id uuid;
begin
  if coalesce(p_event_id, '') = '' or coalesce(p_provider_link_id, '') = '' then
    raise exception 'webhook_event_invalid' using errcode = '22023';
  end if;

  select * into v_link
    from public.booking_payment_links
   where provider_link_id = p_provider_link_id
   for update;
  if not found then
    raise exception 'payment_link_not_found' using errcode = 'P0002';
  end if;

  insert into public.booking_payment_link_events (
    payment_link_id, booking_id, event_key, event_type, actor, details
  ) values (
    v_link.id, v_link.booking_id, 'razorpay:' || p_event_id,
    p_event_type, 'razorpay_webhook',
    pg_catalog.jsonb_build_object('providerPaymentId', p_provider_payment_id)
  ) on conflict (event_key) do nothing
  returning id into v_event_id;

  if v_event_id is null then
    return true;
  end if;

  if p_event_type = 'payment_link.paid' then
    if p_amount_paid_paise is null or p_amount_paid_paise <> round(v_link.amount * 100)::bigint then
      raise exception 'payment_amount_mismatch' using errcode = '22023';
    end if;
    update public.booking_payment_links
       set status = 'paid', updated_at = pg_catalog.now()
     where id = v_link.id;
    update public.bookings
       set payment_status = 'PAID', updated_at = pg_catalog.now()
     where id = v_link.booking_id;
    if coalesce(p_provider_payment_id, '') <> '' and v_link.status <> 'paid'
       and not exists (select 1 from public.payments where provider_payment_id = p_provider_payment_id) then
      insert into public.payments (
        booking_id, provider, provider_payment_id, amount, currency, status
      ) values (
        v_link.booking_id, 'razorpay', p_provider_payment_id,
        v_link.amount, v_link.currency, 'PAID'
      );
    end if;
  elsif p_event_type = 'payment_link.expired' then
    update public.booking_payment_links
       set status = 'expired', updated_at = pg_catalog.now()
     where id = v_link.id and status <> 'paid';
  elsif p_event_type = 'payment_link.cancelled' then
    update public.booking_payment_links
       set status = 'cancelled', updated_at = pg_catalog.now()
     where id = v_link.id and status <> 'paid';
  end if;

  return true;
end;
$$;
revoke all on function public.apply_booking_payment_link_event(text, text, text, text, bigint) from public, anon, authenticated;
grant execute on function public.apply_booking_payment_link_event(text, text, text, text, bigint) to service_role;
