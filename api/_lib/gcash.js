// Best-effort parser for GCash / InstaPay "You have received money" email
// receipts that GCash sends to the RECIPIENT.
//
// ⚠️  IMPORTANT: The exact wording/layout of these emails is not documented and
// varies. These heuristics MUST be tuned against a real sample receipt before
// relying on auto-verification. Feed a real email through parseGcashEmail() and
// adjust the regexes below. Until then, treat a parse with low confidence as
// "needs manual review" rather than auto-approving.

function stripHtml(input = '') {
  return String(input)
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

// "₱5,000.00" / "PHP 5,000.00" / "5,000.00" -> centavos (500000)
function extractAmountCentavos(text) {
  const patterns = [
    /(?:₱|php|p)\s*([\d,]+\.\d{2})/i,
    /amount[^\d]{0,20}([\d,]+\.\d{2})/i,
    /([\d,]+\.\d{2})/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const value = parseFloat(m[1].replace(/,/g, ''));
      if (!Number.isNaN(value) && value > 0) return Math.round(value * 100);
    }
  }
  return null;
}

// GCash reference numbers are typically a 12–13 digit numeric string, often
// labelled "Ref No." / "Reference No." Also allow InstaPay alphanumeric refs.
function extractReference(text) {
  const labelled =
    text.match(/ref(?:erence)?\s*(?:no\.?|number|#)?\s*[:\-]?\s*([A-Z0-9]{7,20})/i) ||
    text.match(/transaction\s*(?:id|no\.?|number)?\s*[:\-]?\s*([A-Z0-9]{7,20})/i);
  if (labelled) return labelled[1].toUpperCase();
  const bare = text.match(/\b(\d{12,13})\b/);
  return bare ? bare[1] : null;
}

function extractPayer(text) {
  const m =
    text.match(/from\s+([A-Z][A-Za-z.\-']+(?:\s+[A-Z][A-Za-z.\-']+){0,3})/) ||
    text.match(/sender[^A-Za-z]{0,10}([A-Z][A-Za-z.\-']+(?:\s+[A-Z][A-Za-z.\-']+){0,3})/i);
  return m ? m[1].trim() : null;
}

function extractReceivedAt(text) {
  // e.g. "Jul 21, 2026 9:41 AM" — fall back to now on failure.
  const m = text.match(/([A-Z][a-z]{2,8}\s+\d{1,2},?\s+\d{4}[^\n]{0,20}\d{1,2}:\d{2}\s*(?:AM|PM)?)/);
  if (m) {
    const d = new Date(m[1]);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return null;
}

// Accepts the plain text and/or HTML body of a receipt email.
export function parseGcashEmail({ text = '', html = '', subject = '' } = {}) {
  const body = `${subject} ${text} ${stripHtml(html)}`.trim();
  const reference_number = extractReference(body);
  const amount_centavos = extractAmountCentavos(body);
  const payer_name = extractPayer(body);
  const received_at = extractReceivedAt(body);

  // Confidence: we require at least a reference AND an amount to auto-verify.
  const confident = Boolean(reference_number && amount_centavos);

  return { reference_number, amount_centavos, payer_name, received_at, confident };
}
