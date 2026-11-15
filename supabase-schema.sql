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

create table if not exists public.pattern_sections (
  pattern_id text not null references public.patterns(id) on delete cascade,
  section text not null check (section in ('inicio', 'guias', 'gratis')),
  created_at timestamptz not null default now(),
  primary key (pattern_id, section)
);

insert into public.pattern_sections (pattern_id, section)
select id, section from public.patterns
on conflict (pattern_id, section) do nothing;

create or replace function public.add_pattern_default_section()
returns trigger
language plpgsql
as $$
begin
  insert into public.pattern_sections (pattern_id, section)
  values (new.id, new.section)
  on conflict (pattern_id, section) do nothing;
  return new;
end;
$$;

drop trigger if exists patterns_add_default_section on public.patterns;
create trigger patterns_add_default_section
after insert or update of section on public.patterns
for each row execute function public.add_pattern_default_section();

-- Para tablas creadas antes de que existiera la columna description:
alter table public.patterns add column if not exists description text;
notify pgrst, 'reload schema';

alter table public.patterns enable row level security;
alter table public.pattern_sections enable row level security;
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
