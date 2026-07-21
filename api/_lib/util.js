// Small server-side helpers: JSON body parsing, cookies, hashing, tokens.
import crypto from 'node:crypto';

export const PREVIEW_COOKIE = 'gv_preview';

// Hash the preview browser token before storing it in the database, so a DB
// leak never exposes a usable token. Keyed with a server secret when present.
export function hashToken(token) {
  const secret = process.env.PREVIEW_COOKIE_SECRET || '';
  return crypto.createHmac('sha256', secret).update(String(token)).digest('hex');
}

export function newToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Constant-time compare for shared secrets.
export function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export function parseCookies(req) {
  const header = req.headers?.cookie || '';
  const out = {};
  header.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

export function setPreviewCookie(res, token, maxAgeSeconds) {
  const parts = [
    `${PREVIEW_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Secure',
    `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`,
  ];
  res.setHeader('Set-Cookie', parts.join('; '));
}

// Read a JSON body whether or not the platform pre-parsed it.
export async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// Read the raw request body as text (used for inbound-email webhooks).
export async function readRaw(req) {
  if (typeof req.body === 'string') return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

export function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}
