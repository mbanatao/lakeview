import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, 'Content-Type': 'application/json' },
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
);

const ADMIN_EMAIL = Deno.env.get('GOODVIBES_ADMIN_EMAIL') || 'markjohnsonbanatao888@gmail.com';
const SITE_SLUG = 'lakeview-putatan';
const SITE_URL = Deno.env.get('GOODVIBES_SITE_URL') || 'https://lakeview-putatan.vercel.app';
const RESEND_FROM = Deno.env.get('RESEND_FROM') || 'Goodvibes LTD <onboarding@resend.dev>';

type EmailInput = {
  eventType: string;
  to: string;
  subject: string;
  text: string;
  metadata?: Record<string, unknown>;
};

async function recordEmail(input: EmailInput, status: string, providerMessageId?: string, errorMessage?: string) {
  await supabase.from('goodvibes_email_notifications').insert({
    event_type: input.eventType,
    recipient: input.to,
    subject: input.subject,
    status,
    metadata: input.metadata ?? {},
    provider_message_id: providerMessageId ?? null,
    error_message: errorMessage ?? null,
    sent_at: status === 'sent' ? new Date().toISOString() : null,
  }).catch(() => undefined);
}

async function sendEmail(input: EmailInput) {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    await recordEmail(input, 'skipped', undefined, 'RESEND_API_KEY is not configured');
    return;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [input.to],
        reply_to: ADMIN_EMAIL,
        subject: input.subject,
        text: input.text,
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result?.message || `Resend returned ${response.status}`);
    await recordEmail(input, 'sent', result?.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Resend error';
    await recordEmail(input, 'failed', undefined, message);
    console.error('Resend notification failed:', message);
  }
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function getSite() {
  const { data, error } = await supabase.from('goodvibes_property_sites').select('*').eq('slug', SITE_SLUG).single();
  if (error) throw error;
  return data;
}

