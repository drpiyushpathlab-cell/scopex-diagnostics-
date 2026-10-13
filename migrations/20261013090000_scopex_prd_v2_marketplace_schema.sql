-- ScopeX Diagnostics PRD v2.0 marketplace schema
-- Additive migration only. Apply after 20260911090000_supabase_booking_foundation.sql.
-- It does not delete or overwrite existing production data.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'price_reference_status') then
    create type public.price_reference_status as enum ('DRAFT','ACTIVE','EXPIRED','REJECTED');
  end if;
  if not exists (select 1 from pg_type where typname = 'bundle_discount_type') then
    create type public.bundle_discount_type as enum ('PERCENT','FIXED');
  end if;
  if not exists (select 1 from pg_type where typname = 'content_status') then
    create type public.content_status as enum ('DRAFT','IN_REVIEW','PUBLISHED','ARCHIVED');
  end if;
end $$;

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.test_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  parent_id uuid references public.test_categories(id) on delete set null,
  sort_order integer not null default 100,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tests add column if not exists category_id uuid references public.test_categories(id) on delete set null;
alter table public.tests add column if not exists real_price numeric(10,2);
alter table public.tests add column if not exists display_name text;
alter table public.tests add column if not exists sample_type text;
alter table public.tests add column if not exists report_tat_hours integer check (report_tat_hours is null or report_tat_hours > 0);
alter table public.tests add column if not exists medically_reviewed_by uuid references auth.users(id) on delete set null;
alter table public.tests add column if not exists medically_reviewed_at timestamptz;
alter table public.tests add column if not exists seo_title text;
alter table public.tests add column if not exists seo_description text;
alter table public.tests add column if not exists schema_json jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'tests_real_price_non_negative'
      and conrelid = 'public.tests'::regclass
  ) then
    alter table public.tests
      add constraint tests_real_price_non_negative check (real_price is null or real_price >= 0);
  end if;
end $$;

create table if not exists public.test_city_prices (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  city text not null,
  real_price numeric(10,2) not null check (real_price >= 0),
  active boolean not null default true,
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(test_id, city, effective_from)
);

create table if not exists public.reference_price_evidence (
  id uuid primary key default gen_random_uuid(),
  test_id uuid references public.tests(id) on delete cascade,
  package_id uuid references public.packages(id) on delete cascade,
  city text,
  reference_price numeric(10,2) not null check (reference_price >= 0),
  source_name text not null,
  source_url text,
  source_document_path text,
  source_date date not null,
  reviewer_id uuid references auth.users(id) on delete set null,
  status public.price_reference_status not null default 'DRAFT',
  expires_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reference_price_one_subject check ((test_id is not null)::int + (package_id is not null)::int = 1)
);

alter table public.packages add column if not exists real_price numeric(10,2);
alter table public.packages add column if not exists seo_title text;
alter table public.packages add column if not exists seo_description text;
alter table public.packages add column if not exists medically_reviewed_by uuid references auth.users(id) on delete set null;
alter table public.packages add column if not exists medically_reviewed_at timestamptz;
alter table public.packages add column if not exists schema_json jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'packages_real_price_non_negative'
      and conrelid = 'public.packages'::regclass
  ) then
    alter table public.packages
      add constraint packages_real_price_non_negative check (real_price is null or real_price >= 0);
  end if;
end $$;

