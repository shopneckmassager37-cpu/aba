-- Chefaleh — add missing allergens_optional column
-- Run once in the Supabase SQL Editor (Project: gubckjmffliwukroluxm) if not
-- already applied. Already applied live on 2026-08-07.
--
-- The original allergen migration (see migration.sql) declared this column,
-- but it was never actually created on the live products table. Every save
-- in the Admin panel sends an allergens_optional field (admin.html
-- saveProduct()), so every single product edit/create was failing with:
--   ERROR: 42703: column "allergens_optional" of relation "products" does
--   not exist
-- This statement is idempotent and safe to re-run.

alter table products add column if not exists allergens_optional text[] not null default '{}';
