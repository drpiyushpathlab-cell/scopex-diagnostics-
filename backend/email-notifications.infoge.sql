-- ScopeX automated email notification schema.
-- Safe to run multiple times.

create table if not exists email_logs (
  id uuid primary key default gen_random_uuid(),
  recipient_email text not null,
  subject text not null,
  event_type text not null,
  status text not null default 'pending',
  sent_at timestamptz,
  error_message text,
  provider_message_id text,
  body_html text,
  body_text text,
  metadata jsonb not null default jsonb_build_object(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_logs_event_idx on email_logs(event_type, created_at desc);
create index if not exists email_logs_status_idx on email_logs(status, created_at desc);
create index if not exists email_logs_recipient_idx on email_logs(recipient_email);

create table if not exists email_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text not null,
  token text not null unique,
  status text not null default 'pending',
  expires_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists email_verifications_user_idx on email_verifications(user_id, email, status);
create index if not exists email_verifications_token_idx on email_verifications(token);

alter table user_profiles add column if not exists email_verified_at timestamptz;
