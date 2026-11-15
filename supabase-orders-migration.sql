create table if not exists public.orders (
  reference text primary key,
  product_id text not null,
  items jsonb not null default '[]'::jsonb,
  quantity integer not null check (quantity > 0),
  buyer_email text not null,
  status text not null default 'pending',
  email_sent boolean not null default false,
  email_sent_at timestamptz,
  payment_id text,
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;
notify pgrst, 'reload schema';
