alter table users add column if not exists google_id text;
alter table users add column if not exists avatar_url text;
alter table users add column if not exists auth_provider text not null default 'mobile_otp';

alter table patients add column if not exists google_id text;
alter table patients add column if not exists avatar_url text;
alter table patients add column if not exists auth_provider text not null default 'mobile_otp';

alter table user_profiles add column if not exists google_id text;
alter table user_profiles add column if not exists avatar_url text;
alter table user_profiles add column if not exists auth_provider text not null default 'mobile_otp';

create unique index if not exists users_google_unique_idx on users(google_id) where google_id is not null;
create unique index if not exists idx_users_google_id on users(google_id);
create index if not exists users_google_idx on users(google_id);
create index if not exists users_auth_provider_idx on users(auth_provider);
create index if not exists patients_google_idx on patients(google_id);
create index if not exists patients_email_idx on patients(email);
create index if not exists user_profiles_auth_provider_idx on user_profiles(auth_provider);
