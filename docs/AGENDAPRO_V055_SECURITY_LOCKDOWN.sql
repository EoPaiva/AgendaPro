-- =========================================================
-- AgendaPro v0.5.5 — Security Lockdown
-- Proteções para dashboards privados, keys, pagamentos manuais e agendamentos públicos
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- Requests públicos de agendamento: gravados pela API pública,
-- lidos apenas pelo dono da conta/empresa ou via service role.
-- ---------------------------------------------------------
create table if not exists public.agendapro_public_booking_requests (
  id uuid primary key default gen_random_uuid(),
  agenda_id uuid references public.agendapro_created_agendas(id) on delete cascade,
  account_id uuid references public.agendapro_client_accounts(id) on delete set null,
  company_id uuid references public.agendapro_companies(id) on delete set null,
  agenda_slug text not null,
  business_name text,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  service_name text,
  requested_time text,
  status text not null default 'pending',
  notes text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.agendapro_public_booking_requests
  add column if not exists agenda_id uuid references public.agendapro_created_agendas(id) on delete cascade,
  add column if not exists account_id uuid references public.agendapro_client_accounts(id) on delete set null,
  add column if not exists company_id uuid references public.agendapro_companies(id) on delete set null,
  add column if not exists agenda_slug text,
  add column if not exists business_name text,
  add column if not exists customer_name text,
  add column if not exists customer_phone text,
  add column if not exists customer_email text,
  add column if not exists service_name text,
  add column if not exists requested_time text,
  add column if not exists status text default 'pending',
  add column if not exists notes text,
  add column if not exists metadata jsonb default '{}',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create or replace function public.agendapro_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists agendapro_public_booking_requests_updated_at on public.agendapro_public_booking_requests;
create trigger agendapro_public_booking_requests_updated_at
before update on public.agendapro_public_booking_requests
for each row execute function public.agendapro_set_updated_at();

create index if not exists idx_agendapro_public_booking_slug on public.agendapro_public_booking_requests(agenda_slug);
create index if not exists idx_agendapro_public_booking_company on public.agendapro_public_booking_requests(company_id);
create index if not exists idx_agendapro_public_booking_account on public.agendapro_public_booking_requests(account_id);
create index if not exists idx_agendapro_public_booking_status on public.agendapro_public_booking_requests(status);

-- ---------------------------------------------------------
-- Travar policies permissivas antigas de keys.
-- Service role continua bypassando RLS; anon/auth não lista keys.
-- ---------------------------------------------------------
alter table public.agendapro_license_keys enable row level security;
alter table public.agendapro_license_key_redemptions enable row level security;

drop policy if exists "agendapro_dev_service_license_keys" on public.agendapro_license_keys;
drop policy if exists "agendapro_dev_service_license_redemptions" on public.agendapro_license_key_redemptions;
drop policy if exists "agendapro_license_redemptions_own_select" on public.agendapro_license_key_redemptions;

create policy "agendapro_license_redemptions_own_select"
on public.agendapro_license_key_redemptions
for select
using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- Sem policy de select/insert/update/delete em agendapro_license_keys:
-- anon/auth ficam bloqueados; APIs backend usam service role.

-- ---------------------------------------------------------
-- Agendas criadas: público só lê publicadas; dono vê as suas.
-- Escrita apenas via backend/service role.
-- ---------------------------------------------------------
alter table public.agendapro_created_agendas enable row level security;

drop policy if exists "agendapro_public_read_published_agendas" on public.agendapro_created_agendas;
drop policy if exists "agendapro_created_agendas_own_select" on public.agendapro_created_agendas;

create policy "agendapro_public_read_published_agendas"
on public.agendapro_created_agendas
for select
using (status = 'published');

create policy "agendapro_created_agendas_own_select"
on public.agendapro_created_agendas
for select
using (
  lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  or exists (
    select 1
    from public.agendapro_client_accounts ca
    where ca.id = agendapro_created_agendas.account_id
      and ca.auth_user_id = auth.uid()
  )
);

-- ---------------------------------------------------------
-- Pagamentos manuais: cliente vê apenas os próprios.
-- Aprovação/reprovação só via API dev com service role.
-- ---------------------------------------------------------
alter table public.agendapro_manual_payment_requests enable row level security;

drop policy if exists "agendapro_manual_payment_own_select" on public.agendapro_manual_payment_requests;

create policy "agendapro_manual_payment_own_select"
on public.agendapro_manual_payment_requests
for select
using (
  lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  or exists (
    select 1
    from public.agendapro_client_accounts ca
    where ca.id = agendapro_manual_payment_requests.account_id
      and ca.auth_user_id = auth.uid()
  )
);

-- ---------------------------------------------------------
-- Solicitações públicas de agendamento: não são públicas para leitura.
-- Dono vê pelo dashboard privado; API pública só insere via service role.
-- ---------------------------------------------------------
alter table public.agendapro_public_booking_requests enable row level security;

drop policy if exists "agendapro_public_booking_owner_select" on public.agendapro_public_booking_requests;

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
  or exists (
    select 1
    from public.agendapro_account_companies ac
    join public.agendapro_client_accounts ca on ca.id = ac.account_id
    where ac.company_id = agendapro_public_booking_requests.company_id
      and ac.is_active = true
      and ca.auth_user_id = auth.uid()
  )
);

-- ---------------------------------------------------------
-- Unicidade e rastreabilidade.
-- ---------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'agendapro_license_key_redemptions_license_once'
  ) then
    alter table public.agendapro_license_key_redemptions
      add constraint agendapro_license_key_redemptions_license_once unique (license_key_id);
  end if;
exception when duplicate_table then null;
end $$;

notify pgrst, 'reload schema';

select 'AgendaPro v0.5.5 - security lockdown aplicado com sucesso.' as status;
