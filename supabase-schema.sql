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

-- Para tablas creadas antes de que existiera la columna description:
alter table public.patterns add column if not exists description text;
notify pgrst, 'reload schema';

alter table public.patterns enable row level security;
drop policy if exists "public can read visible patterns" on public.patterns;
create policy "public can read visible patterns" on public.patterns for select using (visible = true);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.collection_patterns (
  collection_id uuid not null references public.collections(id) on delete cascade,
  pattern_id text not null references public.patterns(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (collection_id, pattern_id)
);

alter table public.collections enable row level security;
alter table public.collection_patterns enable row level security;

update public.patterns
set price = 15000
where id in ('poncho-luz', 'guia-poncho-luz');

insert into storage.buckets (id, name, public)
values ('patterns', 'patterns', false)
on conflict (id) do nothing;

notify pgrst, 'reload schema';
