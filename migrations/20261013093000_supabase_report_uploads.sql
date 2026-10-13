create table if not exists public.report_uploads (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  booking_code text,
  user_id uuid,
  patient_name text not null,
  mobile_number text not null,
  file_name text not null,
  file_size integer not null default 0,
  mime_type text not null default 'application/pdf',
  file_data text not null,
  uploaded_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists report_uploads_booking_idx on public.report_uploads(booking_id, created_at desc);
create index if not exists report_uploads_user_idx on public.report_uploads(user_id, created_at desc);

alter table public.report_uploads enable row level security;

