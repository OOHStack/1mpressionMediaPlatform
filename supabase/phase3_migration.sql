-- ============================================================
-- Phase 3 migration — run in Supabase SQL Editor
-- ============================================================

-- App-level key/value settings (used for Gmail OAuth tokens, sync state, etc.)
create table if not exists app_settings (
  key         text primary key,
  value       jsonb not null default '{}',
  updated_at  timestamptz default now()
);

-- Only authenticated users can read/write settings (admin-only app)
alter table app_settings enable row level security;
create policy "authenticated_all" on app_settings
  for all to authenticated using (true) with check (true);

-- Index on email_intake for faster Gmail dedup lookup
create index if not exists email_intake_gmail_msg_id_idx
  on email_intake(gmail_message_id)
  where gmail_message_id is not null;
