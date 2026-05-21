-- AgendaPro v0.6.1.6 — Dashboard + Publish Fix
-- Safe incremental patch. Run in Supabase SQL Editor if publication/readiness columns are missing.

create extension if not exists "pgcrypto";

alter table if exists public.agendapro_created_agendas
  add column if not exists readiness_status text default 'incomplete',
  add column if not exists readiness_score integer default 0,
  add column if not exists validation_issues jsonb default '[]'::jsonb,
  add column if not exists published boolean default false,
  add column if not exists updated_at timestamptz default now();

alter table if exists public.agendapro_companies
  add column if not exists agenda_readiness_status text default 'incomplete',
  add column if not exists agenda_readiness_score integer default 0,
  add column if not exists agenda_validation_issues jsonb default '[]'::jsonb,
  add column if not exists public_slug text,
  add column if not exists onboarding_status text;

create index if not exists idx_agp_created_agendas_public_slug
  on public.agendapro_created_agendas(public_slug);

create index if not exists idx_agp_created_agendas_account_id
  on public.agendapro_created_agendas(account_id);

create index if not exists idx_agp_created_agendas_company_id
  on public.agendapro_created_agendas(company_id);

create index if not exists idx_agp_created_agendas_status
  on public.agendapro_created_agendas(status);

notify pgrst, 'reload schema';

select 'AgendaPro v0.6.1.6 dashboard/publish patch aplicado com segurança' as status;
