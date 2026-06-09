-- ScopeX dynamic roles and permissions migration.
-- Safe to run multiple times.

alter table admin_roles add column if not exists display_name text;
alter table admin_roles add column if not exists description text;
alter table admin_roles add column if not exists is_system boolean not null default false;
alter table admin_roles add column if not exists updated_at timestamptz not null default now();

alter table admins add column if not exists name text;
alter table admins add column if not exists mobile text;
alter table admins add column if not exists custom_permissions_enabled boolean not null default false;
alter table admins add column if not exists custom_permissions jsonb not null default jsonb_build_array();

update admin_roles set display_name = 'Super Admin', is_system = true, permissions = jsonb_build_array('*') where role in ('super_admin', 'super-admin');
update admin_roles set display_name = 'Admin', is_system = true, permissions = jsonb_build_array('dashboard.view','dashboard.analytics','users.view','users.create','users.edit','bookings.view','bookings.create','bookings.edit','bookings.assign_advisor','bookings.change_status','bookings.export','reports.view','reports.upload','reports.replace','reports.download','reports.history','payments.view','payments.revenue','audit.view','audit.export') where role = 'admin';
update admin_roles set display_name = 'Manager', is_system = true, permissions = jsonb_build_array('dashboard.view','bookings.view','bookings.edit','bookings.assign_advisor','bookings.change_status','reports.view','reports.download','audit.view') where role = 'manager';

insert into admin_roles (role, display_name, permissions, is_system)
values
  ('booking_manager', 'Booking Manager', jsonb_build_array('dashboard.view','bookings.view','bookings.create','bookings.edit','bookings.assign_advisor','bookings.change_status','bookings.export'), true),
  ('report_manager', 'Report Manager', jsonb_build_array('dashboard.view','reports.view','reports.upload','reports.replace','reports.download','reports.history','bookings.view','bookings.change_status'), true),
  ('finance_manager', 'Finance Manager', jsonb_build_array('dashboard.view','dashboard.revenue','payments.view','payments.edit','payments.refund','payments.revenue'), true),
  ('customer_support', 'Customer Support', jsonb_build_array('dashboard.view','users.view','bookings.view','bookings.edit'), true)
on conflict (role) do update set
  display_name = excluded.display_name,
  permissions = excluded.permissions,
  is_system = excluded.is_system,
  updated_at = now();

create index if not exists admins_role_idx on admins(role, is_active);
