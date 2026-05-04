// api/auth.js — with rate limiting against brute force

const attempts = new Map(); // IP -> { count, blockedUntil }
const MAX_ATTEMPTS = 5;
const BLOCK_MS = 15 * 60 * 1000; // 15 minutes

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const record = attempts.get(ip) || { count: 0, blockedUntil: 0 };

  // Check if blocked
  if (record.blockedUntil > now) {
    const wait = Math.ceil((record.blockedUntil - now) / 60000);
    return res.status(429).json({ error: `Too many attempts. Try again in ${wait} minutes.` });
  }

  const { password } = req.body || {};

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    record.count += 1;
    if (record.count >= MAX_ATTEMPTS) {
      record.blockedUntil = now + BLOCK_MS;
      record.count = 0;
    }
    attempts.set(ip, record);
    return res.status(401).json({ ok: false });
  }

  // Success — reset attempts
  attempts.delete(ip);
  return res.status(200).json({ ok: true });
}