create table if not exists public.bundle_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  min_eligible_test_count integer not null check (min_eligible_test_count > 0),
  discount_type public.bundle_discount_type not null,
  discount_value numeric(10,2) not null check (discount_value >= 0),
  max_saving numeric(10,2) check (max_saving is null or max_saving >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  applies_to_repeated_quantities boolean not null default false,
  next_tier_message text,
  sort_order integer not null default 100,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bundle_rule_cities (
  bundle_rule_id uuid not null references public.bundle_rules(id) on delete cascade,
  city text not null,
  primary key (bundle_rule_id, city)
);

create table if not exists public.bundle_rule_categories (
  bundle_rule_id uuid not null references public.bundle_rules(id) on delete cascade,
  category_id uuid not null references public.test_categories(id) on delete cascade,
  primary key (bundle_rule_id, category_id)
);

create table if not exists public.bundle_rule_excluded_tests (
  bundle_rule_id uuid not null references public.bundle_rules(id) on delete cascade,
  test_id uuid not null references public.tests(id) on delete cascade,
  primary key (bundle_rule_id, test_id)
);

create table if not exists public.city_availability (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  state text,
  active boolean not null default true,
  home_collection_enabled boolean not null default true,
  centre_visit_enabled boolean not null default false,
  free_visit_minimum numeric(10,2) not null default 600 check (free_visit_minimum >= 0),
  visit_charge numeric(10,2) not null default 99 check (visit_charge >= 0),
  threshold_basis text not null default 'after_bundle_saving' check (threshold_basis in ('real_price_subtotal','after_bundle_saving')),
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(city, effective_from)
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  body_md text not null default '',
  cover_image_path text,
  status public.content_status not null default 'DRAFT',
  author_id uuid references auth.users(id) on delete set null,
  medical_reviewer_id uuid references auth.users(id) on delete set null,
  medically_reviewed_at timestamptz,
  published_at timestamptz,
  seo_title text,
  seo_description text,
  schema_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.price_audit_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('test','test_city_price','package','bundle_rule','city_availability','reference_price_evidence')),
  entity_id uuid not null,
  action text not null check (action in ('created','updated','activated','deactivated','expired','deleted')),
  old_value jsonb,
  new_value jsonb,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists tests_category_active_idx on public.tests(category_id, active);
create index if not exists tests_real_price_idx on public.tests(real_price) where active;
create index if not exists test_city_prices_lookup_idx on public.test_city_prices(test_id, city, active, effective_from desc);
create index if not exists reference_price_evidence_subject_idx on public.reference_price_evidence(test_id, package_id, city, status, expires_at);
create index if not exists packages_real_price_idx on public.packages(real_price) where active;
create index if not exists bundle_rules_active_idx on public.bundle_rules(active, min_eligible_test_count, sort_order);
create index if not exists city_availability_active_idx on public.city_availability(city, active, effective_from desc);
create index if not exists blog_posts_status_published_idx on public.blog_posts(status, published_at desc);
create index if not exists price_audit_entity_idx on public.price_audit_log(entity_type, entity_id, created_at desc);

insert into public.app_settings(key, value, description)
values
  ('home_collection_policy', '{"free_visit_minimum":600,"visit_charge":99,"threshold_basis":"after_bundle_saving"}'::jsonb, 'Default home collection charge policy'),
  ('pricing_policy', '{"allow_fake_mrp":false,"show_reference_price_only_with_evidence":true}'::jsonb, 'ScopeX real-price marketplace pricing policy')
on conflict (key) do nothing;

create or replace function public.active_real_price(p_test_id uuid, p_city text default null)
returns numeric
language sql
stable
set search_path = public
as $$
  select coalesce(
    (
      select tcp.real_price
        from public.test_city_prices tcp
       where tcp.test_id = p_test_id
         and tcp.active = true
         and (p_city is null or lower(tcp.city) = lower(p_city))
         and tcp.effective_from <= now()
         and (tcp.effective_to is null or tcp.effective_to > now())
       order by
         case when p_city is not null and lower(tcp.city) = lower(p_city) then 0 else 1 end,
         tcp.effective_from desc
       limit 1
    ),
    (select coalesce(t.real_price, t.discounted_price, t.price) from public.tests t where t.id = p_test_id)
  );
$$;

alter table public.app_settings enable row level security;
alter table public.test_categories enable row level security;
alter table public.test_city_prices enable row level security;
alter table public.reference_price_evidence enable row level security;
alter table public.bundle_rules enable row level security;
alter table public.bundle_rule_cities enable row level security;
alter table public.bundle_rule_categories enable row level security;
alter table public.bundle_rule_excluded_tests enable row level security;
alter table public.city_availability enable row level security;
alter table public.blog_posts enable row level security;
alter table public.price_audit_log enable row level security;

drop policy if exists "Public can read active categories" on public.test_categories;
create policy "Public can read active categories" on public.test_categories for select using (active = true);

drop policy if exists "Public can read active bundle rules" on public.bundle_rules;
create policy "Public can read active bundle rules" on public.bundle_rules for select using (active = true);

drop policy if exists "Public can read active city availability" on public.city_availability;
create policy "Public can read active city availability" on public.city_availability for select using (active = true);

drop policy if exists "Public can read published blog posts" on public.blog_posts;
create policy "Public can read published blog posts" on public.blog_posts for select using (status = 'PUBLISHED');

drop policy if exists "Public can read active reference evidence" on public.reference_price_evidence;
create policy "Public can read active reference evidence" on public.reference_price_evidence
  for select using (status = 'ACTIVE' and (expires_at is null or expires_at >= current_date));

drop policy if exists "Admins manage app settings" on public.app_settings;
create policy "Admins manage app settings" on public.app_settings for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage categories" on public.test_categories;
create policy "Admins manage categories" on public.test_categories for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage test city prices" on public.test_city_prices;
create policy "Admins manage test city prices" on public.test_city_prices for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage reference evidence" on public.reference_price_evidence;
create policy "Admins manage reference evidence" on public.reference_price_evidence for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage bundle rules" on public.bundle_rules;
create policy "Admins manage bundle rules" on public.bundle_rules for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage bundle rule cities" on public.bundle_rule_cities;
create policy "Admins manage bundle rule cities" on public.bundle_rule_cities for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage bundle rule categories" on public.bundle_rule_categories;
create policy "Admins manage bundle rule categories" on public.bundle_rule_categories for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage bundle rule excluded tests" on public.bundle_rule_excluded_tests;
create policy "Admins manage bundle rule excluded tests" on public.bundle_rule_excluded_tests for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage city availability" on public.city_availability;
create policy "Admins manage city availability" on public.city_availability for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage blog posts" on public.blog_posts;
create policy "Admins manage blog posts" on public.blog_posts for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins read price audit log" on public.price_audit_log;
create policy "Admins read price audit log" on public.price_audit_log for select using (public.is_admin());

