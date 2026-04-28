// ============================================================
// Core domain types for 1mpression Media Platform
// ============================================================

export type ClientType = 'agency' | 'vendor' | 'brand' | 'partner' | 'other';

export type JobType =
  | 'photography'
  | 'videography'
  | 'drone_photography'
  | 'drone_video'
  | 'monitoring'
  | 'posting_confirmation'
  | 'custom';

export type JobStatus =
  | 'new_request'
  | 'needs_review'
  | 'quoted'
  | 'approved'
  | 'needs_assignment'
  | 'assigned'
  | 'in_progress'
  | 'captured'
  | 'delivered'
  | 'invoiced'
  | 'paid'
  | 'closed'
  | 'cancelled';

export type AssignmentStatus =
  | 'draft'
  | 'pending_send'
  | 'sent'
  | 'accepted'
  | 'declined'
  | 'cancelled'
  | 'completed';

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'partial'
  | 'paid'
  | 'overdue'
  | 'cancelled';

export type TaskType =
  | 'follow_up_client'
  | 'assign_contractor'
  | 'shoot_due'
  | 'deliver_files'
  | 'send_invoice'
  | 'pay_contractor'
  | 'follow_up_invoice'
  | 'other';

export type EmailIntakeStatus = 'unread' | 'reviewing' | 'converted' | 'ignored' | 'spam';

// ============================================================
// Database row types
// ============================================================

export interface Client {
  id: string;
  company: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  type: ClientType;
  billing_name: string | null;
  billing_email: string | null;
  billing_address: string | null;
  notes: string | null;
  preferred_workflow: string | null;
  special_instructions: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  client_id: string;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contractor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  province: string | null;
  markets: string[] | null;
  services: string[] | null;
  drone_capable: boolean;
  has_vehicle: boolean;
  day_rate: number | null;
  half_day_rate: number | null;
  hourly_rate: number | null;
  per_location_rate: number | null;
  preferred_payment: string | null;
  payment_email: string | null;
  notes: string | null;
  portfolio_links: string[] | null;
  reliability_rating: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  job_number: string | null;
  client_id: string | null;
  contact_id: string | null;
  campaign_name: string;
  market: string | null;
  city: string | null;
  province: string | null;
  job_type: JobType;
  status: JobStatus;
  shoot_date: string | null;
  shoot_time: string | null;
  delivery_deadline: string | null;
  shoot_requirements: string | null;
  deliverables_required: string | null;
  client_price: number | null;
  contractor_budget: number | null;
  hst_applicable: boolean;
  internal_notes: string | null;
  source: string | null;
  email_intake_id: string | null;
  created_at: string;
  updated_at: string;
  // joined
  client?: Client;
}

export interface JobLocation {
  id: string;
  job_id: string;
  name: string | null;
  address: string | null;
  city: string | null;
  board_id: string | null;
  screen_id: string | null;
  latitude: number | null;
  longitude: number | null;
  media_type: string | null;
  face_direction: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
}

export interface Assignment {
  id: string;
  job_id: string;
  contractor_id: string | null;
  status: AssignmentStatus;
  agreed_rate: number | null;
  rate_unit: string | null;
  assignment_notes: string | null;
  brief_generated: boolean;
  brief_sent_at: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  decline_reason: string | null;
  contractor_invoice_amount: number | null;
  contractor_invoice_received_at: string | null;
  contractor_paid_at: string | null;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
  // joined
  contractor?: Contractor;
  job?: Job;
}

export interface Deliverable {
  id: string;
  job_id: string;
  assignment_id: string | null;
  type: 'raw' | 'edited' | 'final' | 'reference' | 'other' | null;
  file_name: string | null;
  file_url: string | null;
  drive_link: string | null;
  dropbox_link: string | null;
  upload_source: string | null;
  status: 'pending' | 'uploaded' | 'reviewed' | 'approved' | 'rejected' | 'delivered';
  client_delivery_date: string | null;
  delivered_at: string | null;
  revision_notes: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  job_id: string | null;
  client_id: string | null;
  invoice_number: string | null;
  type: 'client' | 'contractor';
  contractor_id: string | null;
  status: InvoiceStatus;
  subtotal: number;
  hst_amount: number;
  total_amount: number;
  amount_paid: number;
  issue_date: string | null;
  due_date: string | null;
  paid_date: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // joined
  client?: Client;
  job?: Job;
  contractor?: Contractor;
}

export interface Expense {
  id: string;
  job_id: string;
  category: 'contractor' | 'editing' | 'travel' | 'equipment' | 'other' | null;
  description: string | null;
  amount: number;
  paid_at: string | null;
  receipt_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  job_id: string | null;
  client_id: string | null;
  contractor_id: string | null;
  type: TaskType | null;
  title: string;
  description: string | null;
  due_date: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // joined
  job?: Job;
}

export interface EmailIntake {
  id: string;
  gmail_message_id: string | null;
  gmail_thread_id: string | null;
  from_name: string | null;
  from_email: string | null;
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  received_at: string | null;
  status: EmailIntakeStatus;
  ai_summary: string | null;
  ai_extracted_client: string | null;
  ai_extracted_company: string | null;
  ai_extracted_campaign: string | null;
  ai_extracted_market: string | null;
  ai_extracted_shoot_date: string | null;
  ai_extracted_deadline: string | null;
  ai_extracted_budget: string | null;
  ai_extracted_deliverables: string | null;
  ai_missing_info: string[] | null;
  ai_confidence: number | null;
  converted_job_id: string | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// UI / helper types
// ============================================================

export interface DashboardStats {
  newRequests: number;
  needsAssignment: number;
  inProgress: number;
  dueTodayCount: number;
  dueTomorrowCount: number;
  dueThisWeekCount: number;
  overdueCount: number;
  unpaidClientInvoices: number;
  unpaidClientTotal: number;
  unpaidContractorPayables: number;
  recentDeliverables: Deliverable[];
  lowMarginJobs: Job[];
}
