// Server-side Supabase client using the SERVICE ROLE key.
// This key bypasses RLS and must NEVER be exposed to the browser — it is only
// read from server-only environment variables inside Vercel functions.
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let cached = null;

export function getServiceClient() {
  if (!url || !serviceKey) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables. ' +
        'Set them in the Vercel project settings (Server-side only).',
    );
  }
  if (!cached) {
    cached = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}

export const RECEIPTS_BUCKET = 'goodvibes-receipts';
