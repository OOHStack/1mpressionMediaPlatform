-- ============================================================
-- 1mpression Media Platform — Supabase Database Schema
-- Run this entire file in Supabase > SQL Editor > New Query
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- CLIENTS
-- ============================================================
create table if not exists clients (
  id            uuid primary key default uuid_generate_v4(),
  company       text not null,
  contact_name  text,
  email         text,
  phone         text,
  type          text check (type in ('agency','vendor','brand','partner','other')) default 'agency',
  billing_name  text,
  billing_email text,
  billing_address text,
  notes         text,
  preferred_workflow text,
  special_instructions text,
  is_active     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ============================================================
-- CONTACTS
-- ============================================================
create table if not exists contacts (
  id          uuid primary key default uuid_generate_v4(),
  client_id   uuid references clients(id) on delete cascade,
  name        text not null,
  title       text,
  email       text,
  phone       text,
  is_primary  boolean default false,
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ============================================================
-- CONTRACTORS
-- ============================================================
create table if not exists contractors (
  id                uuid primary key default uuid_generate_v4(),
  name              text not null,
  email             text,
  phone             text,
  city              text,
  province          text,
  markets           text[],
  services          text[],
  drone_capable     boolean default false,
  has_vehicle       boolean default false,
  day_rate          numeric(10,2),
  half_day_rate     numeric(10,2),
  hourly_rate       numeric(10,2),
  per_location_rate numeric(10,2),
  preferred_payment text check (preferred_payment in ('etransfer','paypal','cheque','direct_deposit','other')),
  payment_email     text,
  notes             text,
  portfolio_links   text[],
  reliability_rating int check (reliability_rating between 1 and 5),
  is_active         boolean default true,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ============================================================
-- CONTRACTOR SERVICES
-- ============================================================
create table if not exists contractor_services (
  id            uuid primary key default uuid_generate_v4(),
  contractor_id uuid references contractors(id) on delete cascade,
  service_type  text not null,
  rate          numeric(10,2),
  rate_unit     text check (rate_unit in ('day','half_day','hour','location','flat')),
  notes         text,
  created_at    timestamptz default now()
);

-- ============================================================
-- JOBS
-- ============================================================
create table if not exists jobs (
  id                  uuid primary key default uuid_generate_v4(),
  job_number          text unique,
  client_id           uuid references clients(id),
  contact_id          uuid references contacts(id),
  campaign_name       text not null,
  market              text,
  city                text,
  province            text,
  job_type            text check (job_type in (
    'photography','videography','drone_photography','drone_video',
    'monitoring','posting_confirmation','custom'
  )) default 'photography',
  status              text check (status in (
    'new_request','needs_review','quoted','approved','needs_assignment',
    'assigned','in_progress','captured','delivered','invoiced','paid','closed','cancelled'
  )) default 'new_request',
  shoot_date          date,
  shoot_time          text,
  delivery_deadline   date,
  shoot_requirements  text,
  deliverables_required text,
  client_price        numeric(10,2),
  contractor_budget   numeric(10,2),
  hst_applicable      boolean default true,
  internal_notes      text,
  source              text check (source in ('email','manual','referral','repeat','other')) default 'manual',
  email_intake_id     uuid,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- Auto-generate job number trigger
create or replace function generate_job_number()
returns trigger as $$
begin
  new.job_number := 'JOB-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('job_number_seq')::text, 4, '0');
  return new;
end;
$$ language plpgsql;

create sequence if not exists job_number_seq start 1001;

create trigger set_job_number
  before insert on jobs
  for each row
  when (new.job_number is null)
  execute function generate_job_number();

-- ============================================================
-- JOB LOCATIONS
-- ============================================================
create table if not exists job_locations (
  id           uuid primary key default uuid_generate_v4(),
  job_id       uuid references jobs(id) on delete cascade,
  name         text,
  address      text,
  city         text,
  board_id     text,
  screen_id    text,
  latitude     numeric(10,7),
  longitude    numeric(10,7),
  media_type   text,
  face_direction text,
  notes        text,
  sort_order   int default 0,
  created_at   timestamptz default now()
);

-- ============================================================
-- ASSIGNMENTS
-- ============================================================
create table if not exists assignments (
  id              uuid primary key default uuid_generate_v4(),
  job_id          uuid references jobs(id) on delete cascade,
  contractor_id   uuid references contractors(id),
  status          text check (status in (
    'draft','pending_send','sent','accepted','declined','cancelled','completed'
  )) default 'draft',
  agreed_rate     numeric(10,2),
  rate_unit       text check (rate_unit in ('day','half_day','hour','location','flat')),
  assignment_notes text,
  brief_generated boolean default false,
  brief_sent_at   timestamptz,
  accepted_at     timestamptz,
  declined_at     timestamptz,
  decline_reason  text,
  contractor_invoice_amount numeric(10,2),
  contractor_invoice_received_at timestamptz,
  contractor_paid_at timestamptz,
  payment_method  text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ============================================================
-- DELIVERABLES
-- ============================================================
create table if not exists deliverables (
  id                uuid primary key default uuid_generate_v4(),
  job_id            uuid references jobs(id) on delete cascade,
  assignment_id     uuid references assignments(id),
  type              text check (type in ('raw','edited','final','reference','other')),
  file_name         text,
  file_url          text,
  drive_link        text,
  dropbox_link      text,
  upload_source     text,
  status            text check (status in ('pending','uploaded','reviewed','approved','rejected','delivered')) default 'pending',
  client_delivery_date date,
  delivered_at      timestamptz,
  revision_notes    text,
  approved_at       timestamptz,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ============================================================
-- INVOICES
-- ============================================================
create table if not exists invoices (
  id              uuid primary key default uuid_generate_v4(),
  job_id          uuid references jobs(id),
  client_id       uuid references clients(id),
  invoice_number  text unique,
  type            text check (type in ('client','contractor')) default 'client',
  contractor_id   uuid references contractors(id),
  status          text check (status in ('draft','sent','viewed','partial','paid','overdue','cancelled')) default 'draft',
  subtotal        numeric(10,2) default 0,
  hst_amount      numeric(10,2) default 0,
  total_amount    numeric(10,2) default 0,
  amount_paid     numeric(10,2) default 0,
  issue_date      date,
  due_date        date,
  paid_date       date,
  payment_method  text,
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create sequence if not exists invoice_number_seq start 1001;

create or replace function generate_invoice_number()
returns trigger as $$
begin
  new.invoice_number := 'INV-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('invoice_number_seq')::text, 4, '0');
  return new;
end;
$$ language plpgsql;

create trigger set_invoice_number
  before insert on invoices
  for each row
  when (new.invoice_number is null)
  execute function generate_invoice_number();

-- ============================================================
-- EXPENSES
-- ============================================================
create table if not exists expenses (
  id          uuid primary key default uuid_generate_v4(),
  job_id      uuid references jobs(id) on delete cascade,
  category    text check (category in ('contractor','editing','travel','equipment','other')),
  description text,
  amount      numeric(10,2) default 0,
  paid_at     timestamptz,
  receipt_url text,
  notes       text,
  created_at  timestamptz default now()
);

-- ============================================================
-- PAYMENTS
-- ============================================================
create table if not exists payments (
  id             uuid primary key default uuid_generate_v4(),
  invoice_id     uuid references invoices(id),
  amount         numeric(10,2) not null,
  payment_date   date not null,
  payment_method text,
  reference      text,
  notes          text,
  created_at     timestamptz default now()
);

-- ============================================================
-- EMAIL INTAKE
-- ============================================================
create table if not exists email_intake (
  id                  uuid primary key default uuid_generate_v4(),
  gmail_message_id    text unique,
  gmail_thread_id     text,
  from_name           text,
  from_email          text,
  subject             text,
  body_text           text,
  body_html           text,
  received_at         timestamptz,
  status              text check (status in ('unread','reviewing','converted','ignored','spam')) default 'unread',
  ai_summary          text,
  ai_extracted_client text,
  ai_extracted_company text,
  ai_extracted_campaign text,
  ai_extracted_market text,
  ai_extracted_shoot_date text,
  ai_extracted_deadline text,
  ai_extracted_budget text,
  ai_extracted_deliverables text,
  ai_missing_info     text[],
  ai_confidence       numeric(3,2),
  converted_job_id    uuid references jobs(id),
  converted_at        timestamptz,
  raw_headers         jsonb,
  attachments         jsonb,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ============================================================
-- TASKS
-- ============================================================
create table if not exists tasks (
  id            uuid primary key default uuid_generate_v4(),
  job_id        uuid references jobs(id) on delete cascade,
  client_id     uuid references clients(id),
  contractor_id uuid references contractors(id),
  type          text check (type in (
    'follow_up_client','assign_contractor','shoot_due','deliver_files',
    'send_invoice','pay_contractor','follow_up_invoice','other'
  )),
  title         text not null,
  description   text,
  due_date      date,
  status        text check (status in ('pending','in_progress','completed','cancelled')) default 'pending',
  priority      text check (priority in ('low','medium','high','urgent')) default 'medium',
  completed_at  timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ============================================================
-- NOTES
-- ============================================================
create table if not exists notes (
  id            uuid primary key default uuid_generate_v4(),
  job_id        uuid references jobs(id) on delete cascade,
  client_id     uuid references clients(id),
  contractor_id uuid references contractors(id),
  content       text not null,
  author        text,
  created_at    timestamptz default now()
);

-- ============================================================
-- FILES
-- ============================================================
create table if not exists files (
  id            uuid primary key default uuid_generate_v4(),
  job_id        uuid references jobs(id),
  deliverable_id uuid references deliverables(id),
  name          text not null,
  url           text not null,
  type          text,
  size_bytes    bigint,
  storage_path  text,
  created_at    timestamptz default now()
);

-- ============================================================
-- ACTIVITY LOG
-- ============================================================
create table if not exists activity_log (
  id          uuid primary key default uuid_generate_v4(),
  entity_type text not null,
  entity_id   uuid not null,
  action      text not null,
  description text,
  metadata    jsonb,
  created_at  timestamptz default now()
);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger clients_updated_at before update on clients for each row execute function update_updated_at();
create trigger contacts_updated_at before update on contacts for each row execute function update_updated_at();
create trigger contractors_updated_at before update on contractors for each row execute function update_updated_at();
create trigger jobs_updated_at before update on jobs for each row execute function update_updated_at();
create trigger assignments_updated_at before update on assignments for each row execute function update_updated_at();
create trigger deliverables_updated_at before update on deliverables for each row execute function update_updated_at();
create trigger invoices_updated_at before update on invoices for each row execute function update_updated_at();
create trigger tasks_updated_at before update on tasks for each row execute function update_updated_at();
create trigger email_intake_updated_at before update on email_intake for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (enable — admin bypasses via service role)
-- ============================================================
alter table clients enable row level security;
alter table contacts enable row level security;
alter table contractors enable row level security;
alter table contractor_services enable row level security;
alter table jobs enable row level security;
alter table job_locations enable row level security;
alter table assignments enable row level security;
alter table deliverables enable row level security;
alter table invoices enable row level security;
alter table expenses enable row level security;
alter table payments enable row level security;
alter table email_intake enable row level security;
alter table tasks enable row level security;
alter table notes enable row level security;
alter table files enable row level security;
alter table activity_log enable row level security;

-- Policy: authenticated users can do everything (admin-only app for now)
create policy "authenticated_all" on clients for all to authenticated using (true) with check (true);
create policy "authenticated_all" on contacts for all to authenticated using (true) with check (true);
create policy "authenticated_all" on contractors for all to authenticated using (true) with check (true);
create policy "authenticated_all" on contractor_services for all to authenticated using (true) with check (true);
create policy "authenticated_all" on jobs for all to authenticated using (true) with check (true);
create policy "authenticated_all" on job_locations for all to authenticated using (true) with check (true);
create policy "authenticated_all" on assignments for all to authenticated using (true) with check (true);
create policy "authenticated_all" on deliverables for all to authenticated using (true) with check (true);
create policy "authenticated_all" on invoices for all to authenticated using (true) with check (true);
create policy "authenticated_all" on expenses for all to authenticated using (true) with check (true);
create policy "authenticated_all" on payments for all to authenticated using (true) with check (true);
create policy "authenticated_all" on email_intake for all to authenticated using (true) with check (true);
create policy "authenticated_all" on tasks for all to authenticated using (true) with check (true);
create policy "authenticated_all" on notes for all to authenticated using (true) with check (true);
create policy "authenticated_all" on files for all to authenticated using (true) with check (true);
create policy "authenticated_all" on activity_log for all to authenticated using (true) with check (true);

-- ============================================================
-- INDEXES for common queries
-- ============================================================
create index if not exists jobs_client_id_idx on jobs(client_id);
create index if not exists jobs_status_idx on jobs(status);
create index if not exists jobs_shoot_date_idx on jobs(shoot_date);
create index if not exists jobs_delivery_deadline_idx on jobs(delivery_deadline);
create index if not exists assignments_job_id_idx on assignments(job_id);
create index if not exists assignments_contractor_id_idx on assignments(contractor_id);
create index if not exists invoices_job_id_idx on invoices(job_id);
create index if not exists invoices_client_id_idx on invoices(client_id);
create index if not exists invoices_status_idx on invoices(status);
create index if not exists tasks_due_date_idx on tasks(due_date);
create index if not exists tasks_status_idx on tasks(status);
create index if not exists email_intake_status_idx on email_intake(status);
create index if not exists activity_log_entity_idx on activity_log(entity_type, entity_id);
