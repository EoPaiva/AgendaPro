-- AgendaPro v0.6.1.7 — Account Settings Fix
-- Corrige salvamento dos dados da conta/negócio no painel do cliente.
-- Rode no Supabase SQL Editor após a v0.6.1.6.

create extension if not exists "pgcrypto";

alter table if exists public.agendapro_client_accounts
  add column if not exists full_name text,
  add column if not exists name text,
  add column if not exists whatsapp text,
  add column if not exists phone text,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists updated_at timestamptz default now();

alter table if exists public.agendapro_companies
  add column if not exists name text,
  add column if not exists business_name text,
  add column if not exists whatsapp text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists public_slug text,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists updated_at timestamptz default now();

update public.agendapro_client_accounts
set name = coalesce(name, full_name),
    full_name = coalesce(full_name, name),
    phone = coalesce(phone, whatsapp),
    whatsapp = coalesce(whatsapp, phone),
    updated_at = coalesce(updated_at, now())
where name is null
   or full_name is null
   or phone is null
   or whatsapp is null
   or updated_at is null;

update public.agendapro_companies
set business_name = coalesce(business_name, name),
    name = coalesce(name, business_name),
    phone = coalesce(phone, whatsapp),
    whatsapp = coalesce(whatsapp, phone),
    updated_at = coalesce(updated_at, now())
where business_name is null
   or name is null
   or phone is null
   or whatsapp is null
   or updated_at is null;

create index if not exists idx_agp_client_accounts_email_v0617
  on public.agendapro_client_accounts(email);

create index if not exists idx_agp_companies_owner_account_v0617
  on public.agendapro_companies(owner_account_id);

notify pgrst, 'reload schema';

select 'AgendaPro v0.6.1.7 account settings fix aplicado com segurança' as status;
