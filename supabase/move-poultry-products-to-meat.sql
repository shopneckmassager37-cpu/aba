-- Chefaleh — move Poultry products into Signature Meat
-- Run once in the Supabase SQL Editor (Project: gubckjmffliwukroluxm) if not
-- already applied. Already applied live on 2026-08-07.
--
-- The "Poultry" section was removed from menu.html (no more #poultry
-- section / g-poultry grid), but the "poultry" category and its products
-- (Israeli Pargit, Israeli Shnitzel, GF Shnitzel) still existed in the DB —
-- leaving them orphaned and invisible on the live site even though
-- visible = true. This reassigns them to the "meat" (Signature Meat)
-- category instead of deleting them, appended after the existing meat
-- items, preserving each product's own visible flag and price.
--
-- Safe to re-run: a no-op once no products remain under "poultry".

update products
set category_id = (select id from categories where slug = 'meat'),
    "order" = "order" + (select coalesce(max("order"), 0) from products where category_id = (select id from categories where slug = 'meat'))
where category_id = (select id from categories where slug = 'poultry');
