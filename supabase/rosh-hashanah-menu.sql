-- Chefaleh — add Rosh Hashanah menu items
-- Run once in the Supabase SQL Editor (Project: gubckjmffliwukroluxm).
--
-- All 13 items below are inserted as HIDDEN (visible = false) so nothing
-- appears on the live site until you've reviewed sizes/badges, images and
-- (for most items) real prices — only "Whole Roasted Chicken" ($75) had a
-- price in the source menu. Everything else is inserted with price = 0 as
-- a placeholder. Flip each item to visible once it's ready, either here
-- (visible = true) or from the Admin panel.
--
-- Every item is tagged 'Rosh Hashanah' so it shows a small ribbon on the
-- card once visible — edit/remove the tag per item in the Admin panel if
-- you don't want that.

-- ────────────────────────────────────────────────────────────
-- Challah & Bread
-- ────────────────────────────────────────────────────────────
insert into products (name, price, tag, category_id, description, dark, small, visible, gluten_free_option, "order")
select 'Chaya''s Maple Crumble Round Challah', 0, 'Rosh Hashanah', id,
  'Soft, golden round challah topped with Chaya''s signature sweet maple crumble.',
  false, false, false, false,
  coalesce((select max("order") from products where category_id = categories.id), 0) + 1
from categories where slug = 'challah';

-- ────────────────────────────────────────────────────────────
-- Salads & Dips
-- ────────────────────────────────────────────────────────────
insert into products (name, price, tag, category_id, description, dark, small, visible, gluten_free_option, "order")
select 'Chefaleh Simanim Platter', 0, 'Rosh Hashanah', id,
  'A beautifully arranged selection of traditional Rosh Hashanah simanim including apples & honey, dates, pomegranate, leeks, beets, carrots and squash.',
  false, false, false, false,
  coalesce((select max("order") from products where category_id = categories.id), 0) + 1
from categories where slug = 'salads';

insert into products (name, price, tag, category_id, description, dark, small, visible, gluten_free_option, "order")
select 'Roasted Beet & Citrus Salad', 0, 'Rosh Hashanah', id,
  'Roasted beets, fresh citrus, pomegranate, toasted pistachios and fresh herbs.',
  false, false, false, false,
  coalesce((select max("order") from products where category_id = categories.id), 0) + 1
from categories where slug = 'salads';

-- ────────────────────────────────────────────────────────────
-- Fish
-- ────────────────────────────────────────────────────────────
insert into products (name, price, tag, category_id, description, dark, small, visible, gluten_free_option, "order")
select 'Pomegranate Glazed Salmon', 0, 'Rosh Hashanah', id,
  'Roasted salmon with a sweet and tangy pomegranate glaze, citrus and fresh herbs.',
  false, false, false, false,
  coalesce((select max("order") from products where category_id = categories.id), 0) + 1
from categories where slug = 'fish';

-- ────────────────────────────────────────────────────────────
-- Signature Meat
-- ────────────────────────────────────────────────────────────
insert into products (name, price, tag, category_id, description, dark, small, visible, gluten_free_option, "order")
select 'Whole Roasted Chicken', 75, 'Rosh Hashanah', id,
  'Whole roasted chicken, golden and juicy. Choose your style: Honey Pomegranate (pomegranate, honey, garlic and warm spices), Lemon Herb & Roasted Garlic (fresh lemon, rosemary, thyme and roasted garlic), or Citrus Chili (fresh orange and lime, garlic, mild chili and herbs).',
  true, false, false, false,
  coalesce((select max("order") from products where category_id = categories.id), 0) + 1
from categories where slug = 'meat';

insert into products (name, price, tag, category_id, description, dark, small, visible, gluten_free_option, "order")
select 'Pomegranate Braised Short Ribs', 0, 'Rosh Hashanah', id,
  'Slow-braised beef finished with a rich pomegranate and red wine glaze, roasted shallots and fresh herbs.',
  true, false, false, false,
  coalesce((select max("order") from products where category_id = categories.id), 0) + 1
from categories where slug = 'meat';

insert into products (name, price, tag, category_id, description, dark, small, visible, gluten_free_option, "order")
select 'Honey & Date Glazed Chicken', 0, 'Rosh Hashanah', id,
  'Roasted chicken glazed with honey and dates, with shallots, thyme and warm spices.',
  true, false, false, false,
  coalesce((select max("order") from products where category_id = categories.id), 0) + 1
from categories where slug = 'meat';

-- ────────────────────────────────────────────────────────────
-- Sides
-- ────────────────────────────────────────────────────────────
insert into products (name, price, tag, category_id, description, dark, small, visible, gluten_free_option, "order")
select 'Honey Roasted Carrots', 0, 'Rosh Hashanah', id,
  'Roasted carrots glazed with honey and silan, finished with sesame and fresh herbs.',
  false, false, false, false,
  coalesce((select max("order") from products where category_id = categories.id), 0) + 1
from categories where slug = 'sides';

insert into products (name, price, tag, category_id, description, dark, small, visible, gluten_free_option, "order")
select 'Classic Potato Kugel', 0, 'Rosh Hashanah', id,
  'Crispy on top, soft and savory inside — our classic traditional potato kugel.',
  false, false, false, false,
  coalesce((select max("order") from products where category_id = categories.id), 0) + 1
from categories where slug = 'sides';

insert into products (name, price, tag, category_id, description, dark, small, visible, gluten_free_option, "order")
select 'Wild Rice with Leeks & Pomegranate', 0, 'Rosh Hashanah', id,
  'Wild rice with caramelized leeks, fresh herbs, toasted nuts and pomegranate.',
  false, false, false, false,
  coalesce((select max("order") from products where category_id = categories.id), 0) + 1
from categories where slug = 'sides';

insert into products (name, price, tag, category_id, description, dark, small, visible, gluten_free_option, "order")
select 'Roasted Squash with Silan', 0, 'Rosh Hashanah', id,
  'Roasted seasonal squash with silan, thyme and toasted seeds.',
  false, false, false, false,
  coalesce((select max("order") from products where category_id = categories.id), 0) + 1
from categories where slug = 'sides';

-- ────────────────────────────────────────────────────────────
-- Desserts (English Cake Pan)
-- ────────────────────────────────────────────────────────────
insert into products (name, price, tag, category_id, description, dark, small, visible, gluten_free_option, "order")
select 'Classic Honey Cake', 0, 'Rosh Hashanah', id,
  'Moist, deeply flavored honey cake with warm spices.',
  false, false, false, false,
  coalesce((select max("order") from products where category_id = categories.id), 0) + 1
from categories where slug = 'desserts';

insert into products (name, price, tag, category_id, description, dark, small, visible, gluten_free_option, "order")
select 'Apple Crumble', 0, 'Rosh Hashanah', id,
  'Baked apples with cinnamon and a crisp buttery-style crumble topping.',
  false, false, false, false,
  coalesce((select max("order") from products where category_id = categories.id), 0) + 1
from categories where slug = 'desserts';
