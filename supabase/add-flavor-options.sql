-- Chefaleh — add real flavor/style selection to products
-- Run once in the Supabase SQL Editor (Project: gubckjmffliwukroluxm) if not
-- already applied. Already applied live on 2026-08-07.
--
-- "Whole Roasted Chicken" listed 3 flavor styles only as text in its
-- description, with the customer expected to type their choice into the
-- free-text notes field at checkout. That's not a real selection — this
-- adds a proper flavor_options column so the storefront can render an
-- actual required click-to-choose control (see menu.html's
-- "Choose Your Flavor" section in the item modal), and sets it for
-- Whole Roasted Chicken. Admins can set flavor_options on any other
-- product from the Admin panel (comma-separated "Flavor / style options"
-- field) — when set, the customer must pick one before the item can be
-- added to the cart.

alter table products add column if not exists flavor_options text[] not null default '{}';

update products
set flavor_options = array['Honey Pomegranate','Lemon Herb & Roasted Garlic','Citrus Chili'],
    description = 'Whole roasted chicken, golden and juicy — choose your flavor below.'
where name = 'Whole Roasted Chicken';
