-- AgendaPro v0.6.1.0 — Plan Access Control
-- Bloqueio e liberação de acesso por plano/status.
-- Execute após os SQLs anteriores do AgendaPro.

create extension if not exists "pgcrypto";

alter table public.agendapro_companies
  add column if not exists payment_status text default 'pending',
  add column if not exists access_status text default 'pending',
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_reason text,
  add column if not exists cancelled_at timestamptz,
  add column if not exists access_metadata jsonb default '{}'::jsonb;

alter table public.agendapro_client_accounts
  add column if not exists payment_status text default 'pending',
  add column if not exists access_status text default 'pending',
  add column if not exists plan_expires_at timestamptz,
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_reason text,
  add column if not exists access_metadata jsonb default '{}'::jsonb;

create index if not exists idx_agp_companies_subscription_status
on public.agendapro_companies(subscription_status);

create index if not exists idx_agp_companies_access_status
on public.agendapro_companies(access_status);

create index if not exists idx_agp_companies_plan_expires_at
on public.agendapro_companies(plan_expires_at);

create index if not exists idx_agp_accounts_access_status
on public.agendapro_client_accounts(access_status);

create index if not exists idx_agp_accounts_plan_expires_at
on public.agendapro_client_accounts(plan_expires_at);

-- Normaliza registros antigos sem sobrescrever quem já está configurado.
update public.agendapro_companies
set access_status = case
  when lower(coalesce(subscription_status,'')) in ('active','trial') then 'active'
  when lower(coalesce(subscription_status,'')) in ('expired','cancelled','canceled','suspended','blocked') then lower(subscription_status)
  else coalesce(nullif(access_status,''), 'pending')
end
where access_status is null or access_status = 'pending';

update public.agendapro_client_accounts
set access_status = case
  when lower(coalesce(status,'')) in ('active','trial') then 'active'
  when lower(coalesce(status,'')) in ('expired','cancelled','canceled','suspended','blocked') then lower(status)
  else coalesce(nullif(access_status,''), 'pending')
end
where access_status is null or access_status = 'pending';

-- Garante trilha de auditoria para alterações de status feitas pela Central Dev.
create table if not exists public.agendapro_access_events (
  id uuid primary key default gen_random_uuid(),
  account_id uuid,
  company_id uuid,
  action text not null,
  previous_status text,
  next_status text,
  reason text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_agp_access_events_company_created
on public.agendapro_access_events(company_id, created_at desc);

alter table public.agendapro_access_events enable row level security;

drop policy if exists "agp_access_events_service_role_only" on public.agendapro_access_events;
-- Sem policy pública: APIs com service_role continuam podendo operar; anon não lê/escreve.

notify pgrst, 'reload schema';

select 'AgendaPro v0.6.1.0 Plan Access Control aplicado com sucesso' as status;
