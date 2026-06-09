alter table bookings add column if not exists booking_patients jsonb not null default '[]'::jsonb;

alter table booking_items add column if not exists booking_patient_id text;
alter table booking_items add column if not exists family_member_id uuid references family_members(id) on delete set null;
alter table booking_items add column if not exists patient_name text;
alter table booking_items add column if not exists patient_relation text;

create index if not exists booking_items_patient_idx on booking_items(booking_id, booking_patient_id);
