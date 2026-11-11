export interface User {
  id: string;
  email: string;
  fullName: string;
  isPlatformAdmin: boolean;
  emailVerified?: boolean;
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
  approval_status?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'ACTION_REQUIRED' | 'SUSPENDED';
  business_category?: string;
  country?: string;
  phone_e164?: string;
  website?: string;
  business_address?: string;
  intended_usage?: string;
  rejection_reason?: string;
  info_requested_details?: string;
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
  isCarousel?: boolean;
  cards?: Array<{
    cardIndex: number;
    headerType?: 'IMAGE' | 'VIDEO';
    headerUrl?: string;
    bodyText: string;
    buttons?: Array<{
      type: 'QUICK_REPLY' | 'URL';
      text: string;
      url?: string;
    }>;
  }>;
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
  control_mode?: 'bot_active' | 'human_controlled';
  pipeline_stage_id?: string;
  lead_status?: string;
  lead_value?: number;
}

export interface Message {
  id: string;
  phone_e164: string;
  direction: 'inbound' | 'outbound';
  message_type: 'template' | 'text' | 'image' | 'document' | 'interactive';
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

// Visual Flow / Chatbot Studio Types
export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label?: string;
    text?: string;
    question?: string;
    variable?: string;
    buttons?: string[];
    menuTitle?: string;
    menuSections?: Array<{ title: string; rows: Array<{ id: string; title: string; description?: string }> }>;
    tag?: string;
    stageId?: string;
    reason?: string;
    transferMessage?: string;
    conditionField?: string;
    conditionOperator?: string;
    conditionValue?: string;
    delaySeconds?: number;
    url?: string;
    method?: string;
    prompt?: string;
    [key: string]: any;
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  sourceHandle?: string;
}

export interface Chatbot {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  trigger_keyword?: string;
  is_active: number | boolean;
  version: number;
  execution_count: number;
  draft_nodes_json?: string;
  draft_edges_json?: string;
  published_nodes_json?: string;
  published_edges_json?: string;
  draftNodes?: FlowNode[];
  draftEdges?: FlowEdge[];
  publishedNodes?: FlowNode[];
  publishedEdges?: FlowEdge[];
  nodes?: FlowNode[];
  edges?: FlowEdge[];
  created_at: string;
  updated_at: string;
}

// CRM Pipeline & Activities
export interface PipelineStage {
  id: string;
  organization_id: string;
  name: string;
  order_index: number;
  color: string;
  is_default: number | boolean;
}

export interface CrmLead {
  id: string;
  organization_id: string;
  phone_e164: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  organization_name?: string;
  tags: string[];
  pipeline_stage_id?: string;
  lead_status: string;
  lead_value: number;
  lead_source?: string;
  assigned_agent_id?: string;
  assigned_agent_name?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CrmActivity {
  id: string;
  organization_id: string;
  contact_id: string;
  user_id?: string;
  user_name?: string;
  activity_type: 'call' | 'meeting' | 'note' | 'stage_change' | 'tag_added' | 'campaign_sent' | 'bot_interaction';
  title: string;
  description?: string;
  metadata?: any;
  created_at: string;
}

// Reply Rules
export interface ReplyRule {
  id: string;
  organization_id: string;
  name: string;
  trigger_keyword: string;
  match_type: 'contains' | 'exact' | 'starts_with';
  category?: string;
  add_tags_json?: string;
  pipeline_stage_id?: string;
  is_optout: number | boolean;
  is_active: number | boolean;
  priority: number;
  created_at: string;
}

