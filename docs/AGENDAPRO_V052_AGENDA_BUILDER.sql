-- =========================================================
-- AgendaPro v0.5.2
-- Criador real de agenda, página pública dinâmica e pagamento manual
-- =========================================================

create extension if not exists "pgcrypto";

create table if not exists public.agendapro_created_agendas (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.agendapro_client_accounts(id) on delete set null,
  company_id uuid references public.agendapro_companies(id) on delete set null,
  email text,
  full_name text,
  whatsapp text,
  business_name text not null,
  public_slug text unique not null,
  public_link text,
  plan_id text,
  status text not null default 'draft',
  published_at timestamptz,
  segment text,
  address text,
  description text,
  theme jsonb default '{}',
  services jsonb default '[]',
  team jsonb default '[]',
  hours jsonb default '{}',
  rules jsonb default '{}',
  raw_payload jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.agendapro_created_agendas
  add column if not exists account_id uuid references public.agendapro_client_accounts(id) on delete set null,
  add column if not exists company_id uuid references public.agendapro_companies(id) on delete set null,
  add column if not exists email text,
  add column if not exists full_name text,
  add column if not exists whatsapp text,
  add column if not exists business_name text,
  add column if not exists public_slug text,
  add column if not exists public_link text,
  add column if not exists plan_id text,
  add column if not exists status text default 'draft',
  add column if not exists published_at timestamptz,
  add column if not exists segment text,
  add column if not exists address text,
  add column if not exists description text,
  add column if not exists theme jsonb default '{}',
  add column if not exists services jsonb default '[]',
  add column if not exists team jsonb default '[]',
  add column if not exists hours jsonb default '{}',
  add column if not exists rules jsonb default '{}',
  add column if not exists raw_payload jsonb default '{}',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create table if not exists public.agendapro_manual_payment_requests (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.agendapro_client_accounts(id) on delete set null,
  company_id uuid references public.agendapro_companies(id) on delete set null,
  full_name text,
  email text,
  whatsapp text,
  business_name text,
  plan_id text,
  plan_name text,
  amount numeric(10,2) default 0,
  status text not null default 'pending_review',
  include_implementation boolean default false,
  note text,
  payment_link text,
  reviewed_at timestamptz,
  review_note text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.agendapro_manual_payment_requests
  add column if not exists account_id uuid references public.agendapro_client_accounts(id) on delete set null,
  add column if not exists company_id uuid references public.agendapro_companies(id) on delete set null,
  add column if not exists full_name text,
  add column if not exists email text,
  add column if not exists whatsapp text,
  add column if not exists business_name text,
  add column if not exists plan_id text,
  add column if not exists plan_name text,
  add column if not exists amount numeric(10,2) default 0,
  add column if not exists status text default 'pending_review',
  add column if not exists include_implementation boolean default false,
  add column if not exists note text,
  add column if not exists payment_link text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_note text,
  add column if not exists metadata jsonb default '{}',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create index if not exists idx_agendapro_created_agendas_slug on public.agendapro_created_agendas(public_slug);
create index if not exists idx_agendapro_created_agendas_email on public.agendapro_created_agendas(lower(email));
create index if not exists idx_agendapro_created_agendas_status on public.agendapro_created_agendas(status);
create index if not exists idx_agendapro_manual_payment_email on public.agendapro_manual_payment_requests(lower(email));
create index if not exists idx_agendapro_manual_payment_status on public.agendapro_manual_payment_requests(status);

alter table public.agendapro_created_agendas enable row level security;
alter table public.agendapro_manual_payment_requests enable row level security;

drop policy if exists "agendapro_public_read_published_agendas" on public.agendapro_created_agendas;
drop policy if exists "agendapro_created_agendas_own_select" on public.agendapro_created_agendas;
drop policy if exists "agendapro_manual_payment_own_select" on public.agendapro_manual_payment_requests;

create policy "agendapro_public_read_published_agendas"
on public.agendapro_created_agendas
for select
using (status = 'published');

create policy "agendapro_created_agendas_own_select"
on public.agendapro_created_agendas
for select
using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

create policy "agendapro_manual_payment_own_select"
on public.agendapro_manual_payment_requests
for select
using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

notify pgrst, 'reload schema';

select
  'AgendaPro v0.5.2 - criador de agenda e pagamento manual prontos.' as status,
  (select count(*) from public.agendapro_created_agendas) as agendas_criadas,
  (select count(*) from public.agendapro_manual_payment_requests) as pagamentos_manuais;
