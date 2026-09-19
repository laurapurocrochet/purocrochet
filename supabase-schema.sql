-- Ejecutar una vez en Supabase: SQL Editor > New query.
create table if not exists public.patterns (
  id text primary key,
  title text not null,
  price integer not null default 0 check (price >= 0),
  section text not null check (section in ('inicio', 'guias', 'gratis')),
  description text,
  file text,
  image_portada text,
  image_detalle text,
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.patterns enable row level security;
drop policy if exists "public can read visible patterns" on public.patterns;
create policy "public can read visible patterns" on public.patterns for select using (visible = true);

insert into storage.buckets (id, name, public)
values ('patterns', 'patterns', false)
on conflict (id) do nothing;
