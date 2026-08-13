import { sbAdminFetch } from '../lib/supabaseAdmin.js';

// Public endpoint used by analytics.js. It writes with the service-role key so
// the page_views table stays completely closed to the browser (RLS on, no
// policies) — visitors can record a view, but nobody can read the data back
// except the admin panel.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BOT_RE = /bot|crawl|spider|slurp|preview|monitor|lighthouse|headless|curl|wget|python-requests|facebookexternalhit|whatsapp|telegram|bingpreview|ahrefs|semrush|gtmetrix|pingdom|uptime/i;

function str(value, max) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, '').slice(0, 120); } catch { return null; }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ua = req.headers['user-agent'] || '';
  if (!ua || BOT_RE.test(ua)) return res.status(204).end();   // silently ignore crawlers

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const id = str(body.id, 40);
    if (!id || !UUID_RE.test(id)) return res.status(400).json({ error: 'Bad id' });

    if (body.type === 'end') {
      const seconds = Number(body.duration_seconds);
      const scroll = Number(body.max_scroll);
      await sbAdminFetch(`page_views?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          duration_seconds: Number.isFinite(seconds) ? Math.min(3600, Math.max(0, Math.round(seconds))) : null,
          max_scroll: Number.isFinite(scroll) ? Math.min(100, Math.max(0, Math.round(scroll))) : null,
        }),
      });
      return res.status(204).end();
    }

    const sessionId = str(body.session_id, 40);
    const path = str(body.path, 200);
    if (!sessionId || !UUID_RE.test(sessionId)) return res.status(400).json({ error: 'Bad session' });
    if (!path || !path.startsWith('/')) return res.status(400).json({ error: 'Bad path' });

    const referrer = str(body.referrer, 300);
    const device = ['mobile', 'tablet', 'desktop'].includes(body.device) ? body.device : 'unknown';

    await sbAdminFetch('page_views', {
      method: 'POST',
      body: JSON.stringify({
        id,
        session_id: sessionId,
        path,
        title: str(body.title, 120),
        referrer,
        referrer_host: referrer ? hostOf(referrer) : null,
        utm_source: str(body.utm_source, 60),
        utm_medium: str(body.utm_medium, 60),
        utm_campaign: str(body.utm_campaign, 60),
        device,
        country: str(req.headers['x-vercel-ip-country'], 2),
      }),
    });

    return res.status(204).end();
  } catch (e) {
    // Never surface tracking problems to a visitor's browser.
    console.error('track error:', e.message);
    return res.status(204).end();
  }
}
