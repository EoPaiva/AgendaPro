-- AgendaPro v0.5.0 — tabelas extras para briefing rápido e console do desenvolvedor

create extension if not exists "pgcrypto";

create table if not exists public.agendapro_quick_briefings (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  full_name text not null,
  email text not null,
  whatsapp text not null,
  segment text,
  plan_id text,
  wants_implementation boolean default false,
  message text,
  status text default 'novo',
  source text default 'site',
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.agendapro_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists agendapro_quick_briefings_updated_at on public.agendapro_quick_briefings;
create trigger agendapro_quick_briefings_updated_at
before update on public.agendapro_quick_briefings
for each row execute function public.agendapro_set_updated_at();

create index if not exists idx_agendapro_quick_briefings_status on public.agendapro_quick_briefings(status);
create index if not exists idx_agendapro_quick_briefings_created_at on public.agendapro_quick_briefings(created_at desc);

alter table public.agendapro_quick_briefings enable row level security;
drop policy if exists "agendapro_quick_briefings_dev_all" on public.agendapro_quick_briefings;
create policy "agendapro_quick_briefings_dev_all" on public.agendapro_quick_briefings for all using (true) with check (true);

select 'AgendaPro v0.5.0 extra SQL aplicado com sucesso.' as status;
