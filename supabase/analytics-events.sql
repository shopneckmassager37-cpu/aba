-- Chefaleh — behavior events + a richer analytics_summary()
-- Run once in the Supabase SQL Editor (Project: gubckjmffliwukroluxm).
-- Safe to re-run. Requires supabase/analytics.sql and supabase/orders.sql
-- to have already been run (this builds on both).
--
-- Adds a second, discrete-event stream next to page_views: someone added an
-- item to their cart, opened the cart, got a delivery zone detected from
-- their address, clicked a specific button, or placed an order. Each row is
-- one small fact — no personal data, same as page_views.

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  path text,
  type text not null,     -- add_to_cart | cart_open | select_zone | cta_click | order_submitted
  label text,             -- product name / zone label / button id, depending on type
  value numeric,          -- price / delivery fee / order total, when relevant
  created_at timestamptz not null default now()
);

create index if not exists events_created_at_idx on events (created_at desc);
create index if not exists events_type_idx on events (type);
create index if not exists events_session_idx on events (session_id);

-- Same lockdown as page_views and orders: RLS on, no policies, so only the
-- service-role key (used server-side by /api/track and the admin panel) can
-- read or write this table.
alter table events enable row level security;


-- Link an order back to the analytics session that placed it, so the admin
-- panel can show what fraction of visits actually turned into an order.
alter table orders add column if not exists session_id text;
create index if not exists orders_session_idx on orders (session_id);


