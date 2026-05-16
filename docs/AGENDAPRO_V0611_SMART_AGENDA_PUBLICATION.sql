-- AgendaPro v0.6.1.1 — Publicação Inteligente da Agenda
-- Execute depois dos SQLs anteriores. Seguro para rodar mais de uma vez.

create extension if not exists "pgcrypto";

alter table if exists public.agendapro_created_agendas
  add column if not exists readiness_status text default 'incomplete',
  add column if not exists readiness_score integer default 0,
  add column if not exists validation_issues jsonb default '[]'::jsonb,
  add column if not exists unpublished_at timestamptz,
  add column if not exists last_validation_at timestamptz default now();

create index if not exists idx_agp_created_agendas_readiness_status
on public.agendapro_created_agendas(readiness_status);

create index if not exists idx_agp_created_agendas_readiness_score
on public.agendapro_created_agendas(readiness_score);

create index if not exists idx_agp_created_agendas_status_slug
on public.agendapro_created_agendas(status, public_slug);

alter table if exists public.agendapro_companies
  add column if not exists agenda_readiness_status text default 'incomplete',
  add column if not exists agenda_readiness_score integer default 0,
  add column if not exists agenda_validation_issues jsonb default '[]'::jsonb;

create index if not exists idx_agp_companies_agenda_readiness_status
on public.agendapro_companies(agenda_readiness_status);

notify pgrst, 'reload schema';

select 'AgendaPro v0.6.1.1 smart publication schema applied' as status;
