-- Chefaleh — allergen system + admin write lockdown
-- Run this once in the Supabase SQL Editor (Project: gubckjmffliwukroluxm).
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE / DROP-then-CREATE where relevant.

-- ────────────────────────────────────────────────────────────
-- 1. Allergens: admin-managed master list
-- ────────────────────────────────────────────────────────────
create table if not exists allergens (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table allergens enable row level security;

drop policy if exists "Public read allergens" on allergens;
create policy "Public read allergens" on allergens
  for select using (true);

-- 2. Attach allergen tags to products (array of allergen names, e.g. '{"Gluten","Dairy"}')
alter table products add column if not exists allergens text[] not null default '{}';

-- 2b. Of a product's allergens, which ones can a customer optionally ask to have left out
--     (e.g. a dish tagged Dairy + Nuts might only be able to accommodate a dairy-free request).
--     This never forces anything — the shopper still has to check a box on the menu to request it.
alter table products add column if not exists allergens_optional text[] not null default '{}';


-- ────────────────────────────────────────────────────────────
-- 3. Lock down direct writes from the browser
--
-- The admin panel used to write to `products` / `categories` directly from
-- the browser using the public "anon" key — anyone who opened dev tools
-- could edit or delete your live menu without ever entering the admin
-- password. Writes now go through a server endpoint that checks a signed
-- session token and uses the secret "service role" key instead.
--
-- Enabling RLS below with only a SELECT policy means: the public (anon key)
-- can only ever read products/categories — insert/update/delete are denied
-- by default. The service role key used by the new server endpoints
-- bypasses RLS entirely, so the admin panel keeps working as before.
--
-- IMPORTANT: before/after running this, open Authentication → Policies in
-- the Supabase dashboard for `products` and `categories` and delete any
-- existing INSERT/UPDATE/DELETE policy that allows the `anon` role — this
-- script only adds the SELECT policy, it won't remove a pre-existing
-- permissive one if you had added it manually.
-- ────────────────────────────────────────────────────────────

alter table products enable row level security;
alter table categories enable row level security;

drop policy if exists "Public read products" on products;
create policy "Public read products" on products
  for select using (true);

drop policy if exists "Public read categories" on categories;
create policy "Public read categories" on categories
  for select using (true);


-- ────────────────────────────────────────────────────────────
-- 4. Lock down the "menu-images" storage bucket the same way
--    (public can still view images; only the server can upload/replace)
-- ────────────────────────────────────────────────────────────

drop policy if exists "Public read menu-images" on storage.objects;
create policy "Public read menu-images" on storage.objects
  for select using (bucket_id = 'menu-images');

-- Same note as above: check Storage → Policies for "menu-images" and
-- remove any existing INSERT/UPDATE/DELETE policy that allows `anon`.
