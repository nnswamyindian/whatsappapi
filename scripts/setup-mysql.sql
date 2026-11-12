-- ==============================================================================
-- GreenWave WhatsApp Business SaaS Platform — MySQL 8.0 Production Schema
-- Engine: InnoDB | Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS greenwave_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE greenwave_db;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Organizations (Tenants)
CREATE TABLE IF NOT EXISTS organizations (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(128) UNIQUE NOT NULL,
  timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  approval_status VARCHAR(32) NOT NULL DEFAULT 'APPROVED',
  plan_tier VARCHAR(32) NOT NULL DEFAULT 'starter',
  wallet_balance DECIMAL(12, 4) NOT NULL DEFAULT 25.0000,
  low_balance_threshold DECIMAL(12, 4) NOT NULL DEFAULT 5.0000,
  business_category VARCHAR(128),
  country VARCHAR(8),
  phone_e164 VARCHAR(32),
  contact_limit INT NOT NULL DEFAULT 1000,
  team_limit INT NOT NULL DEFAULT 3,
  campaign_limit INT NOT NULL DEFAULT 50,
  reviewed_by VARCHAR(255),
  reviewed_at VARCHAR(64),
  rejection_reason TEXT,
  info_requested_details TEXT,
  created_at VARCHAR(64) NOT NULL,
  updated_at VARCHAR(64) NOT NULL,
  INDEX idx_orgs_slug (slug),
  INDEX idx_orgs_status (status),
  INDEX idx_orgs_approval (approval_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Users
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  mfa_enabled TINYINT(1) NOT NULL DEFAULT 0,
  mfa_secret VARCHAR(128),
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  is_platform_admin TINYINT(1) NOT NULL DEFAULT 0,
  email_verified TINYINT(1) NOT NULL DEFAULT 0,
  email_verification_token VARCHAR(255),
  reset_password_token VARCHAR(255),
  reset_password_expires_at VARCHAR(64),
  created_at VARCHAR(64) NOT NULL,
  updated_at VARCHAR(64) NOT NULL,
  INDEX idx_users_email (email),
  INDEX idx_users_verify_token (email_verification_token),
  INDEX idx_users_reset_token (reset_password_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Memberships (RBAC Tenancy)
CREATE TABLE IF NOT EXISTS memberships (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  role VARCHAR(64) NOT NULL, -- owner, admin, campaign_manager, support_agent, analyst, billing_manager
  created_at VARCHAR(64) NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_org_user (organization_id, user_id),
  INDEX idx_memberships_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Invitations
CREATE TABLE IF NOT EXISTS invitations (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(64) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  created_at VARCHAR(64) NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  INDEX idx_invitations_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. WhatsApp Connections (Meta Cloud API / Sandbox)
CREATE TABLE IF NOT EXISTS whatsapp_connections (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL UNIQUE,
  provider VARCHAR(64) NOT NULL DEFAULT 'meta_cloud',
  mode VARCHAR(32) NOT NULL DEFAULT 'sandbox', -- 'live' or 'sandbox'
  waba_id VARCHAR(128),
  phone_number_id VARCHAR(128),
  display_phone_number VARCHAR(64),
  verified_name VARCHAR(255),
  access_token TEXT,
  webhook_verify_token VARCHAR(255),
  app_secret TEXT,
  quality_rating VARCHAR(32) NOT NULL DEFAULT 'GREEN',
  messaging_limit_tier VARCHAR(64) NOT NULL DEFAULT 'TIER_1K',
  status VARCHAR(32) NOT NULL DEFAULT 'disconnected',
  last_sync_at VARCHAR(64),
  created_at VARCHAR(64) NOT NULL,
  updated_at VARCHAR(64) NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  INDEX idx_waconn_org (organization_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Contacts
CREATE TABLE IF NOT EXISTS contacts (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  phone_e164 VARCHAR(32) NOT NULL,
  first_name VARCHAR(128),
  last_name VARCHAR(128),
  email VARCHAR(255),
  tags JSON NOT NULL,
  custom_fields JSON NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  pipeline_stage_id VARCHAR(64),
  lead_value DECIMAL(12, 2) DEFAULT 0.00,
  assigned_agent_id VARCHAR(64),
  assigned_agent_name VARCHAR(255),
  lead_source VARCHAR(64) DEFAULT 'whatsapp',
  campaign_id VARCHAR(64),
  created_at VARCHAR(64) NOT NULL,
  updated_at VARCHAR(64) NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  UNIQUE KEY uk_org_contact_phone (organization_id, phone_e164),
  INDEX idx_contacts_org_phone (organization_id, phone_e164),
  INDEX idx_contacts_org_status (organization_id, status),
  INDEX idx_contacts_stage (organization_id, pipeline_stage_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Consent Ledger
CREATE TABLE IF NOT EXISTS consent_ledger (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  contact_id VARCHAR(64) NOT NULL,
  phone_e164 VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL, -- 'opted_in', 'opted_out'
  purpose VARCHAR(64) NOT NULL, -- 'marketing', 'transactional', 'general'
  source VARCHAR(64) NOT NULL, -- 'website_form', 'inbound_message', 'csv_import', 'api'
  evidence TEXT,
  timestamp VARCHAR(64) NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  INDEX idx_consent_org_phone (organization_id, phone_e164)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Suppression List
CREATE TABLE IF NOT EXISTS suppression_list (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  phone_e164 VARCHAR(32) NOT NULL,
  reason VARCHAR(64) NOT NULL, -- 'user_optout', 'hard_bounce', 'compliance_block', 'spam_complaint'
  created_at VARCHAR(64) NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  UNIQUE KEY uk_suppression_org_phone (organization_id, phone_e164)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Saved Segments
CREATE TABLE IF NOT EXISTS segments (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  filter_criteria JSON NOT NULL,
  created_at VARCHAR(64) NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Contact Import Batches
CREATE TABLE IF NOT EXISTS contact_imports (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  total_rows INT NOT NULL DEFAULT 0,
  valid_rows INT NOT NULL DEFAULT 0,
  duplicate_rows INT NOT NULL DEFAULT 0,
  invalid_rows INT NOT NULL DEFAULT 0,
  suppressed_rows INT NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'processing',
  failed_records_json JSON,
  preset_name VARCHAR(128),
  created_at VARCHAR(64) NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Templates
CREATE TABLE IF NOT EXISTS templates (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL, -- 'MARKETING', 'UTILITY', 'AUTHENTICATION'
  language VARCHAR(32) NOT NULL DEFAULT 'en_US',
  header_type VARCHAR(32) NOT NULL DEFAULT 'NONE',
  header_content TEXT,
  body_text TEXT NOT NULL,
  footer_text TEXT,
  buttons_json JSON NOT NULL,
  variables_json JSON NOT NULL,
  is_carousel TINYINT(1) NOT NULL DEFAULT 0,
  cards_json JSON,
  status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
  meta_template_id VARCHAR(128),
  rejection_reason TEXT,
  created_at VARCHAR(64) NOT NULL,
  updated_at VARCHAR(64) NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  UNIQUE KEY uk_org_template_lang (organization_id, name, language),
  INDEX idx_templates_org_status (organization_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  template_id VARCHAR(64) NOT NULL,
  audience_type VARCHAR(64) NOT NULL DEFAULT 'all_contacts',
  audience_filter_json JSON NOT NULL,
  variable_mappings_json JSON NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  scheduled_at VARCHAR(64),
  timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
  total_recipients INT NOT NULL DEFAULT 0,
  eligible_recipients INT NOT NULL DEFAULT 0,
  excluded_recipients INT NOT NULL DEFAULT 0,
  sent_count INT NOT NULL DEFAULT 0,
  delivered_count INT NOT NULL DEFAULT 0,
  read_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  replied_count INT NOT NULL DEFAULT 0,
  estimated_cost DECIMAL(12, 4) NOT NULL DEFAULT 0.0000,
  actual_cost DECIMAL(12, 4) NOT NULL DEFAULT 0.0000,
  created_at VARCHAR(64) NOT NULL,
  updated_at VARCHAR(64) NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES templates(id),
  INDEX idx_campaigns_org_status (organization_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Campaign Recipients
CREATE TABLE IF NOT EXISTS campaign_recipients (
  id VARCHAR(64) PRIMARY KEY,
  campaign_id VARCHAR(64) NOT NULL,
  organization_id VARCHAR(64) NOT NULL,
  contact_id VARCHAR(64) NOT NULL,
  phone_e164 VARCHAR(32) NOT NULL,
  variables_applied_json JSON NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'queued',
  exclusion_reason TEXT,
  provider_message_id VARCHAR(128),
  error_message TEXT,
  sent_at VARCHAR(64),
  delivered_at VARCHAR(64),
  read_at VARCHAR(64),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  INDEX idx_camp_recip_status (campaign_id, status),
  INDEX idx_camp_recip_wamid (provider_message_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Messages Ledger
CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  conversation_id VARCHAR(64),
  contact_id VARCHAR(64),
  phone_e164 VARCHAR(32) NOT NULL,
  direction VARCHAR(32) NOT NULL, -- 'outbound', 'inbound'
  message_type VARCHAR(64) NOT NULL,
  body TEXT,
  media_url TEXT,
  template_name VARCHAR(255),
  template_category VARCHAR(64),
  status VARCHAR(32) NOT NULL DEFAULT 'queued',
  provider_message_id VARCHAR(128) UNIQUE,
  error_code VARCHAR(64),
  error_message TEXT,
  cost DECIMAL(12, 4) NOT NULL DEFAULT 0.0000,
  created_at VARCHAR(64) NOT NULL,
  updated_at VARCHAR(64) NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  INDEX idx_messages_org_phone (organization_id, phone_e164),
  INDEX idx_messages_wamid (provider_message_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Shared Team Inbox Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  contact_id VARCHAR(64) NOT NULL,
  phone_e164 VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'open',
  priority VARCHAR(32) NOT NULL DEFAULT 'medium',
  assigned_agent_id VARCHAR(64),
  assigned_team VARCHAR(128),
  last_message_at VARCHAR(64) NOT NULL,
  last_inbound_at VARCHAR(64),
  window_expires_at VARCHAR(64),
  unread_count INT NOT NULL DEFAULT 0,
  labels JSON NOT NULL,
  created_at VARCHAR(64) NOT NULL,
  updated_at VARCHAR(64) NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  UNIQUE KEY uk_org_contact_conv (organization_id, contact_id),
  INDEX idx_conv_org_status (organization_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Internal Notes
CREATE TABLE IF NOT EXISTS internal_notes (
  id VARCHAR(64) PRIMARY KEY,
  conversation_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at VARCHAR(64) NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Canned Quick Replies
CREATE TABLE IF NOT EXISTS canned_replies (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  shortcut VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at VARCHAR(64) NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Automations
CREATE TABLE IF NOT EXISTS automations (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active TINYINT(1) NOT NULL DEFAULT 0,
  trigger_type VARCHAR(64) NOT NULL,
  trigger_config_json JSON NOT NULL,
  flow_definition_json JSON NOT NULL,
  execution_count INT NOT NULL DEFAULT 0,
  created_at VARCHAR(64) NOT NULL,
  updated_at VARCHAR(64) NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. Automation Logs
CREATE TABLE IF NOT EXISTS automation_logs (
  id VARCHAR(64) PRIMARY KEY,
  automation_id VARCHAR(64) NOT NULL,
  organization_id VARCHAR(64) NOT NULL,
  contact_id VARCHAR(64),
  status VARCHAR(32) NOT NULL,
  steps_executed INT NOT NULL DEFAULT 0,
  error_details TEXT,
  started_at VARCHAR(64) NOT NULL,
  completed_at VARCHAR(64) NOT NULL,
  FOREIGN KEY (automation_id) REFERENCES automations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. API Keys
CREATE TABLE IF NOT EXISTS api_keys (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  key_prefix VARCHAR(32) NOT NULL,
  permissions JSON NOT NULL,
  last_used_at VARCHAR(64),
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  created_at VARCHAR(64) NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  INDEX idx_apikeys_hash (key_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. Cryptographic OTP Verifications
CREATE TABLE IF NOT EXISTS otp_verifications (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  phone_e164 VARCHAR(32) NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  expires_at VARCHAR(64) NOT NULL,
  attempts_remaining INT NOT NULL DEFAULT 3,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  resend_available_at VARCHAR(64) NOT NULL,
  created_at VARCHAR(64) NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  INDEX idx_otp_phone (organization_id, phone_e164)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 22. Wallet Ledger
CREATE TABLE IF NOT EXISTS wallet_ledger (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  amount DECIMAL(12, 4) NOT NULL,
  balance_after DECIMAL(12, 4) NOT NULL,
  transaction_type VARCHAR(64) NOT NULL,
  reference_id VARCHAR(128),
  description TEXT NOT NULL,
  created_at VARCHAR(64) NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 23. Rate Card
CREATE TABLE IF NOT EXISTS rate_card (
  id VARCHAR(64) PRIMARY KEY,
  category VARCHAR(64) NOT NULL,
  country_code VARCHAR(16) NOT NULL,
  provider_rate_usd DECIMAL(12, 4) NOT NULL,
  platform_fee_usd DECIMAL(12, 4) NOT NULL,
  effective_date VARCHAR(64) NOT NULL,
  INDEX idx_rate_cat_country (category, country_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 24. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64),
  user_id VARCHAR(64),
  user_email VARCHAR(255),
  action VARCHAR(128) NOT NULL,
  resource_type VARCHAR(128) NOT NULL,
  resource_id VARCHAR(128),
  details_json JSON,
  ip_address VARCHAR(64),
  created_at VARCHAR(64) NOT NULL,
  INDEX idx_audit_org (organization_id),
  INDEX idx_audit_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 25. Chatbots
CREATE TABLE IF NOT EXISTS chatbots (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_keyword VARCHAR(255),
  is_active TINYINT(1) NOT NULL DEFAULT 0,
  draft_nodes_json JSON NOT NULL,
  draft_edges_json JSON NOT NULL,
  published_nodes_json JSON NOT NULL,
  published_edges_json JSON NOT NULL,
  version INT NOT NULL DEFAULT 1,
  execution_count INT NOT NULL DEFAULT 0,
  created_at VARCHAR(64) NOT NULL,
  updated_at VARCHAR(64) NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  INDEX idx_chatbots_trigger (organization_id, trigger_keyword)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 26. Chatbot Sessions
CREATE TABLE IF NOT EXISTS chatbot_sessions (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  chatbot_id VARCHAR(64) NOT NULL,
  conversation_id VARCHAR(64) NOT NULL,
  contact_id VARCHAR(64) NOT NULL,
  current_node_id VARCHAR(64),
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  waiting_variable_name VARCHAR(128),
  variables_json JSON NOT NULL,
  expires_at VARCHAR(64),
  created_at VARCHAR(64) NOT NULL,
  updated_at VARCHAR(64) NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (chatbot_id) REFERENCES chatbots(id) ON DELETE CASCADE,
  UNIQUE KEY uk_session_org_conv (organization_id, conversation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 27. CRM Pipeline Stages
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  name VARCHAR(128) NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  color VARCHAR(32) NOT NULL DEFAULT '#16A34A',
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  created_at VARCHAR(64) NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  INDEX idx_stages_order (organization_id, order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 28. CRM Activities
CREATE TABLE IF NOT EXISTS crm_activities (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  contact_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64),
  user_name VARCHAR(255),
  activity_type VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  metadata_json JSON,
  created_at VARCHAR(64) NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  INDEX idx_activities_contact (contact_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 29. Reply Rules
CREATE TABLE IF NOT EXISTS reply_rules (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  trigger_keyword VARCHAR(255) NOT NULL,
  match_type VARCHAR(32) NOT NULL DEFAULT 'contains',
  category VARCHAR(64) NOT NULL DEFAULT 'Enquiry',
  add_tags_json JSON NOT NULL,
  move_pipeline_stage_id VARCHAR(64),
  assign_agent_id VARCHAR(64),
  create_task TEXT,
  is_optout TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  priority INT NOT NULL DEFAULT 10,
  created_at VARCHAR(64) NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  INDEX idx_reply_rules_org (organization_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 30. Campaign Attributions
CREATE TABLE IF NOT EXISTS campaign_attributions (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  campaign_id VARCHAR(64) NOT NULL,
  contact_id VARCHAR(64) NOT NULL,
  template_id VARCHAR(64),
  template_name VARCHAR(255),
  delivered TINYINT(1) NOT NULL DEFAULT 0,
  `read` TINYINT(1) NOT NULL DEFAULT 0,
  replied TINYINT(1) NOT NULL DEFAULT 0,
  pipeline_stage_id VARCHAR(64),
  conversion_value DECIMAL(12, 2) DEFAULT 0.00,
  conversion_recorded_at VARCHAR(64),
  attribution_model VARCHAR(64) NOT NULL DEFAULT 'last_touch',
  created_at VARCHAR(64) NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 31. Custom Roles
CREATE TABLE IF NOT EXISTS custom_roles (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  name VARCHAR(128) NOT NULL,
  description TEXT,
  permissions_json JSON NOT NULL,
  created_at VARCHAR(64) NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 32. Customer Applications (Super Admin Review)
CREATE TABLE IF NOT EXISTS customer_applications (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  business_name VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone_e164 VARCHAR(32) NOT NULL,
  country VARCHAR(8) NOT NULL,
  business_category VARCHAR(128) NOT NULL,
  website VARCHAR(255),
  business_address TEXT,
  intended_usage TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING_APPROVAL',
  rejection_reason TEXT,
  info_requested_details TEXT,
  info_submitted_details TEXT,
  admin_notes TEXT,
  reviewed_by VARCHAR(255),
  reviewed_at VARCHAR(64),
  created_at VARCHAR(64) NOT NULL,
  updated_at VARCHAR(64) NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_cust_app_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 33. Centralized Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(128) UNIQUE NOT NULL,
  subject VARCHAR(255) NOT NULL,
  html_content LONGTEXT NOT NULL,
  text_content LONGTEXT NOT NULL,
  category VARCHAR(64) NOT NULL DEFAULT 'transactional',
  variables_json JSON NOT NULL,
  is_system TINYINT(1) NOT NULL DEFAULT 1,
  created_at VARCHAR(64) NOT NULL,
  updated_at VARCHAR(64) NOT NULL,
  INDEX idx_email_tpl_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 34. Email Delivery Logs
CREATE TABLE IF NOT EXISTS email_logs (
  id VARCHAR(64) PRIMARY KEY,
  recipient VARCHAR(255) NOT NULL,
  template_slug VARCHAR(128) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'sent',
  error_message TEXT,
  metadata_json JSON,
  created_at VARCHAR(64) NOT NULL,
  INDEX idx_email_logs_recipient (recipient),
  INDEX idx_email_logs_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 35. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64),
  user_id VARCHAR(64),
  type VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(255),
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at VARCHAR(64) NOT NULL,
  INDEX idx_notifications_user_read (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 36. Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) UNIQUE NOT NULL,
  email_alerts TINYINT(1) NOT NULL DEFAULT 1,
  push_alerts TINYINT(1) NOT NULL DEFAULT 1,
  campaign_updates TINYINT(1) NOT NULL DEFAULT 1,
  chat_updates TINYINT(1) NOT NULL DEFAULT 1,
  security_alerts TINYINT(1) NOT NULL DEFAULT 1,
  updated_at VARCHAR(64) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 37. Push Subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  endpoint VARCHAR(512) UNIQUE NOT NULL,
  keys_json JSON NOT NULL,
  created_at VARCHAR(64) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 38. Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  slug VARCHAR(64) UNIQUE NOT NULL,
  description TEXT,
  monthly_price_usd DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  yearly_price_usd DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  contact_limit INT NOT NULL DEFAULT 1000,
  team_member_limit INT NOT NULL DEFAULT 3,
  campaign_limit INT NOT NULL DEFAULT 50,
  waba_limit INT NOT NULL DEFAULT 1,
  features_json JSON NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at VARCHAR(64) NOT NULL,
  updated_at VARCHAR(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 39. Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL UNIQUE,
  plan_id VARCHAR(64) NOT NULL,
  billing_cycle VARCHAR(32) NOT NULL DEFAULT 'monthly',
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  start_date VARCHAR(64) NOT NULL,
  renewal_date VARCHAR(64),
  trial_end_date VARCHAR(64),
  created_at VARCHAR(64) NOT NULL,
  updated_at VARCHAR(64) NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 40. Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  invoice_number VARCHAR(128) UNIQUE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'USD',
  status VARCHAR(32) NOT NULL DEFAULT 'paid',
  billing_reason TEXT NOT NULL,
  pdf_url TEXT,
  created_at VARCHAR(64) NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 41. Onboarding Checklists
CREATE TABLE IF NOT EXISTS onboarding_checklists (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  step_key VARCHAR(64) NOT NULL,
  is_completed TINYINT(1) NOT NULL DEFAULT 0,
  completed_at VARCHAR(64),
  completed_by VARCHAR(255),
  verification_data_json JSON,
  created_at VARCHAR(64) NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  UNIQUE KEY uk_org_step (organization_id, step_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 42. Lifecycle Dispatches (WhatsApp & Email Omnichannel Automations)
CREATE TABLE IF NOT EXISTS lifecycle_dispatches (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  recipient_phone VARCHAR(32),
  recipient_email VARCHAR(255),
  channel VARCHAR(32) NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message_preview TEXT NOT NULL,
  metadata_json JSON,
  status VARCHAR(32) NOT NULL DEFAULT 'delivered',
  dispatched_at VARCHAR(64) NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  INDEX idx_lifecycle_org (organization_id, event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

