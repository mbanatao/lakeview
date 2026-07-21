// POST /api/webhooks/gcash-email
// Inbound-email webhook. Your GCash/InstaPay "you received money" receipt emails
// are forwarded here by an inbound-email provider (e.g. Cloudflare Email Routing,
// SendGrid Inbound Parse, Mailgun Routes, Postmark inbound). This is the ONLY
// source of real payment truth — a parsed receipt is what actually activates a
// site. Protected by a shared secret so strangers cannot forge payments.
//
// Accepts either JSON { subject, text, html, message_id } (recommended: have the
// provider POST JSON) or a raw MIME body as a fallback.
import { getServiceClient } from '../_lib/supabase.js';
import { readJson, readRaw, safeEqual, json } from '../_lib/util.js';
import { parseGcashEmail } from '../_lib/gcash.js';
import {
  getSite,
  findPendingOrderForPayment,
  activateSite,
  DEFAULT_SLUG,
} from '../_lib/activation.js';

function authorized(req) {
  const secret = process.env.GOODVIBES_INBOUND_EMAIL_SECRET;
  if (!secret) return false; // fail closed if not configured
  const provided =
    req.headers['x-webhook-secret'] ||
    (req.query && (req.query.secret || req.query.token)) ||
    '';
  return safeEqual(provided, secret);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' });
  if (!authorized(req)) return json(res, 401, { error: 'unauthorized' });

  try {
    const supabase = getServiceClient();

    // Prefer structured JSON; fall back to raw MIME text.
    let payload = await readJson(req);
    if (!payload || (!payload.text && !payload.html && !payload.subject)) {
      const raw = await readRaw(req);
      payload = { text: raw };
    }
    const messageId =
      (payload.message_id || payload.messageId || req.headers['x-message-id'] || '').toString() ||
      null;

    const parsed = parseGcashEmail({
      text: payload.text || '',
      html: payload.html || '',
      subject: payload.subject || '',
    });

    // Persist the parsed receipt (dedupe by message id). We store even
    // low-confidence rows for audit, but only confident ones can auto-activate.
    const insert = await supabase
      .from('goodvibes_gcash_payments')
      .insert({
        reference_number: parsed.reference_number,
        amount_centavos: parsed.amount_centavos,
        payer_name: parsed.payer_name,
        received_at: parsed.received_at,
        email_message_id: messageId,
        raw_source: (payload.text || payload.html || '').toString().slice(0, 20000),
      })
      .select('id')
      .single();

    // Duplicate message → treat as already handled.
    if (insert.error) {
      if (insert.error.code === '23505') return json(res, 200, { status: 'duplicate' });
      return json(res, 500, { error: 'store_failed', message: insert.error.message });
    }
    const paymentId = insert.data.id;

    if (!parsed.confident) {
      return json(res, 200, {
        status: 'stored_unconfident',
        message: 'Receipt stored but reference/amount could not be parsed with confidence.',
      });
    }

    // Try to satisfy a pending order for this site.
    const slug = (payload.slug || DEFAULT_SLUG).toString();
    const site = await getSite(supabase, slug);
    const order = await findPendingOrderForPayment(supabase, {
      siteId: site.id,
      reference: parsed.reference_number,
      amountCentavos: parsed.amount_centavos,
    });

    if (order) {
      await activateSite(supabase, site, { orderId: order.id, paymentId });
      return json(res, 200, { status: 'activated', order_id: order.id });
    }

    return json(res, 200, { status: 'stored', message: 'Receipt stored; no matching order yet.' });
  } catch (err) {
    return json(res, 500, { error: 'server_error', message: err.message });
  }
}
