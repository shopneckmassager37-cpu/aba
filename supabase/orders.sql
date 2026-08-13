-- Chefaleh — order history
-- Run once in the Supabase SQL Editor (Project: gubckjmffliwukroluxm).
-- Safe to re-run.
--
-- Until now an order existed only inside the two emails /api/send-email sent
-- out. This table keeps a copy so the admin panel can list orders, track their
-- status and total them up.

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,          -- the CHF-… id shown in the emails
  status text not null default 'new',       -- new | paid | confirmed | delivered | cancelled
  name text not null,
  email text not null,
  phone text,
  address text,
  zone text,
  delivery_date text,
  notes text,                               -- what the customer wrote at checkout
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(10,2) not null default 0,
  tax numeric(10,2) not null default 0,
  delivery numeric(10,2) not null default 0,
  chef_tip numeric(10,2) not null default 0,
  driver_tip numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  admin_note text,                          -- private note, only visible in the panel
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on orders (created_at desc);
create index if not exists orders_status_idx on orders (status);
create index if not exists orders_code_idx on orders (order_code);

-- Orders hold customer names, addresses and phone numbers. RLS is enabled with
-- no policies at all, so the public anon key can neither read nor write them —
-- only the server endpoints, which use the secret service-role key and require
-- the admin password.
alter table orders enable row level security;

notify pgrst, 'reload schema';
