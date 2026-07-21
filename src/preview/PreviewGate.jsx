import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, MessageCircle, Mail, PencilRuler, ShieldCheck, Loader2, Upload, X, CheckCircle2 } from 'lucide-react';

// ============================================================
// Goodvibes LTD — private-demo preview gate + activation flow.
//
// The SERVER is the source of truth: this component only *renders* the state
// returned by /api/preview/status. The visible countdown is seeded from the
// server's remaining_seconds and re-verified with the server when it hits zero,
// so refreshing or editing client state cannot earn more time.
// ============================================================

const STATUS_ENDPOINT = '/api/preview/status';
const SUBMIT_ENDPOINT = '/api/activation/submit';
const QR_SRC = '/payments/goodvibes-gcash-qr.jpg';

const FALLBACK_CONTACT = {
  brand: 'Goodvibes LTD',
  phone: '0968-184-1001',
  phone_intl: '+63 968 184 1001',
  email: 'markjohnsonbanatao888@gmail.com',
  watermark_text: 'PRIVATE DEMO · GOODVIBES LTD',
};

const peso = (centavos) => `₱${((centavos ?? 500000) / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
const mmss = (s) => {
  const m = Math.floor(Math.max(0, s) / 60);
  const sec = Math.max(0, s) % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};
const waLink = (contact) =>
  `https://wa.me/${(contact.phone_intl || '').replace(/[^\d]/g, '')}?text=${encodeURIComponent(
    'Hi Goodvibes LTD, I would like to activate my property website.',
  )}`;
const mailLink = (contact, subject) =>
  `mailto:${contact.email}?subject=${encodeURIComponent(subject)}`;

function Watermark({ text }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[45] overflow-hidden">
      <div className="absolute right-4 bottom-4 rounded-full bg-black/45 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white/90 backdrop-blur-sm">
        {text}
      </div>
    </div>
  );
}

function CountdownPill({ remaining }) {
  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-[46] -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-full bg-neutral-900/90 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-sm">
        <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
        Private website preview — {mmss(remaining)} remaining
      </div>
    </div>
  );
}

function ActivationForm({ contact, priceCentavos, slug, onActivated }) {
  const [form, setForm] = useState({ payer_name: '', payer_mobile: '', payer_email: '', gcash_reference_number: '' });
  const [receipt, setReceipt] = useState(null); // { base64, content_type, name }
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { status, message }
  const [error, setError] = useState('');

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      setError('Receipt image must be under 6 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setReceipt({ base64: reader.result, content_type: file.type, name: file.name });
    reader.readAsDataURL(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.gcash_reference_number.trim().length < 6) {
      setError('Enter the GCash reference number from your receipt.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(SUBMIT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          slug,
          ...form,
          receipt_base64: receipt?.base64,
          receipt_content_type: receipt?.content_type,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Something went wrong. Please try again.');
      } else if (data.status === 'active') {
        onActivated();
      } else {
        setResult(data);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="text-center">
        <Loader2 className="mx-auto mb-3 animate-spin text-neutral-700" size={28} />
        <h4 className="mb-2 text-lg font-semibold text-neutral-900">Verifying your payment</h4>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-neutral-600">{result.message}</p>
        <p className="mt-4 text-xs text-neutral-500">
          You can close this and return later — the website activates automatically once the GCash payment is confirmed.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Pay side */}
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Step 1 — Pay via GCash</p>
        <p className="mb-4 text-2xl font-semibold text-neutral-900">{peso(priceCentavos)}</p>
        <div className="mx-auto max-w-[220px] overflow-hidden rounded-lg bg-white p-2 shadow-sm">
          <img src={QR_SRC} alt="Goodvibes LTD GCash QR code" className="w-full" />
        </div>
        <ul className="mt-4 space-y-1 text-sm text-neutral-600">
          <li>Recipient: <span className="font-medium text-neutral-900">{contact.brand}</span></li>
          <li>GCash: <span className="font-medium text-neutral-900">{contact.phone}</span></li>
          <li>Amount: <span className="font-medium text-neutral-900">{peso(priceCentavos)}</span></li>
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-neutral-500">
          Scan with the GCash app and pay the exact amount. Keep the reference number shown on your receipt.
        </p>
      </div>

      {/* Confirm side */}
      <form onSubmit={submit} className="flex flex-col">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Step 2 — Submit your payment</p>
        <p className="mb-4 text-sm text-neutral-600">
          Enter your GCash reference number. We match it against the actual payment receipt and activate automatically —
          we never approve on a screenshot alone.
        </p>
        <div className="space-y-3">
          <input required placeholder="Your name" value={form.payer_name}
            onChange={(e) => setForm({ ...form, payer_name: e.target.value })}
            className="h-10 w-full rounded-md border border-neutral-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900" />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Mobile no." value={form.payer_mobile}
              onChange={(e) => setForm({ ...form, payer_mobile: e.target.value })}
              className="h-10 w-full rounded-md border border-neutral-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900" />
            <input type="email" placeholder="Email" value={form.payer_email}
              onChange={(e) => setForm({ ...form, payer_email: e.target.value })}
              className="h-10 w-full rounded-md border border-neutral-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900" />
          </div>
          <input required placeholder="GCash reference number" value={form.gcash_reference_number}
            onChange={(e) => setForm({ ...form, gcash_reference_number: e.target.value })}
            className="h-10 w-full rounded-md border border-neutral-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900" />
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-neutral-300 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50">
            <Upload size={16} />
            {receipt ? <span className="truncate text-neutral-900">{receipt.name}</span> : 'Attach receipt screenshot (optional)'}
            <input type="file" accept="image/*" onChange={onFile} className="hidden" />
          </label>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={submitting}
          className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-neutral-900 px-6 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50">
          {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting…</> : <>Submit payment for verification</>}
        </button>
      </form>
    </div>
  );
}

function LockModal({ contact, priceCentavos, slug, onActivated }) {
  const [view, setView] = useState('menu'); // 'menu' | 'activate'
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-neutral-950/70 p-4 backdrop-blur-md"
      role="dialog" aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl md:p-8"
      >
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-lg bg-neutral-900 p-2 text-white"><Lock size={20} /></div>
          <div>
            <h3 className="text-xl font-semibold text-neutral-900">Your private preview has ended</h3>
            <p className="mt-1 text-sm leading-relaxed text-neutral-600">
              This is a private demo of your property website by <span className="font-medium">{contact.brand}</span>.
              Activate it to make it your permanent public listing — the preview limit and watermark disappear for good.
            </p>
          </div>
        </div>

        {view === 'menu' ? (
          <>
            <button
              onClick={() => setView('activate')}
              className="mb-3 flex w-full items-center justify-between rounded-xl bg-neutral-900 px-5 py-4 text-left text-white transition-colors hover:bg-neutral-800"
            >
              <span className="flex items-center gap-3">
                <ShieldCheck size={20} />
                <span>
                  <span className="block font-medium">Activate this website</span>
                  <span className="block text-sm text-white/70">One-time {peso(priceCentavos)} via GCash</span>
                </span>
              </span>
              <span className="text-white/60">→</span>
            </button>
            <div className="grid gap-3 sm:grid-cols-3">
              <a href={waLink(contact)} target="_blank" rel="noreferrer"
                className="flex flex-col items-center gap-1 rounded-xl border border-neutral-200 px-3 py-4 text-center text-sm text-neutral-700 transition-colors hover:bg-neutral-50">
                <MessageCircle size={20} /> Message us
              </a>
              <a href={mailLink(contact, 'Goodvibes LTD — Property Website')}
                className="flex flex-col items-center gap-1 rounded-xl border border-neutral-200 px-3 py-4 text-center text-sm text-neutral-700 transition-colors hover:bg-neutral-50">
                <Mail size={20} /> Email us
              </a>
              <a href={mailLink(contact, 'Goodvibes LTD — Revision request')}
                className="flex flex-col items-center gap-1 rounded-xl border border-neutral-200 px-3 py-4 text-center text-sm text-neutral-700 transition-colors hover:bg-neutral-50">
                <PencilRuler size={20} /> Request revisions
              </a>
            </div>
            <p className="mt-5 text-center text-xs text-neutral-400">
              {contact.brand} · {contact.phone_intl} · {contact.email}
            </p>
          </>
        ) : (
          <>
            <ActivationForm contact={contact} priceCentavos={priceCentavos} slug={slug} onActivated={onActivated} />
            <button onClick={() => setView('menu')} className="mt-5 text-sm text-neutral-500 hover:text-neutral-800">
              ← Back
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function PreviewGate({ children, slug = 'lakeview-putatan' }) {
  const [gate, setGate] = useState({ phase: 'loading' }); // loading | preview | locked | active | open
  const [remaining, setRemaining] = useState(0);
  const [contact, setContact] = useState(FALLBACK_CONTACT);
  const [price, setPrice] = useState(500000);
  const tickRef = useRef(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${STATUS_ENDPOINT}?slug=${encodeURIComponent(slug)}`, { credentials: 'include' });
      if (!res.ok) throw new Error('status_error');
      const data = await res.json();
      if (data.contact) setContact(data.contact);
      if (data.price_centavos) setPrice(data.price_centavos);
      if (data.status === 'active') return setGate({ phase: 'active' });
      if (data.locked) return setGate({ phase: 'locked' });
      setRemaining(data.remaining_seconds ?? 0);
      setGate({ phase: 'preview' });
    } catch {
      // Fail OPEN: if the backend is unreachable/unconfigured, never hard-block
      // the property listing. Enforcement resumes when the API responds.
      setGate({ phase: 'open' });
    }
  }, [slug]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // Visual countdown; re-verify with the server on expiry.
  useEffect(() => {
    if (gate.phase !== 'preview') return undefined;
    tickRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(tickRef.current);
          fetchStatus(); // server decides locked/active
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [gate.phase, fetchStatus]);

  const blurred = gate.phase === 'locked';

  return (
    <>
      <div
        aria-hidden={blurred}
        className={blurred ? 'pointer-events-none select-none blur-sm' : undefined}
        style={blurred ? { filter: 'blur(6px)' } : undefined}
      >
        {children}
      </div>

      {gate.phase === 'preview' && (
        <>
          <CountdownPill remaining={remaining} />
          {contact.watermark_text && <Watermark text={contact.watermark_text} />}
        </>
      )}

      <AnimatePresence>
        {gate.phase === 'locked' && (
          <LockModal
            contact={contact}
            priceCentavos={price}
            slug={slug}
            onActivated={() => setGate({ phase: 'active' })}
          />
        )}
      </AnimatePresence>
    </>
  );
}
