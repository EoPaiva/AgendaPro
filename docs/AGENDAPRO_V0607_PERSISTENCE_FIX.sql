-- =========================================================
-- AgendaPro v0.6.0.7 — persistência real de agenda/horários
-- Corrige casos em que horários/configurações voltavam após F5.
-- Rode depois dos SQLs v0.5.6 e v0.6.0.4.
-- =========================================================

create extension if not exists "pgcrypto";

alter table public.agendapro_created_agendas
  add column if not exists schedule_config jsonb default '{}',
  add column if not exists published boolean default false,
  add column if not exists metadata jsonb default '{}',
  add column if not exists updated_at timestamptz default now();

-- Backfill: versões anteriores salvaram a disponibilidade só dentro do raw_payload.
update public.agendapro_created_agendas
set schedule_config = raw_payload -> 'scheduleConfig'
where (schedule_config is null or schedule_config = '{}'::jsonb)
  and raw_payload ? 'scheduleConfig';

update public.agendapro_created_agendas
set published = true
where status = 'published' and coalesce(published, false) = false;

alter table public.agendapro_companies
  add column if not exists business_name text,
  add column if not exists public_slug text,
  add column if not exists phone text,
  add column if not exists whatsapp text,
  add column if not exists address text,
  add column if not exists description text,
  add column if not exists onboarding_status text,
  add column if not exists metadata jsonb default '{}',
  add column if not exists updated_at timestamptz default now();

update public.agendapro_companies
set public_slug = coalesce(public_slug, slug),
    business_name = coalesce(business_name, name)
where public_slug is null or business_name is null;

alter table public.agendapro_client_accounts
  add column if not exists whatsapp text,
  add column if not exists phone text,
  add column if not exists metadata jsonb default '{}',
  add column if not exists updated_at timestamptz default now();

create index if not exists idx_agp_created_agendas_schedule_config on public.agendapro_created_agendas using gin(schedule_config);
create index if not exists idx_agp_companies_public_slug_v0607 on public.agendapro_companies(public_slug);

notify pgrst, 'reload schema';

select 'AgendaPro v0.6.0.7 - persistência de agenda e horários corrigida.' as status;
