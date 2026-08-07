-- Chefaleh — backfill missing product descriptions
-- Run once in the Supabase SQL Editor (Project: gubckjmffliwukroluxm) if not
-- already applied. Already applied live on 2026-08-07.
--
-- 27 existing products had no description (NULL), which meant a blank line
-- on their menu card. Adds a short, ingredient-forward description to each,
-- matching the site's existing tone. Only touches rows that are still
-- blank, so it's safe to re-run without overwriting anything written since.

update products set description = case id
  when '261fbe6f-bacb-4fe6-b2f7-6af0e2f46ff0' then 'Soft, individually hand-shaped challah rolls, baked golden — perfect for a full table.'
  when 'bb20e7d2-2494-493d-9c62-4c694deaf86b' then 'Traditional Yemenite pull-apart kubaneh, brushed with za''atar and olive oil.'
  when '282d1949-2233-4cd7-9452-cd0c97fb14c8' then 'Chaya''s classic soft, golden braided challah, baked fresh every week.'
  when 'ae1f6478-07b5-4ccd-bdbe-955312e6bab4' then 'Silky house-made hummus, tahini-rich and finished with extra virgin olive oil.'
  when '559d3c4b-2b84-4fe3-8a74-57fa8ac9857f' then 'Sweet corn tossed with peppers, fresh herbs and a bright citrus dressing.'
  when '00e42ed4-d060-410f-9812-909b0c12df81' then 'Tender carrots in a warm Moroccan spice blend with garlic and fresh herbs.'
  when '600d78f9-6b7f-4a4c-8ae7-371358aa1171' then 'Slow-cooked tomato and roasted pepper dip with garlic and warm spices.'
  when '80f4dd7f-f2af-439d-8279-1d03e5c493da' then 'Roasted eggplant in a tangy garlic vinaigrette with fresh herbs.'
  when '2db37e60-ccea-444c-a268-a249316323a5' then 'Classic egg salad, creamy and fresh, finished with green onion.'
  when 'a11e0014-d7c5-4229-ae08-3215a3182a6a' then 'Smoky roasted eggplant blended with tahini, garlic and lemon.'
  when '570465c1-5c34-4d07-a7ea-0028cc84f468' then 'Slow-simmered chicken soup with vegetables and fresh herbs — classic comfort for the table.'
  when '008321c4-a28f-4f14-a884-ba9901b3f047' then 'Rich, slow-built broth with noodles, vegetables and fresh herbs.'
  when '321668e7-ecf3-4e1d-bcfc-6cf9c8cb8dcf' then 'Roasted salmon in a warm Moroccan tomato and spice sauce with fresh herbs.'
  when 'c496eb44-fb18-4df0-adb3-26bcda648ac0' then 'Roasted salmon glazed with miso, ginger and scallion.'
  when '9db9c58f-63d3-43b6-8ada-a7992540bcfc' then 'Tilapia fillets simmered in a warm Moroccan tomato and spice sauce.'
  when '761c12ae-18d2-4b06-89e9-a7f308e9c6b4' then 'Slow-braised for twelve hours until fork-tender, finished with a rich pan glaze.'
  when '83dc80b4-1e59-4b0f-922c-48712212c576' then 'Reverse-seared prime rib, rested and carved for an evenly juicy, tender center.'
  when '382de50e-a60a-4404-a621-c085176ebcc0' then 'Our signature brisket, slow-braised low and long until it falls apart.'
  when '3e2dffe3-15b8-470e-a19b-11263f4ceef6' then 'Boneless chicken thigh, marinated and roasted Israeli-style with warm spices.'
  when '706ffe02-5ae4-4574-a9bf-2bf7a9f30ee3' then 'Crispy breaded chicken schnitzel, Israeli-style, golden and crunchy.'
  when '00b8372a-dc05-4551-9a33-0e94f6b1daa9' then 'Our classic schnitzel, breaded gluten-free, crispy and golden.'
  when 'c2236ec9-db71-4850-8037-9ff226ff53cc' then 'Fingerling potatoes roasted until golden and crisp, finished with fresh herbs.'
  when '35537c69-3a8d-4268-9185-ad94fb2f98f5' then 'Fragrant basmati rice with a golden tahdig crust, Persian-style.'
  when 'f4ce2e14-4b9c-4c8c-9234-cf25acf46e3e' then 'Rainbow carrots roasted and glazed until tender and sweet.'
  when '35938da7-082a-4ff8-b189-1fc3952216fd' then 'Mushrooms marinated in garlic, fresh herbs and extra virgin olive oil.'
  when '09725aa7-b78d-4f0e-9c8f-aad80912a6a7' then 'Soft, house-baked cinnamon rolls finished with a sweet glaze.'
  when '46cc9221-d516-4289-8089-db36816c9c99' then 'Rich, swirled chocolate babka, baked fresh every week.'
  else description
end
where id in (
  '261fbe6f-bacb-4fe6-b2f7-6af0e2f46ff0','bb20e7d2-2494-493d-9c62-4c694deaf86b','282d1949-2233-4cd7-9452-cd0c97fb14c8',
  'ae1f6478-07b5-4ccd-bdbe-955312e6bab4','559d3c4b-2b84-4fe3-8a74-57fa8ac9857f','00e42ed4-d060-410f-9812-909b0c12df81',
  '600d78f9-6b7f-4a4c-8ae7-371358aa1171','80f4dd7f-f2af-439d-8279-1d03e5c493da','2db37e60-ccea-444c-a268-a249316323a5',
  'a11e0014-d7c5-4229-ae08-3215a3182a6a','570465c1-5c34-4d07-a7ea-0028cc84f468','008321c4-a28f-4f14-a884-ba9901b3f047',
  '321668e7-ecf3-4e1d-bcfc-6cf9c8cb8dcf','c496eb44-fb18-4df0-adb3-26bcda648ac0','9db9c58f-63d3-43b6-8ada-a7992540bcfc',
  '761c12ae-18d2-4b06-89e9-a7f308e9c6b4','83dc80b4-1e59-4b0f-922c-48712212c576','382de50e-a60a-4404-a621-c085176ebcc0',
  '3e2dffe3-15b8-470e-a19b-11263f4ceef6','706ffe02-5ae4-4574-a9bf-2bf7a9f30ee3','00b8372a-dc05-4551-9a33-0e94f6b1daa9',
  'c2236ec9-db71-4850-8037-9ff226ff53cc','35537c69-3a8d-4268-9185-ad94fb2f98f5','f4ce2e14-4b9c-4c8c-9234-cf25acf46e3e',
  '35938da7-082a-4ff8-b189-1fc3952216fd','09725aa7-b78d-4f0e-9c8f-aad80912a6a7','46cc9221-d516-4289-8089-db36816c9c99'
)
and (description is null or trim(description) = '');
