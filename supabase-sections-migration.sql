-- Ejecutar una vez en Supabase: SQL Editor > New query.
-- Permite que un mismo patrón aparezca en más de una sección.
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

alter table public.pattern_sections enable row level security;

notify pgrst, 'reload schema';
