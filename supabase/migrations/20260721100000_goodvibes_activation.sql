-- Goodvibes LTD property website activation schema.
-- Applied to the RealMatch Supabase project.

alter table public.goodvibes_property_sites enable row level security;
alter table public.goodvibes_preview_sessions enable row level security;
alter table public.goodvibes_activation_orders enable row level security;
alter table public.goodvibes_gcash_payments enable row level security;

alter table public.goodvibes_activation_orders
  add column if not exists payment_datetime timestamptz,
  add column if not exists submission_reference text unique,
  add column if not exists consent_confirmed boolean not null default false;

create table if not exists public.goodvibes_admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid,
  property_site_id uuid references public.goodvibes_property_sites(id) on delete set null,
  activation_order_id uuid references public.goodvibes_activation_orders(id) on delete set null,
  action text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

alter table public.goodvibes_admin_audit_logs enable row level security;

create index if not exists goodvibes_preview_sessions_token_idx
  on public.goodvibes_preview_sessions(browser_token_hash);
create index if not exists goodvibes_activation_orders_site_status_idx
  on public.goodvibes_activation_orders(property_site_id, status);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'goodvibes-payment-receipts',
  'goodvibes-payment-receipts',
  false,
  5242880,
  array['image/jpeg','image/png','image/webp','application/pdf']
)
on conflict (id) do update
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "goodvibes admin read sites"
on public.goodvibes_property_sites for select to authenticated
using (lower(auth.jwt() ->> 'email') = 'markjohnsonbanatao888@gmail.com');

create policy "goodvibes admin update sites"
on public.goodvibes_property_sites for update to authenticated
using (lower(auth.jwt() ->> 'email') = 'markjohnsonbanatao888@gmail.com')
with check (lower(auth.jwt() ->> 'email') = 'markjohnsonbanatao888@gmail.com');

create policy "goodvibes admin read sessions"
on public.goodvibes_preview_sessions for select to authenticated
using (lower(auth.jwt() ->> 'email') = 'markjohnsonbanatao888@gmail.com');

create policy "goodvibes admin read orders"
on public.goodvibes_activation_orders for select to authenticated
using (lower(auth.jwt() ->> 'email') = 'markjohnsonbanatao888@gmail.com');

create policy "goodvibes admin update orders"
on public.goodvibes_activation_orders for update to authenticated
using (lower(auth.jwt() ->> 'email') = 'markjohnsonbanatao888@gmail.com')
with check (lower(auth.jwt() ->> 'email') = 'markjohnsonbanatao888@gmail.com');

create policy "goodvibes admin read payments"
on public.goodvibes_gcash_payments for select to authenticated
using (lower(auth.jwt() ->> 'email') = 'markjohnsonbanatao888@gmail.com');

create policy "goodvibes admin read audit"
on public.goodvibes_admin_audit_logs for select to authenticated
using (lower(auth.jwt() ->> 'email') = 'markjohnsonbanatao888@gmail.com');

create policy "goodvibes admin read receipts"
on storage.objects for select to authenticated
using (
  bucket_id = 'goodvibes-payment-receipts'
  and lower(auth.jwt() ->> 'email') = 'markjohnsonbanatao888@gmail.com'
);
