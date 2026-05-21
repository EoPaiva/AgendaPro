-- =========================================================
-- AgendaPro v0.6.0.4 — Central Dev operacional no site principal
-- Mantém o visual da Central Dev e adiciona colunas/tabelas para ações reais.
-- Rode este SQL no Supabase antes do deploy da v0.6.0.4.
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- Contas/clientes: campos editáveis pela Central Dev
-- ---------------------------------------------------------
alter table public.agendapro_client_accounts
  add column if not exists whatsapp text,
  add column if not exists phone text,
  add column if not exists status text default 'pending',
  add column if not exists plan text,
  add column if not exists payment_status text default 'none',
  add column if not exists subscription_status text default 'pending',
  add column if not exists expires_at timestamptz,
  add column if not exists company_id uuid references public.agendapro_companies(id) on delete set null,
  add column if not exists internal_note text,
  add column if not exists metadata jsonb default '{}',
  add column if not exists updated_at timestamptz default now();

-- ---------------------------------------------------------
-- Empresas: dados públicos e operacionais editáveis
-- ---------------------------------------------------------
alter table public.agendapro_companies
  add column if not exists business_name text,
  add column if not exists public_slug text,
  add column if not exists category text,
  add column if not exists status text default 'active',
  add column if not exists phone text,
  add column if not exists whatsapp text,
  add column if not exists email text,
  add column if not exists address text,
  add column if not exists description text,
  add column if not exists plan text,
  add column if not exists current_plan_id text,
  add column if not exists subscription_status text default 'pending',
  add column if not exists plan_started_at timestamptz,
  add column if not exists plan_expires_at timestamptz,
  add column if not exists onboarding_status text,
  add column if not exists readiness_score int default 0,
  add column if not exists theme_color text,
  add column if not exists metadata jsonb default '{}',
  add column if not exists updated_at timestamptz default now();

update public.agendapro_companies
set public_slug = coalesce(public_slug, slug), business_name = coalesce(business_name, name)
where public_slug is null or business_name is null;

create index if not exists idx_agp_companies_public_slug on public.agendapro_companies(public_slug);
create index if not exists idx_agp_companies_status on public.agendapro_companies(status, subscription_status);

-- ---------------------------------------------------------
-- Agendas criadas: publicação, tema e disponibilidade editáveis
-- ---------------------------------------------------------
alter table public.agendapro_created_agendas
  add column if not exists phone text,
  add column if not exists theme_color text,
  add column if not exists schedule_config jsonb default '{}',
  add column if not exists published boolean default false,
  add column if not exists metadata jsonb default '{}';

update public.agendapro_created_agendas
set published = true
where status = 'published' and coalesce(published, false) = false;

-- ---------------------------------------------------------
-- Pagamentos manuais: revisão real e auditável
-- ---------------------------------------------------------
alter table public.agendapro_manual_payment_requests
  add column if not exists reviewed_by text,
  add column if not exists payment_reference text,
  add column if not exists adjustment_requested_at timestamptz;

create index if not exists idx_agp_manual_review on public.agendapro_manual_payment_requests(status, reviewed_at);

-- ---------------------------------------------------------
-- Webhooks: resolução, reprocessamento e payload auditável
-- ---------------------------------------------------------
alter table public.agendapro_payment_webhook_events
  add column if not exists status text default 'pending',
  add column if not exists resolved_at timestamptz,
  add column if not exists resolved_by text,
  add column if not exists reprocess_count int default 0,
  add column if not exists metadata jsonb default '{}',
  add column if not exists updated_at timestamptz default now();

update public.agendapro_payment_webhook_events
set status = case when processed = true then 'processed' when processing_error is not null then 'error' else coalesce(status, 'pending') end;

create index if not exists idx_agp_webhooks_status on public.agendapro_payment_webhook_events(status, processed);

-- ---------------------------------------------------------
-- Briefings e implantações
-- ---------------------------------------------------------
alter table public.agendapro_quick_briefings
  add column if not exists priority text default 'normal',
  add column if not exists internal_note text,
  add column if not exists converted_at timestamptz,
  add column if not exists converted_to_implementation_id uuid,
  add column if not exists metadata jsonb default '{}';

