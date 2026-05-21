-- =========================================================
-- AgendaPro v0.6.0.8 — Booking Management
-- Gestão real de agendamentos recebidos no painel da empresa.
-- Rode depois dos SQLs v0.5.6, v0.6.0.4 e v0.6.0.7.
-- =========================================================

create extension if not exists "pgcrypto";

alter table public.agendapro_public_booking_requests
  add column if not exists status text default 'pending',
  add column if not exists internal_note text,
  add column if not exists cancellation_reason text,
  add column if not exists reschedule_reason text,
  add column if not exists previous_requested_date text,
  add column if not exists previous_requested_time text,
  add column if not exists confirmed_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists rescheduled_at timestamptz,
  add column if not exists updated_at timestamptz default now(),
  add column if not exists action_metadata jsonb default '{}'::jsonb;

-- Normaliza status legado sem quebrar histórico.
update public.agendapro_public_booking_requests
set status = 'pending'
where status is null or status in ('requested', 'solicitado', 'pending_review');

create index if not exists idx_agp_booking_requests_agenda_slug_v0608
  on public.agendapro_public_booking_requests(agenda_slug);

create index if not exists idx_agp_booking_requests_status_v0608
  on public.agendapro_public_booking_requests(status);

create index if not exists idx_agp_booking_requests_date_v0608
  on public.agendapro_public_booking_requests(requested_date);

create index if not exists idx_agp_booking_requests_created_v0608
  on public.agendapro_public_booking_requests(created_at desc);

create index if not exists idx_agp_booking_requests_slug_status_date_v0608
  on public.agendapro_public_booking_requests(agenda_slug, status, requested_date, requested_time);

create or replace function public.agendapro_touch_booking_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_agendapro_booking_updated_at on public.agendapro_public_booking_requests;
create trigger trg_agendapro_booking_updated_at
before update on public.agendapro_public_booking_requests
for each row execute function public.agendapro_touch_booking_updated_at();

notify pgrst, 'reload schema';

select 'AgendaPro v0.6.0.8 - gestão real de agendamentos pronta.' as status;
