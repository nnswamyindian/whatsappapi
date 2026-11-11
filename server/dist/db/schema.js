// GreenWave Relational Database Schema Definitions
export const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- Organizations (Tenants)
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  status TEXT NOT NULL DEFAULT 'active',
  plan_tier TEXT NOT NULL DEFAULT 'starter',
  wallet_balance REAL NOT NULL DEFAULT 25.00,
  low_balance_threshold REAL NOT NULL DEFAULT 5.00,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  mfa_enabled INTEGER NOT NULL DEFAULT 0,
  mfa_secret TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  is_platform_admin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Memberships (RBAC Tenancy)
CREATE TABLE IF NOT EXISTS memberships (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL, -- owner, admin, campaign_manager, support_agent, analyst, billing_manager
  created_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(organization_id, user_id)
);

-- Invitations
CREATE TABLE IF NOT EXISTS invitations (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- WhatsApp Connections (Meta Cloud API / Sandbox)
CREATE TABLE IF NOT EXISTS whatsapp_connections (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL DEFAULT 'meta_cloud',
  mode TEXT NOT NULL DEFAULT 'sandbox', -- 'live' or 'sandbox'
  waba_id TEXT,
  phone_number_id TEXT,
  display_phone_number TEXT,
  verified_name TEXT,
  access_token TEXT,
  webhook_verify_token TEXT,
  app_secret TEXT,
  quality_rating TEXT NOT NULL DEFAULT 'GREEN',
  messaging_limit_tier TEXT NOT NULL DEFAULT 'TIER_1K',
  status TEXT NOT NULL DEFAULT 'disconnected',
  last_sync_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Contacts
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  phone_e164 TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  tags TEXT NOT NULL DEFAULT '[]', -- JSON array
  custom_fields TEXT NOT NULL DEFAULT '{}', -- JSON object
  status TEXT NOT NULL DEFAULT 'active', -- active, archived, deleted
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  UNIQUE(organization_id, phone_e164)
);

CREATE INDEX IF NOT EXISTS idx_contacts_org_phone ON contacts(organization_id, phone_e164);
CREATE INDEX IF NOT EXISTS idx_contacts_org_status ON contacts(organization_id, status);

-- Consent Ledger
CREATE TABLE IF NOT EXISTS consent_ledger (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  phone_e164 TEXT NOT NULL,
  status TEXT NOT NULL, -- 'opted_in', 'opted_out'
  purpose TEXT NOT NULL, -- 'marketing', 'transactional', 'general'
  source TEXT NOT NULL, -- 'website_form', 'inbound_message', 'csv_import', 'api'
  evidence TEXT,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_consent_org_phone ON consent_ledger(organization_id, phone_e164);

-- Suppression List
CREATE TABLE IF NOT EXISTS suppression_list (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  phone_e164 TEXT NOT NULL,
  reason TEXT NOT NULL, -- 'user_optout', 'hard_bounce', 'compliance_block', 'spam_complaint'
  created_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  UNIQUE(organization_id, phone_e164)
);

-- Saved Segments
CREATE TABLE IF NOT EXISTS segments (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  filter_criteria TEXT NOT NULL DEFAULT '{}', -- JSON filter
  created_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Contact Import Batches
CREATE TABLE IF NOT EXISTS contact_imports (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  valid_rows INTEGER NOT NULL DEFAULT 0,
  duplicate_rows INTEGER NOT NULL DEFAULT 0,
  invalid_rows INTEGER NOT NULL DEFAULT 0,
  suppressed_rows INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing',
  failed_records_json TEXT DEFAULT '[]',
  created_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Templates
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'MARKETING', 'UTILITY', 'AUTHENTICATION'
  language TEXT NOT NULL DEFAULT 'en_US',
  header_type TEXT NOT NULL DEFAULT 'NONE', -- 'NONE', 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'
  header_content TEXT,
  body_text TEXT NOT NULL,
  footer_text TEXT,
  buttons_json TEXT NOT NULL DEFAULT '[]',
  variables_json TEXT NOT NULL DEFAULT '[]',
  is_carousel INTEGER NOT NULL DEFAULT 0,
  cards_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PAUSED'
  meta_template_id TEXT,
  rejection_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  UNIQUE(organization_id, name, language)
);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  template_id TEXT NOT NULL,
  audience_type TEXT NOT NULL DEFAULT 'all_contacts',
  audience_filter_json TEXT NOT NULL DEFAULT '{}',
  variable_mappings_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'scheduled', 'processing', 'completed', 'paused', 'cancelled'
  scheduled_at TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  total_recipients INTEGER NOT NULL DEFAULT 0,
  eligible_recipients INTEGER NOT NULL DEFAULT 0,
  excluded_recipients INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  read_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  replied_count INTEGER NOT NULL DEFAULT 0,
  estimated_cost REAL NOT NULL DEFAULT 0.0,
  actual_cost REAL NOT NULL DEFAULT 0.0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES templates(id)
);

CREATE INDEX IF NOT EXISTS idx_campaigns_org_status ON campaigns(organization_id, status);

-- Campaign Recipients
CREATE TABLE IF NOT EXISTS campaign_recipients (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  phone_e164 TEXT NOT NULL,
  variables_applied_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'queued', -- 'queued', 'processing', 'accepted', 'sent', 'delivered', 'read', 'failed', 'excluded'
  exclusion_reason TEXT,
  provider_message_id TEXT,
  error_message TEXT,
  sent_at TEXT,
  delivered_at TEXT,
  read_at TEXT,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_camp_recip_camp ON campaign_recipients(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_camp_recip_wamid ON campaign_recipients(provider_message_id);

-- Unified Messages Ledger
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  conversation_id TEXT,
  contact_id TEXT,
  phone_e164 TEXT NOT NULL,
  direction TEXT NOT NULL, -- 'outbound', 'inbound'
  message_type TEXT NOT NULL, -- 'template', 'text', 'image', 'document', 'interactive'
  body TEXT,
  media_url TEXT,
  template_name TEXT,
  template_category TEXT,
  status TEXT NOT NULL DEFAULT 'queued', -- 'queued', 'processing', 'accepted', 'sent', 'delivered', 'read', 'failed'
  provider_message_id TEXT UNIQUE,
  error_code TEXT,
  error_message TEXT,
  cost REAL NOT NULL DEFAULT 0.0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_org_phone ON messages(organization_id, phone_e164);
CREATE INDEX IF NOT EXISTS idx_messages_wamid ON messages(provider_message_id);

-- Shared Team Inbox Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  phone_e164 TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'pending', 'resolved'
  priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  assigned_agent_id TEXT,
  assigned_team TEXT,
  last_message_at TEXT NOT NULL,
  last_inbound_at TEXT,
  window_expires_at TEXT,
  unread_count INTEGER NOT NULL DEFAULT 0,
  labels TEXT NOT NULL DEFAULT '[]', -- JSON array
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  UNIQUE(organization_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_org_status ON conversations(organization_id, status);

-- Internal Notes (Strictly hidden from customers)
CREATE TABLE IF NOT EXISTS internal_notes (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Canned Quick Replies
CREATE TABLE IF NOT EXISTS canned_replies (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  shortcut TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Visual Automations
CREATE TABLE IF NOT EXISTS automations (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 0,
  trigger_type TEXT NOT NULL, -- 'message_received', 'contact_created', 'tag_added', 'webhook'
  trigger_config_json TEXT NOT NULL DEFAULT '{}',
  flow_definition_json TEXT NOT NULL DEFAULT '[]',
  execution_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Automation Execution Logs
CREATE TABLE IF NOT EXISTS automation_logs (
  id TEXT PRIMARY KEY,
  automation_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  contact_id TEXT,
  status TEXT NOT NULL, -- 'success', 'failed', 'halted'
  steps_executed INTEGER NOT NULL DEFAULT 0,
  error_details TEXT,
  started_at TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  FOREIGN KEY (automation_id) REFERENCES automations(id) ON DELETE CASCADE
);

-- Developer Scoped API Keys
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT UNIQUE NOT NULL,
  key_prefix TEXT NOT NULL,
  permissions TEXT NOT NULL DEFAULT '["messages:send","otp:verify","reports:read"]',
  last_used_at TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Cryptographic OTP Verifications
CREATE TABLE IF NOT EXISTS otp_verifications (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  phone_e164 TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  attempts_remaining INTEGER NOT NULL DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'verified', 'expired', 'locked'
  resend_available_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Wallet Ledger & Usage Reconciliation
CREATE TABLE IF NOT EXISTS wallet_ledger (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  amount REAL NOT NULL,
  balance_after REAL NOT NULL,
  transaction_type TEXT NOT NULL, -- 'topup', 'campaign_deduction', 'api_deduction', 'adjustment'
  reference_id TEXT,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Effective-Dated Rate Card
CREATE TABLE IF NOT EXISTS rate_card (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL, -- 'MARKETING', 'UTILITY', 'AUTHENTICATION', 'SERVICE'
  country_code TEXT NOT NULL, -- 'IN', 'US', 'GB', 'DEFAULT'
  provider_rate_usd REAL NOT NULL,
  platform_fee_usd REAL NOT NULL,
  effective_date TEXT NOT NULL
);

-- Security and Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  organization_id TEXT,
  user_id TEXT,
  user_email TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details_json TEXT NOT NULL DEFAULT '{}',
  ip_address TEXT,
  created_at TEXT NOT NULL
);

-- Visual Chatbots & Interactive Node-Based Workflows
CREATE TABLE IF NOT EXISTS chatbots (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_keyword TEXT,
  is_active INTEGER NOT NULL DEFAULT 0,
  draft_nodes_json TEXT NOT NULL DEFAULT '[]',
  draft_edges_json TEXT NOT NULL DEFAULT '[]',
  published_nodes_json TEXT NOT NULL DEFAULT '[]',
  published_edges_json TEXT NOT NULL DEFAULT '[]',
  version INTEGER NOT NULL DEFAULT 1,
  execution_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Active Chatbot Conversation Sessions (Persistent State Machine)
CREATE TABLE IF NOT EXISTS chatbot_sessions (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  chatbot_id TEXT NOT NULL,
  conversation_id TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  current_node_id TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'waiting_for_input', 'human_takeover', 'completed', 'failed'
  waiting_variable_name TEXT,
  variables_json TEXT NOT NULL DEFAULT '{}',
  expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (chatbot_id) REFERENCES chatbots(id) ON DELETE CASCADE,
  UNIQUE(organization_id, conversation_id)
);

-- CRM Pipeline Stages
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#16A34A',
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- CRM Activities & Timeline Log
CREATE TABLE IF NOT EXISTS crm_activities (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  user_id TEXT,
  user_name TEXT,
  activity_type TEXT NOT NULL, -- 'note', 'call', 'meeting', 'status_change', 'campaign_sent', 'reply_received'
  title TEXT NOT NULL,
  description TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

-- Automatic Reply Classification & Intelligent Tagging Rules
CREATE TABLE IF NOT EXISTS reply_rules (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  trigger_keyword TEXT NOT NULL,
  match_type TEXT NOT NULL DEFAULT 'contains', -- 'contains', 'exact', 'starts_with', 'intent'
  category TEXT NOT NULL DEFAULT 'Enquiry', -- 'Pricing Enquiry', 'Purchase Intent', 'Support Request', 'Complaint', 'Opt Out'
  add_tags_json TEXT NOT NULL DEFAULT '[]',
  move_pipeline_stage_id TEXT,
  assign_agent_id TEXT,
  create_task TEXT,
  is_optout INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  priority INTEGER NOT NULL DEFAULT 10,
  created_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Campaign-to-CRM Attribution
CREATE TABLE IF NOT EXISTS campaign_attributions (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  template_id TEXT,
  template_name TEXT,
  delivered INTEGER NOT NULL DEFAULT 0,
  read INTEGER NOT NULL DEFAULT 0,
  replied INTEGER NOT NULL DEFAULT 0,
  pipeline_stage_id TEXT,
  conversion_value REAL DEFAULT 0.0,
  conversion_recorded_at TEXT,
  attribution_model TEXT NOT NULL DEFAULT 'last_touch',
  created_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

-- Custom Roles with Granular Permissions
CREATE TABLE IF NOT EXISTS custom_roles (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  permissions_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Customer Applications for Platform Approval Workflow
CREATE TABLE IF NOT EXISTS customer_applications (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_e164 TEXT NOT NULL,
  country TEXT NOT NULL,
  business_category TEXT NOT NULL,
  website TEXT,
  business_address TEXT,
  intended_usage TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL', -- 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ACTION_REQUIRED', 'SUSPENDED'
  rejection_reason TEXT,
  info_requested_details TEXT,
  info_submitted_details TEXT,
  admin_notes TEXT,
  reviewed_by TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cust_app_status ON customer_applications(status);

-- Centralized Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'transactional',
  variables_json TEXT NOT NULL DEFAULT '[]',
  is_system INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Email Delivery Logs & Telemetry
CREATE TABLE IF NOT EXISTS email_logs (
  id TEXT PRIMARY KEY,
  recipient TEXT NOT NULL,
  template_slug TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent', -- 'queued', 'sent', 'failed', 'delivered'
  error_message TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient);

-- In-App & Multi-Tenant Notification System
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  organization_id TEXT,
  user_id TEXT,
  type TEXT NOT NULL, -- 'registration', 'approval', 'whatsapp', 'campaign', 'billing', 'security', 'system'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);

-- User Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  email_alerts INTEGER NOT NULL DEFAULT 1,
  push_alerts INTEGER NOT NULL DEFAULT 1,
  campaign_updates INTEGER NOT NULL DEFAULT 1,
  chat_updates INTEGER NOT NULL DEFAULT 1,
  security_alerts INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Web Push / PWA Push Subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  endpoint TEXT UNIQUE NOT NULL,
  keys_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Platform Subscription Plans (Configurable by Super Admin)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  monthly_price_usd REAL NOT NULL DEFAULT 0.0,
  yearly_price_usd REAL NOT NULL DEFAULT 0.0,
  contact_limit INTEGER NOT NULL DEFAULT 1000,
  team_member_limit INTEGER NOT NULL DEFAULT 3,
  campaign_limit INTEGER NOT NULL DEFAULT 50,
  waba_limit INTEGER NOT NULL DEFAULT 1,
  features_json TEXT NOT NULL DEFAULT '[]',
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Active Organization Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL UNIQUE,
  plan_id TEXT NOT NULL,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly', -- 'monthly', 'yearly'
  status TEXT NOT NULL DEFAULT 'active', -- 'trial', 'active', 'past_due', 'canceled', 'expired'
  start_date TEXT NOT NULL,
  renewal_date TEXT,
  trial_end_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
);

-- Invoices & Billing Statements
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'paid', -- 'paid', 'pending', 'failed'
  billing_reason TEXT NOT NULL,
  pdf_url TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Guided 12-Step Onboarding Checklists
CREATE TABLE IF NOT EXISTS onboarding_checklists (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  step_key TEXT NOT NULL,
  is_completed INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  completed_by TEXT,
  verification_data_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  UNIQUE(organization_id, step_key)
);
`;
