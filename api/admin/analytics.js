import { requireAdmin } from '../../lib/adminAuth.js';
import { sbAdminFetch } from '../../lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const days = Math.min(365, Math.max(1, parseInt(req.query.days, 10) || 7));
    const summary = await sbAdminFetch('rpc/analytics_summary', {
      method: 'POST',
      body: JSON.stringify({ days }),
    });
    return res.status(200).json(summary);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
