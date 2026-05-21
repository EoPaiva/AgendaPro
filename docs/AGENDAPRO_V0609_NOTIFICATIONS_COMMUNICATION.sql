-- =========================================================
-- AgendaPro v0.6.0.9 — Notifications & Communication
-- Comunicação básica de agendamentos com histórico e auditoria.
-- Rode depois do SQL v0.6.0.8.
-- =========================================================

create extension if not exists "pgcrypto";

alter table public.agendapro_public_booking_requests
  add column if not exists professional_name text,
  add column if not exists communication_metadata jsonb default '{}'::jsonb;

-- Garante que metadata/action_metadata existam mesmo em bases antigas.
alter table public.agendapro_public_booking_requests
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists action_metadata jsonb default '{}'::jsonb,
  add column if not exists updated_at timestamptz default now();

create index if not exists idx_agp_booking_requests_professional_v0609
  on public.agendapro_public_booking_requests(professional_name);

create index if not exists idx_agp_booking_requests_customer_email_v0609
  on public.agendapro_public_booking_requests(customer_email);

-- Normaliza histórico de comunicação para registros antigos sem sobrescrever histórico existente.
update public.agendapro_public_booking_requests
set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
  'communicationHistory', coalesce(metadata->'communicationHistory', '[]'::jsonb)
)
where metadata is null or metadata->'communicationHistory' is null;

notify pgrst, 'reload schema';

select 'AgendaPro v0.6.0.9 - comunicação de agendamentos pronta.' as status;
