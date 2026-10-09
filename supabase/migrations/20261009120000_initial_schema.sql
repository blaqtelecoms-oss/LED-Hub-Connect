-- Initial Supabase schema translated from the repository's entity definitions.
create extension if not exists pgcrypto;

create table if not exists public.users (
  id text primary key default gen_random_uuid()::text,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  role text default 'user',
  account_type text default 'member',
  officer_role text default 'officer',
  phone text,
  area text,
  ward text,
  language text default 'English',
  skills jsonb,
  alert_preferences jsonb,
  alert_channel text default 'app',
  popia_consent_at timestamptz,
  is_demo_data boolean default false,
  created_by_id text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.broadcast (
  id text primary key default gen_random_uuid()::text,
  audience_filter text,
  channel text not null,
  body text not null,
  sent_by text,
  sent_at timestamptz,
  recipient_count numeric default 0,
  is_demo_data boolean default false,
  created_by_id text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.business (
  id text primary key default gen_random_uuid()::text,
  owner text,
  name text not null,
  trading_name text,
  registration_type text,
  cipc_number text,
  year_started numeric,
  sector text,
  sectors jsonb,
  area text not null,
  ward text,
  address text,
  latitude numeric,
  longitude numeric,
  description text,
  owner_name text,
  owner_phone text,
  owner_email text,
  number_of_owners numeric default 1,
  ownership_profile jsonb,
  premises_type text,
  trading_days jsonb,
  staff_band text,
  turnover_band text,
  has_bank_account boolean,
  vat_status text,
  csd_status text,
  support_needed jsonb,
  phone text,
  status text default 'pending',
  verified_by text,
  verified_at timestamptz,
  jobs_count numeric default 0,
  profile_views numeric default 0,
  is_demo_data boolean default false,
  created_by_id text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.business_document (
  id text primary key default gen_random_uuid()::text,
  business text not null,
  application text,
  type text,
  document_type text,
  requirement_level text default 'required',
  file text,
  file_name text,
  file_size numeric,
  status text default 'uploaded',
  reviewer_note text,
  reviewed_by text,
  reviewed_at timestamptz,
  version numeric default 1,
  is_demo_data boolean default false,
  created_by_id text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.document_rule (
  id text primary key default gen_random_uuid()::text,
  document_type text not null,
  label text not null,
  hint text,
  requirement_level text not null default 'required',
  conditions jsonb,
  active boolean default true,
  is_demo_data boolean default false,
  created_by_id text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.favorite (
  id text primary key default gen_random_uuid()::text,
  member text not null,
  business text not null,
  is_demo_data boolean default false,
  created_by_id text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.funding_application (
  id text primary key default gen_random_uuid()::text,
  program text not null,
  business text not null,
  requested_amount numeric not null,
  purpose text,
  status text default 'submitted',
  decision_note text,
  decided_by text,
  decided_at timestamptz,
  is_demo_data boolean default false,
  created_by_id text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.idea (
  id text primary key default gen_random_uuid()::text,
  "user" text,
  text text not null,
  status text default 'new',
  is_demo_data boolean default false,
  created_by_id text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.inbox_item (
  id text primary key default gen_random_uuid()::text,
  recipient text not null,
  kind text default 'notice',
  title text not null,
  body text,
  sender text,
  read boolean default false,
  affects_recipient boolean default false,
  is_demo_data boolean default false,
  created_by_id text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.member_document (
  id text primary key default gen_random_uuid()::text,
  "user" text not null,
  type text not null,
  file text,
  file_name text,
  file_size numeric,
  status text default 'uploaded',
  reviewer_note text,
  reviewed_by text,
  reviewed_at timestamptz,
  is_demo_data boolean default false,
  created_by_id text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.mentor_request (
  id text primary key default gen_random_uuid()::text,
  business text not null,
  status text default 'new',
  note text,
  is_demo_data boolean default false,
  created_by_id text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.notice (
  id text primary key default gen_random_uuid()::text,
  type text not null,
  headline text not null,
  areas jsonb,
  all_areas boolean default false,
  starts_at timestamptz,
  ends_at timestamptz,
  details text,
  channels jsonb,
  status text not null default 'active',
  created_by text,
  is_demo_data boolean default false,
  created_by_id text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.notice_reminder (
  id text primary key default gen_random_uuid()::text,
  notice text not null,
  "user" text not null,
  is_demo_data boolean default false,
  created_by_id text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.notification_log (
  id text primary key default gen_random_uuid()::text,
  recipient text not null,
  channel text not null,
  template text,
  body text not null,
  status text default 'queued (stub)',
  is_demo_data boolean default false,
  created_by_id text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.opportunity (
  id text primary key default gen_random_uuid()::text,
  type text not null,
  title text not null,
  details text,
  budget numeric,
  pay text,
  closing_date timestamptz,
  sector text,
  positions numeric default 1,
  required_skills jsonb,
  posted_by_type text default 'led',
  business text,
  status text not null default 'open',
  notify_option boolean default true,
  is_demo_data boolean default false,
  created_by_id text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.opportunity_response (
  id text primary key default gen_random_uuid()::text,
  opportunity text not null,
  responder text not null,
  business text,
  quote_amount numeric,
  note text,
  share_skills_profile boolean default false,
  status text default 'new',
  decided_by text,
  is_demo_data boolean default false,
  created_by_id text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.poll (
  id text primary key default gen_random_uuid()::text,
  question text not null,
  status text not null default 'open',
  is_demo_data boolean default false,
  created_by_id text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.poll_option (
  id text primary key default gen_random_uuid()::text,
  poll text not null,
  label text not null,
  is_demo_data boolean default false,
  created_by_id text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.poll_vote (
  id text primary key default gen_random_uuid()::text,
  poll text not null,
  option text not null,
  "user" text not null,
  is_demo_data boolean default false,
  created_by_id text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.program (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  description text,
  funder text not null,
  max_amount numeric,
  support_type text,
  required_documents jsonb,
  slots_total numeric default 0,
  status text not null default 'open',
  is_demo_data boolean default false,
  created_by_id text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.report (
  id text primary key default gen_random_uuid()::text,
  reference text not null,
  type text not null,
  area text not null,
  description text,
  location text,
  reporter text,
  status text default 'received',
  assigned_to text,
  is_demo_data boolean default false,
  created_by_id text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.report_export (
  id text primary key default gen_random_uuid()::text,
  type text not null,
  generated_by text,
  generated_at timestamptz,
  file text,
  is_demo_data boolean default false,
  created_by_id text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.user_profile (
  id text primary key default gen_random_uuid()::text,
  "user" text not null,
  account_type text not null,
  full_name text,
  phone text,
  alt_phone text,
  email text,
  area text,
  ward text,
  language text default 'English',
  skills jsonb,
  alert_preferences jsonb,
  alert_channel text default 'app',
  popia_consent_at timestamptz,
  date_of_birth date,
  gender text,
  marital_status text,
  address text,
  housing_tenure text,
  years_in_area numeric,
  household_size numeric,
  dependants_count numeric,
  employment_status text,
  occupation text,
  income_band text,
  support_needed jsonb,
  onboarding_step numeric default 1,
  onboarding_completed_at timestamptz,
  is_demo_data boolean default false,
  created_by_id text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.verification_application (
  id text primary key default gen_random_uuid()::text,
  business text not null,
  reference text,
  status text not null default 'draft',
  draft_step numeric default 1,
  submitted_at timestamptz,
  assigned_to text,
  site_visit_at timestamptz,
  decision_reason text,
  decision_note text,
  decided_by text,
  decided_at timestamptz,
  consent_at timestamptz,
  declaration_at timestamptz,
  signature_name text,
  duplicate_flag boolean default false,
  created_by_officer boolean default false,
  owner_id_number text,
  is_demo_data boolean default false,
  created_by_id text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.verification_log (
  id text primary key default gen_random_uuid()::text,
  application text not null,
  actor text,
  action text not null,
  detail text,
  is_demo_data boolean default false,
  created_by_id text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.ward (
  id text primary key default gen_random_uuid()::text,
  number numeric not null,
  area_name text not null,
  is_demo_data boolean default false,
  created_by_id text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.workshop (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  starts_at timestamptz not null,
  venue text,
  capacity numeric default 0,
  is_demo_data boolean default false,
  created_by_id text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.workshop_booking (
  id text primary key default gen_random_uuid()::text,
  workshop text not null,
  business text,
  "user" text not null,
  is_demo_data boolean default false,
  created_by_id text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create or replace function public.current_app_user_id() returns text
language sql stable security definer set search_path = public set row_security = off
as $$ select coalesce((select id from public.users where auth_user_id = auth.uid()), auth.uid()::text) $$;

create or replace function public.is_app_admin() returns boolean
language sql stable security definer set search_path = public set row_security = off
as $$ select exists (select 1 from public.users where auth_user_id = auth.uid() and role = 'admin') $$;

create or replace function public.protect_user_privileges() returns trigger
language plpgsql security definer set search_path = public
as $$ begin
  if auth.role() <> 'service_role' and (
    new.role is distinct from old.role
    or new.officer_role is distinct from old.officer_role
    or new.auth_user_id is distinct from old.auth_user_id
    or (new.account_type = 'officer' and old.account_type is distinct from 'officer')
  ) then
    raise exception 'Only a trusted administrator may change account privileges';
  end if;
  return new;
end; $$;

create trigger protect_user_privileges before update on public.users
for each row execute function public.protect_user_privileges();

create or replace function public.protect_user_profile_role() returns trigger
language plpgsql security definer set search_path = public
as $$ begin
  if new.account_type = 'officer' and not public.is_app_admin() then
    raise exception 'Only an administrator may assign officer accounts';
  end if;
  return new;
end; $$;

create trigger protect_user_profile_role before insert or update on public.user_profile
for each row execute function public.protect_user_profile_role();

create or replace function public.link_imported_auth_user() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  update public.users
  set auth_user_id = auth_user.id
  from auth.users as auth_user
  where public.users.id = new."user"
    and public.users.auth_user_id is null
    and lower(auth_user.email) = lower(new.email);
  return new;
end; $$;

create trigger link_imported_auth_user
after insert or update of email, "user" on public.user_profile
for each row execute function public.link_imported_auth_user();

create or replace function public.handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = public
as $$
declare legacy_id text;
begin
  select "user" into legacy_id from public.user_profile where lower(email) = lower(new.email) order by created_date limit 1;
  if legacy_id is not null then
    update public.users set auth_user_id = new.id where id = legacy_id and auth_user_id is null;
  end if;
  insert into public.users (id, auth_user_id, role, account_type) values (coalesce(legacy_id, new.id::text), new.id, 'user', 'member') on conflict (id) do update set auth_user_id = excluded.auth_user_id where public.users.auth_user_id is null;
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.next_verification_reference() returns text
language plpgsql security definer set search_path = public
as $$
declare
  reference_year text := to_char(now(), 'YYYY');
  next_number integer;
begin
  perform pg_advisory_xact_lock(hashtext('verification_application_reference_' || reference_year));
  select count(*) + 1 into next_number
  from public.verification_application
  where reference like 'VA-' || reference_year || '-%';
  return 'VA-' || reference_year || '-' || lpad(next_number::text, 4, '0');
end; $$;

create unique index if not exists verification_application_reference_unique
on public.verification_application (reference) where reference is not null;

create or replace function public.set_updated_date() returns trigger
language plpgsql set search_path = public
as $$ begin new.updated_date = now(); return new; end; $$;

alter table public.users enable row level security;
create trigger set_users_updated_date before update on public.users for each row execute function public.set_updated_date();
create index if not exists users_created_by_idx on public.users (created_by_id);
create policy users_select on public.users for select to authenticated using (auth_user_id = auth.uid() or public.is_app_admin());
create policy users_update on public.users for update to authenticated using (auth_user_id = auth.uid() or public.is_app_admin()) with check (auth_user_id = auth.uid() or public.is_app_admin());
grant select, update on public.users to authenticated;

alter table public.broadcast enable row level security;
create trigger set_broadcast_updated_date before update on public.broadcast for each row execute function public.set_updated_date();
create index if not exists broadcast_created_by_idx on public.broadcast (created_by_id);
create policy broadcast_admin_all on public.broadcast for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());
grant select, insert, update, delete on public.broadcast to authenticated;

alter table public.business enable row level security;
create trigger set_business_updated_date before update on public.business for each row execute function public.set_updated_date();
create index if not exists business_created_by_idx on public.business (created_by_id);
create policy business_read on public.business for select to anon, authenticated using ((status = 'verified') or owner = public.current_app_user_id() or public.is_app_admin());
create policy business_insert on public.business for insert to authenticated with check (created_by_id = public.current_app_user_id());
create policy business_update on public.business for update to authenticated using ((owner = public.current_app_user_id() or public.is_app_admin())) with check ((owner = public.current_app_user_id() or public.is_app_admin()));
create policy business_delete on public.business for delete to authenticated using ((owner = public.current_app_user_id() or public.is_app_admin()));
grant select, insert, update, delete on public.business to authenticated;
grant select on public.business to anon;

alter table public.business_document enable row level security;
create trigger set_business_document_updated_date before update on public.business_document for each row execute function public.set_updated_date();
create index if not exists business_document_created_by_idx on public.business_document (created_by_id);
create policy business_document_read on public.business_document for select to authenticated using (created_by_id = public.current_app_user_id() or public.is_app_admin());
create policy business_document_insert on public.business_document for insert to authenticated with check (created_by_id = public.current_app_user_id());
create policy business_document_update on public.business_document for update to authenticated using ((created_by_id = public.current_app_user_id() or public.is_app_admin())) with check ((created_by_id = public.current_app_user_id() or public.is_app_admin()));
create policy business_document_delete on public.business_document for delete to authenticated using ((created_by_id = public.current_app_user_id() or public.is_app_admin()));
grant select, insert, update, delete on public.business_document to authenticated;

alter table public.document_rule enable row level security;
create trigger set_document_rule_updated_date before update on public.document_rule for each row execute function public.set_updated_date();
create index if not exists document_rule_created_by_idx on public.document_rule (created_by_id);
create policy document_rule_admin_all on public.document_rule for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());
create policy document_rule_public_read on public.document_rule for select to anon, authenticated using (true);
grant select, insert, update, delete on public.document_rule to authenticated;
grant select on public.document_rule to anon;

alter table public.favorite enable row level security;
create trigger set_favorite_updated_date before update on public.favorite for each row execute function public.set_updated_date();
create index if not exists favorite_created_by_idx on public.favorite (created_by_id);
create policy favorite_read on public.favorite for select to authenticated using (created_by_id = public.current_app_user_id() or public.is_app_admin());
create policy favorite_insert on public.favorite for insert to authenticated with check (created_by_id = public.current_app_user_id());
create policy favorite_update on public.favorite for update to authenticated using ((created_by_id = public.current_app_user_id() or public.is_app_admin())) with check ((created_by_id = public.current_app_user_id() or public.is_app_admin()));
create policy favorite_delete on public.favorite for delete to authenticated using ((created_by_id = public.current_app_user_id() or public.is_app_admin()));
grant select, insert, update, delete on public.favorite to authenticated;

alter table public.funding_application enable row level security;
create trigger set_funding_application_updated_date before update on public.funding_application for each row execute function public.set_updated_date();
create index if not exists funding_application_created_by_idx on public.funding_application (created_by_id);
create policy funding_application_read on public.funding_application for select to authenticated using (created_by_id = public.current_app_user_id() or public.is_app_admin());
create policy funding_application_insert on public.funding_application for insert to authenticated with check (auth.uid() is not null);
create policy funding_application_update on public.funding_application for update to authenticated using (public.is_app_admin()) with check (public.is_app_admin());
create policy funding_application_delete on public.funding_application for delete to authenticated using (public.is_app_admin());
grant select, insert, update, delete on public.funding_application to authenticated;

alter table public.idea enable row level security;
create trigger set_idea_updated_date before update on public.idea for each row execute function public.set_updated_date();
create index if not exists idea_created_by_idx on public.idea (created_by_id);
create policy idea_read on public.idea for select to authenticated using (created_by_id = public.current_app_user_id() or public.is_app_admin());
create policy idea_insert on public.idea for insert to authenticated with check (created_by_id = public.current_app_user_id());
create policy idea_update on public.idea for update to authenticated using (public.is_app_admin()) with check (public.is_app_admin());
create policy idea_delete on public.idea for delete to authenticated using (public.is_app_admin());
grant select, insert, update, delete on public.idea to authenticated;

alter table public.inbox_item enable row level security;
create trigger set_inbox_item_updated_date before update on public.inbox_item for each row execute function public.set_updated_date();
create index if not exists inbox_item_created_by_idx on public.inbox_item (created_by_id);
create policy inbox_item_read on public.inbox_item for select to authenticated using (recipient = public.current_app_user_id() or public.is_app_admin());
create policy inbox_item_insert on public.inbox_item for insert to authenticated with check (auth.uid() is not null);
create policy inbox_item_update on public.inbox_item for update to authenticated using ((recipient = public.current_app_user_id() or public.is_app_admin())) with check ((recipient = public.current_app_user_id() or public.is_app_admin()));
create policy inbox_item_delete on public.inbox_item for delete to authenticated using (public.is_app_admin());
grant select, insert, update, delete on public.inbox_item to authenticated;

alter table public.member_document enable row level security;
create trigger set_member_document_updated_date before update on public.member_document for each row execute function public.set_updated_date();
create index if not exists member_document_created_by_idx on public.member_document (created_by_id);
create policy member_document_read on public.member_document for select to authenticated using (created_by_id = public.current_app_user_id() or public.is_app_admin());
create policy member_document_insert on public.member_document for insert to authenticated with check (created_by_id = public.current_app_user_id());
create policy member_document_update on public.member_document for update to authenticated using ((created_by_id = public.current_app_user_id() or public.is_app_admin())) with check ((created_by_id = public.current_app_user_id() or public.is_app_admin()));
create policy member_document_delete on public.member_document for delete to authenticated using ((created_by_id = public.current_app_user_id() or public.is_app_admin()));
grant select, insert, update, delete on public.member_document to authenticated;

alter table public.mentor_request enable row level security;
create trigger set_mentor_request_updated_date before update on public.mentor_request for each row execute function public.set_updated_date();
create index if not exists mentor_request_created_by_idx on public.mentor_request (created_by_id);
create policy mentor_request_read on public.mentor_request for select to authenticated using (created_by_id = public.current_app_user_id() or public.is_app_admin());
create policy mentor_request_insert on public.mentor_request for insert to authenticated with check (created_by_id = public.current_app_user_id());
create policy mentor_request_update on public.mentor_request for update to authenticated using (public.is_app_admin()) with check (public.is_app_admin());
create policy mentor_request_delete on public.mentor_request for delete to authenticated using (public.is_app_admin());
grant select, insert, update, delete on public.mentor_request to authenticated;

alter table public.notice enable row level security;
create trigger set_notice_updated_date before update on public.notice for each row execute function public.set_updated_date();
create index if not exists notice_created_by_idx on public.notice (created_by_id);
create policy notice_read on public.notice for select to anon, authenticated using ((status in ('active', 'resolved')) or created_by_id = public.current_app_user_id() or public.is_app_admin());
create policy notice_insert on public.notice for insert to authenticated with check (public.is_app_admin());
create policy notice_update on public.notice for update to authenticated using (public.is_app_admin()) with check (public.is_app_admin());
create policy notice_delete on public.notice for delete to authenticated using (public.is_app_admin());
grant select, insert, update, delete on public.notice to authenticated;
grant select on public.notice to anon;

alter table public.notice_reminder enable row level security;
create trigger set_notice_reminder_updated_date before update on public.notice_reminder for each row execute function public.set_updated_date();
create index if not exists notice_reminder_created_by_idx on public.notice_reminder (created_by_id);
create policy notice_reminder_read on public.notice_reminder for select to authenticated using (created_by_id = public.current_app_user_id() or public.is_app_admin());
create policy notice_reminder_insert on public.notice_reminder for insert to authenticated with check (created_by_id = public.current_app_user_id());
create policy notice_reminder_update on public.notice_reminder for update to authenticated using ((created_by_id = public.current_app_user_id() or public.is_app_admin())) with check ((created_by_id = public.current_app_user_id() or public.is_app_admin()));
create policy notice_reminder_delete on public.notice_reminder for delete to authenticated using ((created_by_id = public.current_app_user_id() or public.is_app_admin()));
grant select, insert, update, delete on public.notice_reminder to authenticated;

alter table public.notification_log enable row level security;
create trigger set_notification_log_updated_date before update on public.notification_log for each row execute function public.set_updated_date();
create index if not exists notification_log_created_by_idx on public.notification_log (created_by_id);
create policy notification_log_read on public.notification_log for select to authenticated using (false or public.is_app_admin());
create policy notification_log_insert on public.notification_log for insert to authenticated with check (auth.uid() is not null);
create policy notification_log_update on public.notification_log for update to authenticated using (public.is_app_admin()) with check (public.is_app_admin());
create policy notification_log_delete on public.notification_log for delete to authenticated using (public.is_app_admin());
grant select, insert, update, delete on public.notification_log to authenticated;

alter table public.opportunity enable row level security;
create trigger set_opportunity_updated_date before update on public.opportunity for each row execute function public.set_updated_date();
create index if not exists opportunity_created_by_idx on public.opportunity (created_by_id);
create policy opportunity_read on public.opportunity for select to anon, authenticated using ((status = 'open') or created_by_id = public.current_app_user_id() or public.is_app_admin());
create policy opportunity_insert on public.opportunity for insert to authenticated with check (auth.uid() is not null);
create policy opportunity_update on public.opportunity for update to authenticated using ((created_by_id = public.current_app_user_id() or public.is_app_admin())) with check ((created_by_id = public.current_app_user_id() or public.is_app_admin()));
create policy opportunity_delete on public.opportunity for delete to authenticated using ((created_by_id = public.current_app_user_id() or public.is_app_admin()));
grant select, insert, update, delete on public.opportunity to authenticated;
grant select on public.opportunity to anon;

alter table public.opportunity_response enable row level security;
create trigger set_opportunity_response_updated_date before update on public.opportunity_response for each row execute function public.set_updated_date();
create index if not exists opportunity_response_created_by_idx on public.opportunity_response (created_by_id);
create policy opportunity_response_read on public.opportunity_response for select to authenticated using (created_by_id = public.current_app_user_id() or public.is_app_admin());
create policy opportunity_response_insert on public.opportunity_response for insert to authenticated with check (auth.uid() is not null);
create policy opportunity_response_update on public.opportunity_response for update to authenticated using (public.is_app_admin()) with check (public.is_app_admin());
create policy opportunity_response_delete on public.opportunity_response for delete to authenticated using (public.is_app_admin());
grant select, insert, update, delete on public.opportunity_response to authenticated;

alter table public.poll enable row level security;
create trigger set_poll_updated_date before update on public.poll for each row execute function public.set_updated_date();
create index if not exists poll_created_by_idx on public.poll (created_by_id);
create policy poll_admin_all on public.poll for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());
create policy poll_public_read on public.poll for select to anon, authenticated using (status = 'open' or public.is_app_admin());
grant select, insert, update, delete on public.poll to authenticated;
grant select on public.poll to anon;

alter table public.poll_option enable row level security;
create trigger set_poll_option_updated_date before update on public.poll_option for each row execute function public.set_updated_date();
create index if not exists poll_option_created_by_idx on public.poll_option (created_by_id);
create policy poll_option_read on public.poll_option for select to anon, authenticated using ((true) or created_by_id = public.current_app_user_id() or public.is_app_admin());
create policy poll_option_insert on public.poll_option for insert to authenticated with check (public.is_app_admin());
create policy poll_option_update on public.poll_option for update to authenticated using (public.is_app_admin()) with check (public.is_app_admin());
create policy poll_option_delete on public.poll_option for delete to authenticated using (public.is_app_admin());
grant select, insert, update, delete on public.poll_option to authenticated;
grant select on public.poll_option to anon;

alter table public.poll_vote enable row level security;
create trigger set_poll_vote_updated_date before update on public.poll_vote for each row execute function public.set_updated_date();
create index if not exists poll_vote_created_by_idx on public.poll_vote (created_by_id);
create policy poll_vote_read on public.poll_vote for select to authenticated using (created_by_id = public.current_app_user_id() or public.is_app_admin());
create policy poll_vote_insert on public.poll_vote for insert to authenticated with check (created_by_id = public.current_app_user_id());
create policy poll_vote_update on public.poll_vote for update to authenticated using ((created_by_id = public.current_app_user_id() or public.is_app_admin())) with check ((created_by_id = public.current_app_user_id() or public.is_app_admin()));
create policy poll_vote_delete on public.poll_vote for delete to authenticated using ((created_by_id = public.current_app_user_id() or public.is_app_admin()));
grant select, insert, update, delete on public.poll_vote to authenticated;

alter table public.program enable row level security;
create trigger set_program_updated_date before update on public.program for each row execute function public.set_updated_date();
create index if not exists program_created_by_idx on public.program (created_by_id);
create policy program_admin_all on public.program for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());
create policy program_public_read on public.program for select to anon, authenticated using (true);
grant select, insert, update, delete on public.program to authenticated;
grant select on public.program to anon;

alter table public.report enable row level security;
create trigger set_report_updated_date before update on public.report for each row execute function public.set_updated_date();
create index if not exists report_created_by_idx on public.report (created_by_id);
create policy report_read on public.report for select to authenticated using (created_by_id = public.current_app_user_id() or public.is_app_admin());
create policy report_insert on public.report for insert to authenticated with check (created_by_id = public.current_app_user_id());
create policy report_update on public.report for update to authenticated using (public.is_app_admin()) with check (public.is_app_admin());
create policy report_delete on public.report for delete to authenticated using (public.is_app_admin());
grant select, insert, update, delete on public.report to authenticated;

alter table public.report_export enable row level security;
create trigger set_report_export_updated_date before update on public.report_export for each row execute function public.set_updated_date();
create index if not exists report_export_created_by_idx on public.report_export (created_by_id);
create policy report_export_admin_all on public.report_export for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());
grant select, insert, update, delete on public.report_export to authenticated;

alter table public.user_profile enable row level security;
create trigger set_user_profile_updated_date before update on public.user_profile for each row execute function public.set_updated_date();
create index if not exists user_profile_created_by_idx on public.user_profile (created_by_id);
create policy user_profile_read on public.user_profile for select to authenticated using ("user" = public.current_app_user_id() or public.is_app_admin());
create policy user_profile_insert on public.user_profile for insert to authenticated with check (created_by_id = public.current_app_user_id() and "user" = public.current_app_user_id());
create policy user_profile_update on public.user_profile for update to authenticated using (("user" = public.current_app_user_id() or public.is_app_admin())) with check (("user" = public.current_app_user_id() or public.is_app_admin()));
create policy user_profile_delete on public.user_profile for delete to authenticated using (("user" = public.current_app_user_id() or public.is_app_admin()));
grant select, insert, update, delete on public.user_profile to authenticated;

alter table public.verification_application enable row level security;
create trigger set_verification_application_updated_date before update on public.verification_application for each row execute function public.set_updated_date();
create index if not exists verification_application_created_by_idx on public.verification_application (created_by_id);
create policy verification_application_read on public.verification_application for select to authenticated using (created_by_id = public.current_app_user_id() or public.is_app_admin());
create policy verification_application_insert on public.verification_application for insert to authenticated with check (created_by_id = public.current_app_user_id());
create policy verification_application_update on public.verification_application for update to authenticated using ((created_by_id = public.current_app_user_id() or public.is_app_admin())) with check ((created_by_id = public.current_app_user_id() or public.is_app_admin()));
create policy verification_application_delete on public.verification_application for delete to authenticated using ((created_by_id = public.current_app_user_id() or public.is_app_admin()));
grant select, insert, update, delete on public.verification_application to authenticated;

alter table public.verification_log enable row level security;
create trigger set_verification_log_updated_date before update on public.verification_log for each row execute function public.set_updated_date();
create index if not exists verification_log_created_by_idx on public.verification_log (created_by_id);
create policy verification_log_admin_all on public.verification_log for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());
grant select, insert, update, delete on public.verification_log to authenticated;

alter table public.ward enable row level security;
create trigger set_ward_updated_date before update on public.ward for each row execute function public.set_updated_date();
create index if not exists ward_created_by_idx on public.ward (created_by_id);
create policy ward_admin_all on public.ward for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());
create policy ward_public_read on public.ward for select to anon, authenticated using (true);
grant select, insert, update, delete on public.ward to authenticated;
grant select on public.ward to anon;

alter table public.workshop enable row level security;
create trigger set_workshop_updated_date before update on public.workshop for each row execute function public.set_updated_date();
create index if not exists workshop_created_by_idx on public.workshop (created_by_id);
create policy workshop_admin_all on public.workshop for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());
create policy workshop_public_read on public.workshop for select to anon, authenticated using (true);
grant select, insert, update, delete on public.workshop to authenticated;
grant select on public.workshop to anon;

alter table public.workshop_booking enable row level security;
create trigger set_workshop_booking_updated_date before update on public.workshop_booking for each row execute function public.set_updated_date();
create index if not exists workshop_booking_created_by_idx on public.workshop_booking (created_by_id);
create policy workshop_booking_read on public.workshop_booking for select to authenticated using (created_by_id = public.current_app_user_id() or public.is_app_admin());
create policy workshop_booking_insert on public.workshop_booking for insert to authenticated with check (created_by_id = public.current_app_user_id());
create policy workshop_booking_update on public.workshop_booking for update to authenticated using ((created_by_id = public.current_app_user_id() or public.is_app_admin())) with check ((created_by_id = public.current_app_user_id() or public.is_app_admin()));
create policy workshop_booking_delete on public.workshop_booking for delete to authenticated using ((created_by_id = public.current_app_user_id() or public.is_app_admin()));
grant select, insert, update, delete on public.workshop_booking to authenticated;

grant execute on function public.current_app_user_id() to anon, authenticated;
grant execute on function public.is_app_admin() to anon, authenticated;
revoke execute on function public.next_verification_reference() from public, anon, authenticated;
grant execute on function public.next_verification_reference() to service_role;

insert into storage.buckets (id, name, public)
values ('private-documents', 'private-documents', false)
on conflict (id) do nothing;

create policy private_documents_upload on storage.objects
for insert to authenticated
with check (
  bucket_id = 'private-documents'
  and (storage.foldername(name))[1] = public.current_app_user_id()
);

create policy private_documents_read on storage.objects
for select to authenticated
using (
  bucket_id = 'private-documents'
  and ((storage.foldername(name))[1] = public.current_app_user_id() or public.is_app_admin())
);

create policy private_documents_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'private-documents'
  and ((storage.foldername(name))[1] = public.current_app_user_id() or public.is_app_admin())
);
