// POST /api/activation/submit
// Body: { slug?, payer_name, payer_mobile, payer_email, gcash_reference_number,
//         receipt_base64?, receipt_content_type? }
//
// Records the homeowner's activation submission and uploads the receipt
// screenshot to a PRIVATE Storage bucket. It then checks whether a REAL GCash
// email receipt with that reference has already arrived; if so, it auto-activates.
// Otherwise the order stays 'verification_pending' until the receipt email is
// parsed by the webhook. We never activate on the screenshot alone.
import { getServiceClient, RECEIPTS_BUCKET } from '../_lib/supabase.js';
import { readJson, json } from '../_lib/util.js';
import { getSite, findMatchingPayment, activateSite, DEFAULT_SLUG } from '../_lib/activation.js';

const MAX_RECEIPT_BYTES = 6 * 1024 * 1024; // 6 MB

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' });
  try {
    const supabase = getServiceClient();
    const body = await readJson(req);
    const slug = (body.slug || DEFAULT_SLUG).toString();
    const site = await getSite(supabase, slug);

    if (site.status === 'active' && site.public_listing_enabled) {
      return json(res, 200, { status: 'active', message: 'Website already activated.' });
    }

    const reference = (body.gcash_reference_number || '').toString().trim();
    if (reference.length < 6) {
      return json(res, 400, { error: 'invalid_reference', message: 'Enter the GCash reference number from your receipt.' });
    }

    // Optional receipt screenshot -> private bucket.
    let receiptPath = null;
    if (body.receipt_base64) {
      const raw = body.receipt_base64.toString().replace(/^data:[^;]+;base64,/, '');
      const buf = Buffer.from(raw, 'base64');
      if (buf.length > MAX_RECEIPT_BYTES) {
        return json(res, 413, { error: 'receipt_too_large', message: 'Receipt image must be under 6 MB.' });
      }
      const ct = (body.receipt_content_type || 'image/jpeg').toString();
      const ext = ct.includes('png') ? 'png' : ct.includes('webp') ? 'webp' : 'jpg';
      receiptPath = `${site.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const up = await supabase.storage.from(RECEIPTS_BUCKET).upload(receiptPath, buf, {
        contentType: ct,
        upsert: false,
      });
      if (up.error) return json(res, 500, { error: 'upload_failed', message: up.error.message });
    }

    // Create the order.
    const { data: order, error: orderErr } = await supabase
      .from('goodvibes_activation_orders')
      .insert({
        property_site_id: site.id,
        amount_centavos: site.activation_price_centavos,
        currency: site.currency,
        status: 'verification_pending',
        payer_name: body.payer_name?.toString().slice(0, 200) || null,
        payer_mobile: body.payer_mobile?.toString().slice(0, 40) || null,
        payer_email: body.payer_email?.toString().slice(0, 200) || null,
        gcash_reference_number: reference,
        receipt_storage_path: receiptPath,
      })
      .select('id')
      .single();
    if (orderErr) return json(res, 500, { error: 'order_failed', message: orderErr.message });

    // Has the real receipt email already arrived for this reference?
    const payment = await findMatchingPayment(supabase, {
      reference,
      minCentavos: site.activation_price_centavos,
    });
    if (payment) {
      await activateSite(supabase, site, { orderId: order.id, paymentId: payment.id });
      return json(res, 200, { status: 'active', order_id: order.id, message: 'Payment verified — website activated.' });
    }

    return json(res, 200, {
      status: 'verification_pending',
      order_id: order.id,
      message:
        'Payment reference received. We are matching it against the GCash receipt — your website activates automatically once the payment is confirmed.',
    });
  } catch (err) {
    return json(res, 500, { error: 'server_error', message: err.message });
  }
}
