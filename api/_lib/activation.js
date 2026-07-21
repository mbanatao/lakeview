// Shared domain logic. Server time (via now()/Date.now on the server) is the
// single source of truth for preview expiry and activation — never the client.
import { hashToken, newToken } from './util.js';

export const DEFAULT_SLUG = 'lakeview-putatan';

const SITE_COLS =
  'id, slug, property_name, status, preview_duration_seconds, activation_price_centavos, currency, watermark_enabled, public_listing_enabled, activated_at';

export async function getSite(supabase, slug = DEFAULT_SLUG) {
  const { data, error } = await supabase
    .from('goodvibes_property_sites')
    .select(SITE_COLS)
    .eq('slug', slug)
    .single();
  if (error) throw new Error(`site lookup failed: ${error.message}`);
  return data;
}

function isActive(site) {
  return site.status === 'active' && site.public_listing_enabled === true;
}

// Resolve the preview session for a browser token, creating one on first visit.
// Returns { session, freshToken } — when freshToken is set the caller must write
// the HttpOnly cookie. Never extends an existing session (no timer reset).
export async function resolvePreviewSession(supabase, site, existingToken) {
  if (existingToken) {
    const hash = hashToken(existingToken);
    const { data } = await supabase
      .from('goodvibes_preview_sessions')
      .select('id, started_at, expires_at')
      .eq('property_site_id', site.id)
      .eq('browser_token_hash', hash)
      .maybeSingle();
    if (data) {
      // Touch last_seen_at but DO NOT change expires_at.
      await supabase
        .from('goodvibes_preview_sessions')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', data.id);
      return { session: data, freshToken: null };
    }
  }

  const token = newToken();
  const hash = hashToken(token);
  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + site.preview_duration_seconds * 1000);
  const { data, error } = await supabase
    .from('goodvibes_preview_sessions')
    .insert({
      property_site_id: site.id,
      browser_token_hash: hash,
      started_at: startedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      last_seen_at: startedAt.toISOString(),
    })
    .select('id, started_at, expires_at')
    .single();
  if (error) throw new Error(`session create failed: ${error.message}`);
  return { session: data, freshToken: token };
}

// Build the public preview state the frontend renders from.
export function buildPreviewState(site, session) {
  if (isActive(site)) {
    return { status: 'active', locked: false, remaining_seconds: 0, watermark_enabled: false };
  }
  const now = Date.now();
  const expires = new Date(session.expires_at).getTime();
  const remaining = Math.max(0, Math.round((expires - now) / 1000));
  const locked = remaining <= 0;
  return {
    status: locked ? 'locked' : 'preview',
    locked,
    remaining_seconds: remaining,
    preview_duration_seconds: site.preview_duration_seconds,
    watermark_enabled: site.watermark_enabled,
  };
}

// Flip the site to permanently active. Idempotent.
export async function activateSite(supabase, site, { orderId = null, paymentId = null } = {}) {
  const { error } = await supabase
    .from('goodvibes_property_sites')
    .update({
      status: 'active',
      public_listing_enabled: true,
      watermark_enabled: false,
      activated_at: new Date().toISOString(),
    })
    .eq('id', site.id);
  if (error) throw new Error(`activation failed: ${error.message}`);

  if (orderId) {
    await supabase
      .from('goodvibes_activation_orders')
      .update({
        status: 'approved',
        matched_payment_id: paymentId,
        verification_reason: 'Matched GCash email receipt (auto-verified)',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', orderId);
  }
  if (paymentId && orderId) {
    await supabase
      .from('goodvibes_gcash_payments')
      .update({ matched_order_id: orderId })
      .eq('id', paymentId);
  }
}

// Find a real parsed GCash receipt that satisfies an order and is unclaimed.
export async function findMatchingPayment(supabase, { reference, minCentavos }) {
  if (!reference) return null;
  const { data } = await supabase
    .from('goodvibes_gcash_payments')
    .select('id, reference_number, amount_centavos, matched_order_id')
    .ilike('reference_number', reference)
    .is('matched_order_id', null)
    .limit(5);
  if (!data || data.length === 0) return null;
  return data.find((p) => (p.amount_centavos ?? 0) >= minCentavos) || null;
}

// Find a pending order that a newly-arrived receipt satisfies.
export async function findPendingOrderForPayment(supabase, { siteId, reference, amountCentavos }) {
  if (!reference) return null;
  const { data } = await supabase
    .from('goodvibes_activation_orders')
    .select('id, amount_centavos, status')
    .eq('property_site_id', siteId)
    .ilike('gcash_reference_number', reference)
    .in('status', ['submitted', 'verification_pending', 'created'])
    .limit(5);
  if (!data || data.length === 0) return null;
  return data.find((o) => (amountCentavos ?? 0) >= o.amount_centavos) || null;
}
