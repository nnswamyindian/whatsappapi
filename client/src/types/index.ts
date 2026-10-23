export interface User {
  id: string;
  email: string;
  fullName: string;
  isPlatformAdmin: boolean;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  timezone?: string;
  plan_tier?: string;
  wallet_balance?: number;
  low_balance_threshold?: number;
  role?: string;
}

export interface WhatsAppConnection {
  id?: string;
  provider: string;
  mode: 'live' | 'sandbox';
  waba_id?: string;
  phone_number_id?: string;
  display_phone_number?: string;
  verified_name?: string;
  quality_rating: 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN';
  messaging_limit_tier: string;
  status: 'connected' | 'disconnected' | 'token_expired';
  last_sync_at?: string;
}

export interface Contact {
  id: string;
  phone_e164: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  tags: string[];
  customFields: Record<string, any>;
  status: 'active' | 'archived' | 'deleted';
  created_at: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  header_type: 'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  header_content?: string;
  body_text: string;
  footer_text?: string;
  buttons: Array<{ type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'; text: string; url?: string; phoneNumber?: string }>;
  variables: string[];
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PAUSED';
  rejection_reason?: string;
}

export interface Campaign {
  id: string;
  name: string;
  template_id: string;
  template_name?: string;
  template_category?: string;
  status: 'draft' | 'scheduled' | 'processing' | 'completed' | 'paused' | 'cancelled';
  scheduled_at?: string;
  total_recipients: number;
  eligible_recipients: number;
  excluded_recipients: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  replied_count: number;
  estimated_cost: number;
  actual_cost: number;
  created_at: string;
}

export interface Conversation {
  id: string;
  contact_id: string;
  phone_e164: string;
  first_name?: string;
  last_name?: string;
  status: 'open' | 'pending' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_agent_id?: string;
  assigned_agent_name?: string;
  assigned_team?: string;
  last_message_at: string;
  unread_count: number;
  labels: string[];
  contactTags: string[];
  is24HourWindowActive: boolean;
  windowExpiresInMinutes: number;
}

export interface Message {
  id: string;
  phone_e164: string;
  direction: 'inbound' | 'outbound';
  message_type: 'template' | 'text' | 'image' | 'document';
  body?: string;
  template_name?: string;
  status: 'queued' | 'processing' | 'accepted' | 'sent' | 'delivered' | 'read' | 'failed';
  provider_message_id?: string;
  created_at: string;
}

export interface InternalNote {
  id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export interface OnboardingStatus {
  steps: Array<{ id: number; title: string; completed: boolean; path: string }>;
  totalSteps: number;
  completedCount: number;
  percentComplete: number;
}
