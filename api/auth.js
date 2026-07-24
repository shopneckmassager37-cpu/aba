import { issueToken } from '../lib/adminAuth.js';

// Best-effort in-memory rate limit (per warm serverless instance).
// Not a substitute for a real distributed limiter, but blocks rapid
// brute-force attempts hitting the same instance.
const attempts = new Map(); // ip -> { count, windowStart }
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function getIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  return (Array.isArray(fwd) ? fwd[0] : fwd || '').split(',')[0].trim() || 'unknown';
}

function isRateLimited(ip) {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    attempts.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const ip = getIp(req);
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many attempts. Try again later.' });
  }
  const { password } = req.body || {};
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false });
  }
  return res.status(200).json({ ok: true, token: issueToken() });
}