create table if not exists public.agendapro_support_cases (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.agendapro_client_accounts(id) on delete set null,
  company_id uuid references public.agendapro_companies(id) on delete set null,
  agenda_id uuid references public.agendapro_created_agendas(id) on delete set null,
  title text not null,
  description text,
  status text default 'open',
  priority text default 'normal',
  responsible_email text,
  resolution text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.agendapro_support_notes (
  id uuid primary key default gen_random_uuid(),
  entity_type text,
  entity_id text,
  client_id uuid references public.agendapro_client_accounts(id) on delete set null,
  company_id uuid references public.agendapro_companies(id) on delete set null,
  agenda_id uuid references public.agendapro_created_agendas(id) on delete set null,
  author_email text,
  priority text default 'normal',
  status text default 'open',
  note text not null,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------------------------------------------------------
-- Auditoria e configurações administrativas
-- ---------------------------------------------------------
create table if not exists public.agendapro_dev_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_email text,
  action text not null,
  entity_type text,
  entity_id text,
  severity text default 'info',
  description text,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create table if not exists public.agendapro_admin_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb default '{}',
  description text,
  updated_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.agendapro_system_alerts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  severity text default 'info',
  entity_type text,
  entity_id text,
  status text default 'open',
  assigned_to text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.agendapro_internal_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text default 'open',
  priority text default 'normal',
  entity_type text,
  entity_id text,
  assigned_to text,
  due_at timestamptz,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_agp_dev_audit_entity on public.agendapro_dev_audit_logs(entity_type, entity_id);
create index if not exists idx_agp_dev_audit_created on public.agendapro_dev_audit_logs(created_at desc);
create index if not exists idx_agp_admin_settings_key on public.agendapro_admin_settings(key);
create index if not exists idx_agp_support_cases_status on public.agendapro_support_cases(status, priority);
create index if not exists idx_agp_support_notes_entity on public.agendapro_support_notes(entity_type, entity_id);
create index if not exists idx_agp_system_alerts_status on public.agendapro_system_alerts(status, severity);

alter table public.agendapro_dev_audit_logs enable row level security;
alter table public.agendapro_admin_settings enable row level security;
alter table public.agendapro_support_cases enable row level security;
alter table public.agendapro_support_notes enable row level security;
alter table public.agendapro_system_alerts enable row level security;
alter table public.agendapro_internal_tasks enable row level security;

-- Service role usado pelas APIs Vercel ignora RLS. Policies permissivas abaixo ajudam em ambientes dev/teste.
drop policy if exists "agp_dev_audit_service" on public.agendapro_dev_audit_logs;
create policy "agp_dev_audit_service" on public.agendapro_dev_audit_logs for all using (true) with check (true);

drop policy if exists "agp_admin_settings_service" on public.agendapro_admin_settings;
create policy "agp_admin_settings_service" on public.agendapro_admin_settings for all using (true) with check (true);

drop policy if exists "agp_support_cases_service" on public.agendapro_support_cases;
create policy "agp_support_cases_service" on public.agendapro_support_cases for all using (true) with check (true);

drop policy if exists "agp_support_notes_service" on public.agendapro_support_notes;
create policy "agp_support_notes_service" on public.agendapro_support_notes for all using (true) with check (true);

-- Configurações iniciais dos planos e links oficiais definidos para o AgendaPro.
insert into public.agendapro_admin_settings(key, value, description)
values
  ('plan:essential', jsonb_build_object('name','Essencial','price',49.9,'setup',100,'status','active','payment_link','https://mpago.la/2aynw39'), 'Plano Essencial - AgendaPro'),
  ('plan:professional', jsonb_build_object('name','Profissional','price',99.9,'setup',100,'status','active','payment_link','https://mpago.la/1D2cMK7'), 'Plano Profissional - AgendaPro'),
  ('plan:business', jsonb_build_object('name','Empresa','price',199.9,'setup',100,'status','active','payment_link','https://mpago.la/1ZJRTao'), 'Plano Empresa - AgendaPro'),
  ('implementation', jsonb_build_object('name','Implantação assistida','price',100,'status','active','payment_link','https://mpago.la/17N4Eme'), 'Implantação assistida')
on conflict (key) do update set value = excluded.value, description = excluded.description, updated_at = now();

notify pgrst, 'reload schema';

select 'AgendaPro v0.6.0.4 - Central Dev operacional pronta' as status;
