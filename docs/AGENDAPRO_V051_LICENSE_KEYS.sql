
-- AgendaPro v0.5.1 — License Keys / Trial Comercial
create extension if not exists "pgcrypto";
create table if not exists public.agendapro_license_keys (
  id uuid primary key default gen_random_uuid(),
  key_hash text unique not null,
  key_prefix text not null,
  type text not null default 'trial_professional',
  plan_id text default 'professional',
  duration_days int not null default 30,
  status text not null default 'available',
  max_uses int not null default 1,
  uses_count int not null default 0,
  expires_at timestamptz,
  activated_at timestamptz,
  activated_email text,
  activated_business_name text,
  notes text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists public.agendapro_license_key_redemptions (
  id uuid primary key default gen_random_uuid(),
  license_key_id uuid references public.agendapro_license_keys(id) on delete set null,
  account_id uuid references public.agendapro_client_accounts(id) on delete set null,
  company_id uuid references public.agendapro_companies(id) on delete set null,
  email text,
  business_name text,
  plan_id text,
  status text default 'active',
  activated_at timestamptz default now(),
  expires_at timestamptz,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);
create or replace function public.agendapro_set_updated_at() returns trigger as $$ begin new.updated_at = now(); return new; end; $$ language plpgsql;
drop trigger if exists agendapro_license_keys_updated_at on public.agendapro_license_keys;
create trigger agendapro_license_keys_updated_at before update on public.agendapro_license_keys for each row execute function public.agendapro_set_updated_at();
create index if not exists idx_agendapro_license_keys_hash on public.agendapro_license_keys(key_hash);
create index if not exists idx_agendapro_license_keys_status on public.agendapro_license_keys(status);
create index if not exists idx_agendapro_license_keys_plan on public.agendapro_license_keys(plan_id);
create index if not exists idx_agendapro_license_redemptions_email on public.agendapro_license_key_redemptions(lower(email));
alter table public.agendapro_license_keys enable row level security;
alter table public.agendapro_license_key_redemptions enable row level security;
drop policy if exists "agendapro_dev_service_license_keys" on public.agendapro_license_keys;
drop policy if exists "agendapro_dev_service_license_redemptions" on public.agendapro_license_key_redemptions;
create policy "agendapro_dev_service_license_keys" on public.agendapro_license_keys for all using (true) with check (true);
create policy "agendapro_dev_service_license_redemptions" on public.agendapro_license_key_redemptions for all using (true) with check (true);
select 'AgendaPro v0.5.1 license keys ready' as status;
