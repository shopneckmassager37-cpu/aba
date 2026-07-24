import { requireAdmin } from '../../lib/adminAuth.js';
import { sbAdminFetch } from '../../lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

  try {
    if (req.method === 'POST') {
      const created = await sbAdminFetch('products', {
        method: 'POST',
        prefer: 'return=representation',
        body: JSON.stringify(req.body),
      });
      return res.status(200).json(created);
    }

    if (req.method === 'PATCH') {
      const { id, ...data } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Missing id' });
      const updated = await sbAdminFetch(`products?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        prefer: 'return=representation',
        body: JSON.stringify(data),
      });
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Missing id' });
      await sbAdminFetch(`products?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
