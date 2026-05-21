-- =========================================================
-- AgendaPro v0.5.6
-- Complemento para fluxo real: agendamentos públicos,
-- logs internos, proteção por dashboard e atualização de status.
-- =========================================================

create extension if not exists "pgcrypto";

create table if not exists public.agendapro_public_booking_requests (
  id uuid primary key default gen_random_uuid(),
  agenda_id uuid,
  account_id uuid references public.agendapro_client_accounts(id) on delete set null,
  company_id uuid references public.agendapro_companies(id) on delete set null,
  agenda_slug text not null,
  business_name text,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  service_name text,
  requested_date text,
  requested_time text,
  status text not null default 'pending',
  notes text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_agendapro_public_booking_slug
on public.agendapro_public_booking_requests(agenda_slug);

create index if not exists idx_agendapro_public_booking_account
on public.agendapro_public_booking_requests(account_id);

create index if not exists idx_agendapro_public_booking_company
on public.agendapro_public_booking_requests(company_id);

create index if not exists idx_agendapro_public_booking_status
on public.agendapro_public_booking_requests(status);

alter table public.agendapro_public_booking_requests enable row level security;

drop policy if exists "agendapro_public_booking_owner_select" on public.agendapro_public_booking_requests;
drop policy if exists "agendapro_public_booking_owner_update" on public.agendapro_public_booking_requests;

create policy "agendapro_public_booking_owner_select"
on public.agendapro_public_booking_requests
for select
using (
  exists (
    select 1
    from public.agendapro_client_accounts ca
    where ca.id = agendapro_public_booking_requests.account_id
      and ca.auth_user_id = auth.uid()
  )
);

create policy "agendapro_public_booking_owner_update"
on public.agendapro_public_booking_requests
for update
using (
  exists (
    select 1
    from public.agendapro_client_accounts ca
    where ca.id = agendapro_public_booking_requests.account_id
      and ca.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.agendapro_client_accounts ca
    where ca.id = agendapro_public_booking_requests.account_id
      and ca.auth_user_id = auth.uid()
  )
);

-- Inserção pública controlada pelo backend service_role.
-- Não criar policy pública de insert aqui. A API /api/create-public-booking faz validação e grava com service role.

alter table public.agendapro_client_activity_logs enable row level security;

create index if not exists idx_agendapro_logs_action
on public.agendapro_client_activity_logs(action);

create index if not exists idx_agendapro_logs_created_at
on public.agendapro_client_activity_logs(created_at desc);

notify pgrst, 'reload schema';

select 'AgendaPro v0.5.6 real SaaS security ready' as status;
