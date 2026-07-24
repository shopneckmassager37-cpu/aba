import { requireAdmin } from '../../lib/adminAuth.js';
import { sbAdminStorageUpload } from '../../lib/supabaseAdmin.js';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 4 * 1024 * 1024; // Vercel serverless body limit is ~4.5MB

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { filename, contentType, dataBase64 } = req.body || {};
    if (!filename || !contentType || !dataBase64) {
      return res.status(400).json({ error: 'Missing filename, contentType, or dataBase64' });
    }
    if (!ALLOWED_TYPES.includes(contentType)) {
      return res.status(400).json({ error: 'Unsupported image type' });
    }
    const buffer = Buffer.from(dataBase64, 'base64');
    if (buffer.length > MAX_BYTES) {
      return res.status(400).json({ error: 'Image too large (max 4MB)' });
    }
    const ext = (filename.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const url = await sbAdminStorageUpload('menu-images', safeName, buffer, contentType);
    return res.status(200).json({ url });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
