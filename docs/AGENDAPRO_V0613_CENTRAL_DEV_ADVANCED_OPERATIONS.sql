-- AgendaPro v0.6.1.3 — Central Dev Advanced Operations
-- SQL incremental seguro para fortalecer auditoria, suporte e filtros operacionais.

create extension if not exists "pgcrypto";

alter table if exists public.agendapro_dev_audit_logs
  add column if not exists actor_role text,
  add column if not exists before_data jsonb default '{}'::jsonb,
  add column if not exists after_data jsonb default '{}'::jsonb,
  add column if not exists metadata jsonb default '{}'::jsonb;

alter table if exists public.agendapro_client_activity_logs
  add column if not exists severity text default 'info',
  add column if not exists entity_type text,
  add column if not exists entity_id text,
  add column if not exists metadata jsonb default '{}'::jsonb;

alter table if exists public.agendapro_support_notes
  add column if not exists entity_type text,
  add column if not exists entity_id text,
  add column if not exists priority text default 'normal',
  add column if not exists status text default 'open',
  add column if not exists metadata jsonb default '{}'::jsonb;

alter table if exists public.agendapro_support_cases
  add column if not exists priority text default 'normal',
  add column if not exists responsible_email text,
  add column if not exists resolution text,
  add column if not exists metadata jsonb default '{}'::jsonb;

create index if not exists idx_agp_dev_audit_entity on public.agendapro_dev_audit_logs(entity_type, entity_id);
create index if not exists idx_agp_dev_audit_actor on public.agendapro_dev_audit_logs(actor_email);
create index if not exists idx_agp_dev_audit_severity_date on public.agendapro_dev_audit_logs(severity, created_at desc);

create index if not exists idx_agp_client_activity_entity on public.agendapro_client_activity_logs(entity_type, entity_id);
create index if not exists idx_agp_client_activity_company_date on public.agendapro_client_activity_logs(company_id, created_at desc);
create index if not exists idx_agp_support_notes_entity on public.agendapro_support_notes(entity_type, entity_id);
create index if not exists idx_agp_support_cases_status_priority on public.agendapro_support_cases(status, priority, updated_at desc);

notify pgrst, 'reload schema';

select 'AgendaPro v0.6.1.3 Central Dev Advanced Operations aplicado com segurança.' as status;
