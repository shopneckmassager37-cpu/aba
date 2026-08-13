import { requireAdmin } from '../../lib/adminAuth.js';
import { sbAdminFetch } from '../../lib/supabaseAdmin.js';

const STATUSES = ['new', 'paid', 'confirmed', 'delivered', 'cancelled'];

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

  try {
    if (req.method === 'GET') {
      const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit, 10) || 300));
      const orders = await sbAdminFetch(`orders?select=*&order=created_at.desc&limit=${limit}`);
      return res.status(200).json(orders || []);
    }

    if (req.method === 'PATCH') {
      const { id, status, admin_note } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Missing id' });

      const patch = {};
      if (status !== undefined) {
        if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Unknown status' });
        patch.status = status;
        if (status === 'confirmed') patch.confirmed_at = new Date().toISOString();
      }
      if (admin_note !== undefined) patch.admin_note = String(admin_note || '').slice(0, 1000) || null;
      if (!Object.keys(patch).length) return res.status(400).json({ error: 'Nothing to update' });

      const updated = await sbAdminFetch(`orders?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        prefer: 'return=representation',
        body: JSON.stringify(patch),
      });
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Missing id' });
      await sbAdminFetch(`orders?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