async function requireAdmin(req: Request) {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) throw new Error('UNAUTHORIZED');
  const { data, error } = await supabase.auth.getUser(auth.slice(7));
  if (error || !data.user || data.user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) throw new Error('UNAUTHORIZED');
  return data.user;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const url = new URL(req.url);
    const clonedBody = req.method === 'POST' ? await req.clone().json().catch(() => ({})) : {};
    const action = url.searchParams.get('action') ?? clonedBody.action;

    if (action === 'access') {
      const site = await getSite();
      if (site.status === 'active') return json({ siteStatus: 'active', isActive: true, canPreview: true, remainingSeconds: null, watermarkEnabled: false });

      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('cf-connecting-ip') ?? 'unknown';
      const ua = req.headers.get('user-agent') ?? 'unknown';
      const fingerprint = await sha256(`${SITE_SLUG}|${ip}|${ua}`);
      const now = new Date();
      let { data: session } = await supabase.from('goodvibes_preview_sessions').select('*').eq('property_site_id', site.id).eq('browser_token_hash', fingerprint).maybeSingle();

      if (!session) {
        const inserted = await supabase.from('goodvibes_preview_sessions').insert({
          property_site_id: site.id,
          browser_token_hash: fingerprint,
          expires_at: new Date(now.getTime() + site.preview_duration_seconds * 1000).toISOString(),
          last_seen_at: now.toISOString(),
        }).select().single();
        if (inserted.error) throw inserted.error;
        session = inserted.data;
      } else {
        await supabase.from('goodvibes_preview_sessions').update({ last_seen_at: now.toISOString() }).eq('id', session.id);
      }

      const remainingSeconds = Math.max(0, Math.ceil((new Date(session.expires_at).getTime() - now.getTime()) / 1000));
      const { data: order } = await supabase.from('goodvibes_activation_orders').select('id,status,submission_reference,created_at').eq('property_site_id', site.id).in('status', ['verification_pending', 'approved', 'rejected']).order('created_at', { ascending: false }).limit(1).maybeSingle();
      return json({ siteStatus: site.status, isActive: false, canPreview: remainingSeconds > 0, remainingSeconds, watermarkEnabled: site.watermark_enabled, order: order ?? null });
    }

    if (action === 'create-upload') {
      const body = await req.json();
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowed.includes(body.contentType)) return json({ error: 'Unsupported receipt file type.' }, 400);
      if (!body.fileSize || body.fileSize > 5 * 1024 * 1024) return json({ error: 'Receipt must be 5 MB or smaller.' }, 400);
      const ext = body.contentType === 'application/pdf' ? 'pdf' : body.contentType.split('/')[1].replace('jpeg', 'jpg');
      const path = `${SITE_SLUG}/${crypto.randomUUID()}.${ext}`;
      const { data, error } = await supabase.storage.from('goodvibes-payment-receipts').createSignedUploadUrl(path);
      if (error) throw error;
      return json({ path, token: data.token, signedUrl: data.signedUrl });
    }

    if (action === 'submit-payment') {
      const body = await req.json();
      const site = await getSite();
      if (site.status === 'active') return json({ error: 'This website is already active.' }, 409);

      for (const key of ['payerName', 'payerMobile', 'payerEmail', 'referenceNumber', 'paymentDatetime', 'receiptPath']) {
        if (!String(body[key] ?? '').trim()) return json({ error: `Missing ${key}.` }, 400);
      }
      if (Number(body.amountCentavos) !== Number(site.activation_price_centavos)) return json({ error: 'Payment amount must be exactly ₱5,000.' }, 400);
      if (!body.consentConfirmed) return json({ error: 'Confirmation is required.' }, 400);
      if (!String(body.receiptPath).startsWith(`${SITE_SLUG}/`)) return json({ error: 'Invalid receipt path.' }, 400);

      const submissionReference = `GV-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
      const { data, error } = await supabase.from('goodvibes_activation_orders').insert({
        property_site_id: site.id,
        amount_centavos: site.activation_price_centavos,
        currency: site.currency,
        status: 'verification_pending',
        payer_name: body.payerName.trim(),
        payer_mobile: body.payerMobile.trim(),
        payer_email: body.payerEmail.trim().toLowerCase(),
        gcash_reference_number: body.referenceNumber.trim(),
        receipt_storage_path: body.receiptPath,
        payment_datetime: body.paymentDatetime,
        submission_reference: submissionReference,
        consent_confirmed: true,
      }).select('id,status,submission_reference,created_at').single();
      if (error) throw error;

      await supabase.from('goodvibes_property_sites').update({ status: 'verification_pending', updated_at: new Date().toISOString() }).eq('id', site.id);
      await sendEmail({
        eventType: 'activation_payment_submitted',
        to: ADMIN_EMAIL,
        subject: `New website activation payment — ${submissionReference}`,
        text: `A new ₱5,000 GCash activation payment was submitted.\n\nPayer: ${body.payerName}\nMobile: ${body.payerMobile}\nEmail: ${body.payerEmail}\nGCash reference: ${body.referenceNumber}\nPayment time: ${body.paymentDatetime}\nSubmission: ${submissionReference}\n\nReview: ${SITE_URL}/goodvibes-admin`,
        metadata: { orderId: data.id, submissionReference },
      });

      return json({ ok: true, order: data });
    }

    if (action === 'admin-list') {
      await requireAdmin(req);
      const { data, error } = await supabase.from('goodvibes_activation_orders').select('*, goodvibes_property_sites(property_name,slug,status)').order('created_at', { ascending: false });
      if (error) throw error;
      const orders = await Promise.all((data ?? []).map(async (order) => {
        let receiptUrl = null;
        if (order.receipt_storage_path) {
          const signed = await supabase.storage.from('goodvibes-payment-receipts').createSignedUrl(order.receipt_storage_path, 300);
          receiptUrl = signed.data?.signedUrl ?? null;
        }
        return { ...order, receiptUrl };
      }));
      return json({ orders });
    }

    if (action === 'admin-approve' || action === 'admin-reject') {
      const admin = await requireAdmin(req);
      const body = await req.json();
      const { data: order, error } = await supabase.from('goodvibes_activation_orders').select('*').eq('id', body.orderId).single();
      if (error) throw error;

      if (action === 'admin-approve') {
        const now = new Date().toISOString();
        await supabase.from('goodvibes_activation_orders').update({ status: 'approved', reviewed_by: admin.id, reviewed_at: now, activated_at: now, admin_notes: body.notes ?? null, updated_at: now }).eq('id', order.id);
        await supabase.from('goodvibes_property_sites').update({ status: 'active', watermark_enabled: false, public_listing_enabled: true, activated_at: now, activated_by: admin.id, updated_at: now }).eq('id', order.property_site_id);
        await supabase.from('goodvibes_admin_audit_logs').insert({ admin_user_id: admin.id, property_site_id: order.property_site_id, activation_order_id: order.id, action: 'approve_and_activate', details: { notes: body.notes ?? null } });
        await sendEmail({
          eventType: 'activation_approved',
          to: order.payer_email,
          subject: 'Your Goodvibes LTD property website is activated',
          text: `Hello ${order.payer_name},\n\nYour Lakeview property website has been activated successfully. The private-demo timer, watermark, and payment screen have been removed.\n\nWebsite: ${SITE_URL}\n\nGoodvibes LTD\n0968-184-1001`,
          metadata: { orderId: order.id, submissionReference: order.submission_reference },
        });
      } else {
        if (!String(body.notes ?? '').trim()) return json({ error: 'A rejection note is required.' }, 400);
        const now = new Date().toISOString();
        await supabase.from('goodvibes_activation_orders').update({ status: 'rejected', reviewed_by: admin.id, reviewed_at: now, admin_notes: body.notes, updated_at: now }).eq('id', order.id);
        await supabase.from('goodvibes_property_sites').update({ status: 'preview', updated_at: now }).eq('id', order.property_site_id);
        await supabase.from('goodvibes_admin_audit_logs').insert({ admin_user_id: admin.id, property_site_id: order.property_site_id, activation_order_id: order.id, action: 'reject_payment', details: { notes: body.notes } });
        await sendEmail({
          eventType: 'activation_rejected',
          to: order.payer_email,
          subject: 'Action needed for your Goodvibes LTD activation payment',
          text: `Hello ${order.payer_name},\n\nWe could not approve the submitted payment yet.\n\nReason: ${body.notes}\n\nPlease contact Goodvibes LTD at 0968-184-1001 or reply to this email.\n\nSubmission: ${order.submission_reference}`,
          metadata: { orderId: order.id, submissionReference: order.submission_reference },
        });
      }
      return json({ ok: true });
    }

    return json({ error: 'Unknown action.' }, 404);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    if (message === 'UNAUTHORIZED') return json({ error: 'Unauthorized.' }, 401);
    console.error(error);
    return json({ error: 'Unable to complete the request.' }, 500);
  }
});
