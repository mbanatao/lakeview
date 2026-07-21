// GET /api/preview/status?slug=lakeview-putatan
// Returns the server-computed preview/activation state and (on first visit)
// sets the HttpOnly preview cookie. This endpoint is the frontend's source of
// truth — the visible countdown is seeded from remaining_seconds here.
import { getServiceClient } from '../_lib/supabase.js';
import { PREVIEW_COOKIE, parseCookies, setPreviewCookie, json } from '../_lib/util.js';
import { getSite, resolvePreviewSession, buildPreviewState, DEFAULT_SLUG } from '../_lib/activation.js';

const CONTACT = {
  brand: 'Goodvibes LTD',
  phone: '0968-184-1001',
  phone_intl: '+63 968 184 1001',
  email: 'markjohnsonbanatao888@gmail.com',
  watermark_text: 'PRIVATE DEMO · GOODVIBES LTD',
};

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'method_not_allowed' });
  try {
    const supabase = getServiceClient();
    const slug = (req.query?.slug || DEFAULT_SLUG).toString();
    const site = await getSite(supabase, slug);

    // Active sites need no session and no gate.
    if (site.status === 'active' && site.public_listing_enabled) {
      return json(res, 200, {
        status: 'active',
        locked: false,
        watermark_enabled: false,
        contact: CONTACT,
        price_centavos: site.activation_price_centavos,
        currency: site.currency,
      });
    }

    const cookies = parseCookies(req);
    const { session, freshToken } = await resolvePreviewSession(supabase, site, cookies[PREVIEW_COOKIE]);
    if (freshToken) {
      // Cookie lives long enough to keep identifying this browser after expiry,
      // so a refresh cannot earn a new 60 seconds.
      setPreviewCookie(res, freshToken, Math.max(site.preview_duration_seconds, 60 * 60 * 24 * 30));
    }

    const state = buildPreviewState(site, session);
    return json(res, 200, {
      ...state,
      contact: CONTACT,
      property_name: site.property_name,
      price_centavos: site.activation_price_centavos,
      currency: site.currency,
    });
  } catch (err) {
    return json(res, 500, { error: 'server_error', message: err.message });
  }
}