-- ────────────────────────────────────────────────────────────
-- analytics_summary(): same function, extended with the new event data.
-- Existing keys (totals/pages/daily/referrers/campaigns/devices/countries/
-- funnel/journeys) are unchanged. New keys: scroll_histogram, hourly,
-- action_counts, top_products, zones, ctas, session_conversion.
-- ────────────────────────────────────────────────────────────
create or replace function analytics_summary(days int default 7)
returns json
language sql
stable
set search_path = public, pg_temp
as $$
with span as (
  select greatest(1, least(coalesce(days, 7), 365)) as d
),
v as (
  select * from page_views, span
  where viewed_at >= now() - make_interval(days => span.d)
),
ev as (
  select * from events, span
  where created_at >= now() - make_interval(days => span.d)
),
sess as (
  select session_id,
         count(*)::int as views,
         min(viewed_at) as started_at,
         coalesce(sum(duration_seconds), 0)::int as seconds
  from v group by session_id
),
entries as (
  select distinct on (session_id) session_id, path from v order by session_id, viewed_at asc
),
exits as (
  select distinct on (session_id) session_id, path from v order by session_id, viewed_at desc
)
select json_build_object(
  'days', (select d from span),
  'generated_at', now(),

  'totals', json_build_object(
    'views',            (select count(*)::int from v),
    'sessions',         (select count(*)::int from sess),
    'bounced_sessions', (select count(*)::int from sess where views = 1),
    'avg_session_seconds', (select coalesce(round(avg(seconds))::int, 0) from sess),
    'avg_view_seconds',    (select coalesce(round(avg(duration_seconds))::int, 0) from v where duration_seconds is not null)
  ),

  -- Per page: traffic, attention, and how often the visit ended there.
  'pages', (
    select coalesce(json_agg(p order by p.views desc), '[]'::json) from (
      select v.path,
             coalesce(max(v.title), v.path) as title,
             count(*)::int as views,
             count(distinct v.session_id)::int as visitors,
             coalesce(round(avg(v.duration_seconds) filter (where v.duration_seconds is not null))::int, 0) as avg_seconds,
             coalesce(round(avg(v.max_scroll) filter (where v.max_scroll is not null))::int, 0) as avg_scroll,
             (select count(*)::int from entries e where e.path = v.path) as entries,
             (select count(*)::int from exits x where x.path = v.path) as exits
      from v group by v.path
    ) p
  ),

  -- Views and visitors per calendar day (Miami time).
  'daily', (
    select coalesce(json_agg(d order by d.day), '[]'::json) from (
      select (viewed_at at time zone 'America/New_York')::date as day,
             count(*)::int as views,
             count(distinct session_id)::int as visitors
      from v group by 1
    ) d
  ),

  -- Where visitors came from.
  'referrers', (
    select coalesce(json_agg(r order by r.visitors desc), '[]'::json) from (
      select coalesce(referrer_host, 'Direct / typed in') as source,
             count(distinct session_id)::int as visitors
      from v group by 1
    ) r
  ),

  'campaigns', (
    select coalesce(json_agg(c order by c.visitors desc), '[]'::json) from (
      select utm_source as source,
             coalesce(utm_campaign, '—') as campaign,
             count(distinct session_id)::int as visitors
      from v where utm_source is not null group by 1, 2
    ) c
  ),

  'devices', (
    select coalesce(json_agg(dv order by dv.visitors desc), '[]'::json) from (
      select coalesce(device, 'unknown') as device,
             count(distinct session_id)::int as visitors
      from v group by 1
    ) dv
  ),

  'countries', (
    select coalesce(json_agg(co order by co.visitors desc), '[]'::json) from (
      select coalesce(country, '??') as country,
             count(distinct session_id)::int as visitors
      from v group by 1
    ) co
  ),

  -- How far down the ordering path visitors get (page-view based).
  'funnel', (
    select json_build_object(
      'home',         count(distinct session_id) filter (where path = '/'),
      'menu',         count(distinct session_id) filter (where path = '/menu'),
      'checkout',     count(distinct session_id) filter (where path = '/checkout'),
      'confirmation', count(distinct session_id) filter (where path = '/confirmation')
    ) from v
  ),

  -- The last 25 visits, each as the route it walked through the site.
  'journeys', (
    select coalesce(json_agg(j order by j.started_at desc), '[]'::json) from (
      select s.session_id,
             s.started_at,
             s.views as steps,
             s.seconds,
             max(v.device) as device,
             max(v.country) as country,
             (select string_agg(p.path, ' → ' order by p.viewed_at) from v p where p.session_id = s.session_id) as route
      from sess s join v on v.session_id = s.session_id
      group by s.session_id, s.started_at, s.views, s.seconds
      order by s.started_at desc
      limit 25
    ) j
  ),

  -- Exactly how far down each page people scroll, bucketed.
  'scroll_histogram', (
    select coalesce(json_agg(json_build_object('bucket', bucket, 'views', views) order by ord), '[]'::json)
    from (
      select
        case when max_scroll < 25 then '0–24%' when max_scroll < 50 then '25–49%'
             when max_scroll < 75 then '50–74%' else '75–100%' end as bucket,
        case when max_scroll < 25 then 1 when max_scroll < 50 then 2
             when max_scroll < 75 then 3 else 4 end as ord,
        count(*)::int as views
      from v where max_scroll is not null
      group by 1, 2
    ) s
  ),

  -- Traffic by hour of day (Miami time), summed across the whole period —
  -- when people are actually on the site.
  'hourly', (
    select coalesce(json_agg(h order by h.hour), '[]'::json) from (
      select extract(hour from viewed_at at time zone 'America/New_York')::int as hour,
             count(*)::int as views,
             count(distinct session_id)::int as visitors
      from v group by 1
    ) h
  ),

  -- Cart and order actions, not just page loads.
  'action_counts', (
    select json_build_object(
      'add_to_cart',     json_build_object('count', count(*) filter (where type = 'add_to_cart'),     'sessions', count(distinct session_id) filter (where type = 'add_to_cart')),
      'cart_open',       json_build_object('count', count(*) filter (where type = 'cart_open'),       'sessions', count(distinct session_id) filter (where type = 'cart_open')),
      'select_zone',     json_build_object('count', count(*) filter (where type = 'select_zone'),     'sessions', count(distinct session_id) filter (where type = 'select_zone')),
      'order_submitted', json_build_object('count', count(*) filter (where type = 'order_submitted'), 'sessions', count(distinct session_id) filter (where type = 'order_submitted'))
    ) from ev
  ),

  -- Which dishes get added to the cart most.
  'top_products', (
    select coalesce(json_agg(p order by p.count desc), '[]'::json) from (
      select label, count(*)::int as count, count(distinct session_id)::int as sessions
      from ev where type = 'add_to_cart' and label is not null
      group by label order by count(*) desc limit 8
    ) p
  ),

  -- Which delivery zone gets detected for people typing their address.
  'zones', (
    select coalesce(json_agg(z order by z.count desc), '[]'::json) from (
      select label, count(*)::int as count, count(distinct session_id)::int as sessions
      from ev where type = 'select_zone' and label is not null
      group by label order by count(*) desc
    ) z
  ),

  -- Which buttons/links people actually click.
  'ctas', (
    select coalesce(json_agg(c order by c.count desc), '[]'::json) from (
      select label, count(*)::int as count, count(distinct session_id)::int as sessions
      from ev where type = 'cta_click' and label is not null
      group by label order by count(*) desc limit 10
    ) c
  ),

  -- Visitors vs. visitors who actually placed an order in this window.
  'session_conversion', (
    select json_build_object(
      'sessions', (select count(*) from sess),
      'ordering_sessions', (
        select count(distinct o.session_id) from orders o
        where o.created_at >= now() - make_interval(days => (select d from span)) and o.session_id is not null
      ),
      'orders_total', (
        select count(*) from orders o
        where o.created_at >= now() - make_interval(days => (select d from span))
      )
    )
  )
);
$$;

-- Only the server (service-role key) may call this — never the public anon key.
revoke all on function analytics_summary(int) from public, anon, authenticated;

notify pgrst, 'reload schema';
