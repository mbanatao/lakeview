create table if not exists public.goodvibes_email_notifications (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  recipient text not null,
  subject text not null,
  status text not null default 'pending',
  provider_message_id text,
  error_message text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

alter table public.goodvibes_email_notifications enable row level security;
revoke all on public.goodvibes_email_notifications from anon, authenticated;
