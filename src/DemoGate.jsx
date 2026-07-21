import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Clock3, ExternalLink, Loader2, Mail, MessageCircle, Phone, RefreshCw, ShieldCheck, Upload } from 'lucide-react';

const SUPABASE_URL = 'https://rkthpfdzzisudaxxqvgn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0O4UUonjn2-aNa0VH0siVg_Mo_PdIKY';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/goodvibes-activation`;
const ADMIN_EMAIL = 'markjohnsonbanatao888@gmail.com';
const PHONE = '0968-184-1001';
const PHONE_LINK = 'tel:+639681841001';
const WHATSAPP = 'https://wa.me/639681841001?text=Hello%20Goodvibes%20LTD%2C%20I%20am%20contacting%20you%20about%20my%20property%20website%20activation.';
const QR_PATH = '/payments/goodvibes-gcash-qr.svg';

const api = async (action, options = {}) => {
  const response = await fetch(`${FUNCTION_URL}?action=${encodeURIComponent(action)}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Unable to complete the request.');
  return payload;
};

const money = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 });

function PreviewBadge({ seconds }) {
  return (
    <div className={`fixed right-4 top-20 z-[60] rounded-2xl border px-4 py-3 shadow-xl backdrop-blur ${seconds <= 15 ? 'border-amber-300 bg-amber-50/95 text-amber-950' : 'border-white/20 bg-neutral-950/85 text-white'}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em]">Private website preview</p>
      <div className="mt-1 flex items-center gap-2 text-sm font-semibold"><Clock3 size={15} /> 00:{String(Math.max(0, seconds)).padStart(2, '0')} remaining</div>
    </div>
  );
}

function Watermark() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[55] overflow-hidden opacity-[0.075]">
      <div className="absolute left-1/2 top-1/2 w-[150vw] -translate-x-1/2 -translate-y-1/2 -rotate-[24deg] text-center text-xl font-black tracking-[0.35em] text-black md:text-3xl">
        {Array.from({ length: 18 }).map((_, index) => <span key={index} className="mx-10 my-10 inline-block">PRIVATE DEMO · GOODVIBES LTD</span>)}
      </div>
    </div>
  );
}

function ContactActions() {
  return (
    <div className="grid grid-cols-3 gap-2">
      <a href={PHONE_LINK} className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 px-3 py-3 text-sm font-semibold hover:bg-neutral-50"><Phone size={16} /> Call</a>
      <a href={WHATSAPP} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 px-3 py-3 text-sm font-semibold hover:bg-neutral-50"><MessageCircle size={16} /> Message</a>
      <a href={`mailto:${ADMIN_EMAIL}?subject=Goodvibes%20LTD%20Website%20Activation`} className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 px-3 py-3 text-sm font-semibold hover:bg-neutral-50"><Mail size={16} /> Email</a>
    </div>
  );
}

function ActivationModal({ order, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ payerName: '', payerMobile: '', payerEmail: '', referenceNumber: '', paymentDatetime: '', consentConfirmed: false });
  const [receipt, setReceipt] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(order?.status === 'verification_pending');
  const [submissionReference, setSubmissionReference] = useState(order?.submission_reference || '');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!receipt) return setError('Please upload your GCash receipt.');
    if (receipt.size > 5 * 1024 * 1024) return setError('Receipt must be 5 MB or smaller.');
    setBusy(true);
    try {
      const upload = await api('create-upload', { method: 'POST', body: JSON.stringify({ action: 'create-upload', contentType: receipt.type, fileSize: receipt.size }) });
      const uploaded = await fetch(upload.signedUrl, { method: 'PUT', headers: { 'Content-Type': receipt.type }, body: receipt });
      if (!uploaded.ok) throw new Error('Receipt upload failed. Please try again.');
      const result = await api('submit-payment', {
        method: 'POST',
        body: JSON.stringify({ action: 'submit-payment', ...form, amountCentavos: 500000, receiptPath: upload.path }),
      });
      setSubmissionReference(result.order.submission_reference);
      setSubmitted(true);
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-neutral-950/80 px-4 py-6 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="activation-title">
      <div className="mx-auto flex min-h-full max-w-3xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-3xl bg-white shadow-2xl">
          <div className="grid md:grid-cols-[0.9fr_1.1fr]">
            <div className="bg-neutral-950 p-7 text-white md:p-9">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/55">Private demo complete</p>
              <h2 id="activation-title" className="mt-3 text-3xl font-semibold tracking-tight">Make this your official property website.</h2>
              <p className="mt-4 text-sm leading-relaxed text-white/70">Activate the completed site to remove the demo restriction and publish a professional page you can share with interested buyers.</p>
              <div className="mt-7 rounded-2xl border border-white/15 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-widest text-white/55">One-time activation</p>
                <p className="mt-1 text-4xl font-semibold">{money.format(5000)}</p>
              </div>
              <ul className="mt-7 space-y-3 text-sm text-white/75">
                {['Buyer-ready public website', 'Full approved photo gallery', 'Location, inquiry and viewing tools', 'Demo timer and watermark removed', 'Agreed minor corrections before launch'].map((item) => <li key={item} className="flex gap-2"><Check size={17} className="mt-0.5 shrink-0" />{item}</li>)}
              </ul>
            </div>

            <div className="p-6 md:p-9">
              {submitted ? (
                <div className="flex min-h-[520px] flex-col justify-center text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-900"><Clock3 /></div>
                  <h3 className="mt-5 text-2xl font-semibold">Payment verification pending</h3>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-neutral-600">Goodvibes LTD will review the GCash payment. This page will unlock automatically after approval.</p>
                  {submissionReference && <div className="mx-auto mt-5 rounded-xl bg-neutral-100 px-4 py-3 font-mono text-sm">{submissionReference}</div>}
                  <button onClick={onRefresh} className="mx-auto mt-6 flex items-center gap-2 rounded-full bg-neutral-950 px-6 py-3 text-sm font-semibold text-white"><RefreshCw size={16} /> Check activation status</button>
                  <div className="mt-7"><ContactActions /></div>
                </div>
              ) : !showForm ? (
                <>
                  <div className="mx-auto max-w-[270px] rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
                    <img src={QR_PATH} alt="Goodvibes LTD GCash QR code" className="aspect-square w-full object-contain" />
                  </div>
                  <div className="mt-5 text-center">
                    <p className="font-semibold">Scan the GCash QR and pay exactly ₱5,000</p>
                    <p className="mt-1 text-sm text-neutral-500">Then submit the receipt and reference number for verification.</p>
                  </div>
                  <ol className="mt-5 grid gap-2 text-sm text-neutral-700 sm:grid-cols-2">
                    {['Scan or save the QR', 'Pay exactly ₱5,000', 'Save the confirmation receipt', 'Submit payment details below'].map((step, index) => <li key={step} className="rounded-xl bg-neutral-100 p-3"><strong>{index + 1}.</strong> {step}</li>)}
                  </ol>
                  <button onClick={() => setShowForm(true)} className="mt-5 w-full rounded-xl bg-neutral-950 px-5 py-4 font-semibold text-white hover:bg-neutral-800">I have paid — submit receipt</button>
                  <p className="mt-3 text-center text-xs leading-relaxed text-neutral-500">Static GCash QR payments are manually verified by Goodvibes LTD before activation.</p>
                  <div className="mt-5"><ContactActions /></div>
                </>
              ) : (
                <form onSubmit={submit} className="space-y-4">
                  <div><h3 className="text-xl font-semibold">Submit your payment</h3><p className="mt-1 text-sm text-neutral-500">All fields below are required.</p></div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input required placeholder="Full name" value={form.payerName} onChange={(e) => setForm({ ...form, payerName: e.target.value })} className="rounded-xl border border-neutral-300 px-4 py-3 text-sm" />
                    <input required placeholder="Mobile number" value={form.payerMobile} onChange={(e) => setForm({ ...form, payerMobile: e.target.value })} className="rounded-xl border border-neutral-300 px-4 py-3 text-sm" />
                  </div>
                  <input required type="email" placeholder="Email address" value={form.payerEmail} onChange={(e) => setForm({ ...form, payerEmail: e.target.value })} className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input required placeholder="GCash reference number" value={form.referenceNumber} onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })} className="rounded-xl border border-neutral-300 px-4 py-3 text-sm" />
                    <input required type="datetime-local" value={form.paymentDatetime} onChange={(e) => setForm({ ...form, paymentDatetime: e.target.value })} className="rounded-xl border border-neutral-300 px-4 py-3 text-sm" />
                  </div>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 px-4 py-5 text-sm font-semibold hover:bg-neutral-50"><Upload size={18} /> {receipt ? receipt.name : 'Upload GCash receipt'}<input required type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="sr-only" onChange={(e) => setReceipt(e.target.files?.[0] || null)} /></label>
                  <label className="flex items-start gap-3 text-xs leading-relaxed text-neutral-600"><input required type="checkbox" checked={form.consentConfirmed} onChange={(e) => setForm({ ...form, consentConfirmed: e.target.checked })} className="mt-0.5" />I confirm this payment is for the Goodvibes LTD property website design and activation service, not a payment toward the property.</label>
                  {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                  <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 py-4 font-semibold text-white disabled:opacity-60">{busy && <Loader2 className="animate-spin" size={18} />} Submit for verification</button>
                  <button type="button" onClick={() => setShowForm(false)} className="w-full text-sm font-semibold text-neutral-500">Back to QR</button>
                </form>
              )}
              <p className="mt-5 text-center text-xs text-neutral-400">Goodvibes LTD · {PHONE} · {ADMIN_EMAIL}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminPanel() {
  const [token, setToken] = useState(() => localStorage.getItem('goodvibes_admin_token') || '');
  const [emailSent, setEmailSent] = useState(false);
  const [orders, setOrders] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const accessToken = hash.get('access_token');
    if (accessToken) {
      localStorage.setItem('goodvibes_admin_token', accessToken);
      setToken(accessToken);
      history.replaceState(null, '', '/goodvibes-admin');
    }
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    try {
      const result = await api('admin-list', { headers: { Authorization: `Bearer ${token}` } });
      setOrders(result.orders || []);
      setMessage('');
    } catch (err) {
      setMessage(err.message);
    } finally { setBusy(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const sendLink = async () => {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/otp?redirect_to=${encodeURIComponent(`${window.location.origin}/goodvibes-admin`)}`, {
        method: 'POST',
        headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, create_user: true }),
      });
      if (!response.ok) throw new Error('Unable to send the admin sign-in email.');
      setEmailSent(true);
    } catch (err) { setMessage(err.message); } finally { setBusy(false); }
  };

  const review = async (orderId, action) => {
    const notes = action === 'admin-reject' ? prompt('Reason for rejection:') : prompt('Approval notes (optional):') || '';
    if (action === 'admin-reject' && !notes) return;
    setBusy(true);
    try {
      await api(action, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ action, orderId, notes }) });
      await load();
    } catch (err) { setMessage(err.message); } finally { setBusy(false); }
  };

  if (!token) return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 p-5">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-950 text-white"><ShieldCheck /></div>
        <h1 className="mt-5 text-3xl font-semibold">Goodvibes LTD Admin</h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">A secure sign-in link will be sent to {ADMIN_EMAIL}.</p>
        <button disabled={busy || emailSent} onClick={sendLink} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 py-4 font-semibold text-white disabled:opacity-60">{busy && <Loader2 className="animate-spin" size={18} />}{emailSent ? 'Check your email' : 'Email me a sign-in link'}</button>
        {message && <p className="mt-4 text-sm text-red-600">{message}</p>}
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-neutral-100 p-5 md:p-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Goodvibes LTD</p><h1 className="text-3xl font-semibold">Activation requests</h1></div><button onClick={load} className="flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold shadow"><RefreshCw size={16} /> Refresh</button></div>
        {message && <p className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">{message}</p>}
        <div className="mt-7 space-y-4">
          {busy && !orders.length ? <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div> : orders.length === 0 ? <div className="rounded-2xl bg-white p-10 text-center text-neutral-500">No activation requests yet.</div> : orders.map((order) => (
            <article key={order.id} className="rounded-2xl bg-white p-5 shadow-sm md:p-7">
              <div className="flex flex-wrap justify-between gap-4"><div><p className="font-mono text-xs text-neutral-500">{order.submission_reference || order.id}</p><h2 className="mt-1 text-xl font-semibold">{order.payer_name}</h2><p className="text-sm text-neutral-500">{order.payer_mobile} · {order.payer_email}</p></div><span className="h-fit rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold uppercase tracking-wide">{order.status}</span></div>
              <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3"><div className="rounded-xl bg-neutral-50 p-4"><p className="text-neutral-500">Amount</p><strong>{money.format(order.amount_centavos / 100)}</strong></div><div className="rounded-xl bg-neutral-50 p-4"><p className="text-neutral-500">GCash reference</p><strong>{order.gcash_reference_number}</strong></div><div className="rounded-xl bg-neutral-50 p-4"><p className="text-neutral-500">Paid</p><strong>{order.payment_datetime ? new Date(order.payment_datetime).toLocaleString() : 'Not supplied'}</strong></div></div>
              <div className="mt-5 flex flex-wrap gap-3">{order.receiptUrl && <a href={order.receiptUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-semibold"><ExternalLink size={16} /> View receipt</a>}{order.status === 'verification_pending' && <><button disabled={busy} onClick={() => review(order.id, 'admin-approve')} className="rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white">Approve and activate</button><button disabled={busy} onClick={() => review(order.id, 'admin-reject')} className="rounded-full bg-red-700 px-5 py-2.5 text-sm font-semibold text-white">Reject</button></>}</div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function DemoGate({ children }) {
  const isAdmin = window.location.pathname.startsWith('/goodvibes-admin');
  const [access, setAccess] = useState(null);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const result = await api('access');
      setAccess(result);
      setError('');
    } catch (err) { setError(err.message); }
  }, []);

  useEffect(() => {
    if (isAdmin) return;
    refresh();
    const interval = window.setInterval(refresh, access?.canPreview ? 1000 : 15000);
    return () => window.clearInterval(interval);
  }, [isAdmin, refresh, access?.canPreview]);

  const locked = useMemo(() => access && !access.isActive && !access.canPreview, [access]);

  if (isAdmin) return <AdminPanel />;
  if (!access && !error) return <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-white"><Loader2 className="animate-spin" /></div>;

  return (
    <>
      {children}
      {access && !access.isActive && access.canPreview && <><PreviewBadge seconds={access.remainingSeconds} />{access.watermarkEnabled && <Watermark />}</>}
      {locked && <ActivationModal order={access.order} onRefresh={refresh} />}
      {error && <div className="fixed bottom-5 left-1/2 z-[110] -translate-x-1/2 rounded-xl bg-red-700 px-5 py-3 text-sm text-white shadow-xl">{error}</div>}
    </>
  );
}
