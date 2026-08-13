-- Chefaleh — first-party visitor analytics
-- Run once in the Supabase SQL Editor (Project: gubckjmffliwukroluxm).
-- Safe to re-run.
--
-- What this stores: one row per page view — which page, a random per-tab
-- session id, how long the page was actually on screen, how far it was
-- scrolled, where the visitor came from, rough device type and the
-- two-letter country Vercel reports. No IP addresses, no cookies, no names.

create table if not exists page_views (
  id uuid primary key,
  session_id text not null,
  path text not null,
  title text,
  referrer text,
  referrer_host text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  device text,
  country text,
  duration_seconds int,
  max_scroll int,
  viewed_at timestamptz not null default now()
);

create index if not exists page_views_viewed_at_idx on page_views (viewed_at desc);
create index if not exists page_views_session_idx on page_views (session_id, viewed_at);
create index if not exists page_views_path_idx on page_views (path);

-- RLS on with no policies at all: the public anon key can neither read nor
-- write this table. Views are written by /api/track and read by the admin
-- panel, both of which use the secret service-role key on the server.
alter table page_views enable row level security;


-- ────────────────────────────────────────────────────────────
-- One call that returns every number the Analytics tab shows.
-- Aggregation happens in the database, so the admin panel downloads a few
-- kilobytes of totals instead of every raw row.
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

  -- How far down the ordering path visitors get.
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
  )
);
$$;

-- Only the server (service-role key) may call this — never the public anon key.
revoke all on function analytics_summary(int) from public, anon, authenticated;

notify pgrst, 'reload schema';


-- ────────────────────────────────────────────────────────────
-- Optional housekeeping: drop rows older than six months.
-- Run whenever you feel like it, or schedule it with pg_cron.
-- ────────────────────────────────────────────────────────────
-- delete from page_views where viewed_at < now() - interval '180 days';
