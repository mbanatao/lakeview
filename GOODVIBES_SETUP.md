# Goodvibes LTD — Activation System Setup

This document covers the private-demo preview + manual GCash verification +
permanent activation system added to the property site. The existing property
listing and its design are unchanged; the system layers on top of it.

## What was built

**Frontend** (`src/preview/PreviewGate.jsx`, wired into `src/App.jsx`)
- Server-driven 60s preview countdown pill and a subtle `PRIVATE DEMO · GOODVIBES LTD` watermark.
- On expiry: the site blurs, scrolling/interaction is blocked, and a **no-close** activation modal appears.
- Modal actions: **Activate** (GCash QR + submit), **Message us**, **Email us**, **Request revisions**.
- After activation: countdown, watermark, and modal are gone permanently; normal public browsing resumes.
- **Fails open**: if the API is unreachable/unconfigured, the site shows normally (never hard-blocked).

**Backend** (`/api/*` Vercel serverless functions — server is the source of truth)
- `GET /api/preview/status` — computes preview/activation state from **server time**, sets an **HttpOnly** preview cookie. A refresh or revisit does **not** grant new time.
- `POST /api/activation/submit` — records the homeowner's reference # + optional receipt (to private Storage) and auto-activates **only if** a real receipt already matched; otherwise stays `verification_pending`.
- `POST /api/webhooks/gcash-email` — parses forwarded GCash receipt emails and auto-activates a pending order when the reference # + amount match. Protected by a shared secret.

**Database** (Supabase project `RealMatch`, tables prefixed `goodvibes_`)
- `goodvibes_property_sites`, `goodvibes_preview_sessions`, `goodvibes_activation_orders`, `goodvibes_gcash_payments`.
- RLS enabled with **no client policies** — only the server (service role) can read/write.
- Private Storage bucket `goodvibes-receipts` for uploaded screenshots.
- Seeded site row: slug `lakeview-putatan`.

## Your setup steps (required before it works live)

### 1. Set Vercel environment variables
Vercel project → Settings → Environment Variables (see `.env.example`):

| Variable | Value |
|---|---|
| `SUPABASE_URL` | `https://rkthpfdzzisudaxxqvgn.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → **service_role** key (secret) |
| `PREVIEW_COOKIE_SECRET` | `openssl rand -hex 32` |
| `GOODVIBES_INBOUND_EMAIL_SECRET` | `openssl rand -hex 32` |

### 2. Deploy with the serverless functions
The current production deploy was a static-only upload, so it will **not** run
`/api`. Connect this GitHub repo to the Vercel project (Vercel → Project →
Settings → Git → Connect) so pushes deploy the functions too. Vercel
auto-detects `/api/*.js` as Node functions alongside the Vite build.

### 3. Wire up GCash receipt emails (the auto-verify source of truth)
GCash sends **you** (the recipient) a "you received money" notification. Forward
those to the webhook using an inbound-email provider:
- **Cloudflare Email Routing**, **SendGrid Inbound Parse**, **Mailgun Routes**, or **Postmark inbound**.
- Configure it to `POST` to `https://<your-domain>/api/webhooks/gcash-email`
  with header `X-Webhook-Secret: <GOODVIBES_INBOUND_EMAIL_SECRET>`.
- Prefer JSON: `{ subject, text, html, message_id }`. Raw MIME is also accepted.

> ⚠️ **Parser needs a real sample.** `api/_lib/gcash.js` uses best-effort regexes.
> Send one real GCash/InstaPay "payment received" email so the reference-number,
> amount, and timestamp extraction can be tuned and confirmed. Until then, a
> receipt that can't be parsed with confidence is stored but will **not**
> auto-activate.

## How verification actually works (honest summary)
A static GCash QR sends **no** confirmation to the website. So the site does
**not** magically detect payments. Real activation happens when a genuine GCash
**email receipt** (forwarded to the webhook) matches the reference number the
homeowner submits, for at least the ₱5,000 price. A screenshot alone never
activates the site.

## Testing
- Reset a preview to test the timer again: clear the `gv_preview` cookie, or
  delete the browser's row from `goodvibes_preview_sessions`.
- Simulate a paid receipt (for testing only): `POST /api/webhooks/gcash-email`
  with the secret header and a JSON body containing a `text` that includes the
  reference number and `₱5,000.00`, then submit the same reference in the modal.
- Lower `preview_duration_seconds` on the site row to make the timer expire fast
  while testing.

## Security notes
- The `service_role` key is server-only (never shipped to the browser).
- All `goodvibes_` tables are RLS-locked with no client policies.
- The preview cookie is HttpOnly/Secure/SameSite=Lax; only the token **hash** is stored.
- The webhook fails closed if `GOODVIBES_INBOUND_EMAIL_SECRET` is unset.
