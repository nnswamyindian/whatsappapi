export interface SendMessageOptions {
  toPhoneE164: string;
  type: 'template' | 'text' | 'image' | 'document';
  template?: {
    name: string;
    language: string;
    components?: Array<{
      type: 'header' | 'body' | 'button';
      sub_type?: 'url' | 'quick_reply';
      index?: string;
      parameters: Array<{
        type: 'text' | 'currency' | 'date_time' | 'image' | 'document';
        text?: string;
        image?: { link: string };
        document?: { link: string; filename?: string };
      }>;
    }>;
  };
  text?: {
    body: string;
    preview_url?: boolean;
  };
  media?: {
    link: string;
    caption?: string;
    filename?: string;
  };
}

export interface SendMessageResult {
  success: boolean;
  providerMessageId?: string; // e.g. wamid.HBg...
  status: 'queued' | 'accepted' | 'sent' | 'failed';
  errorCode?: string;
  errorMessage?: string;
}

export interface TemplateSyncItem {
  id: string;
  name: string;
  category: string;
  language: string;
  status: 'APPROVED' | 'REJECTED' | 'PENDING' | 'PAUSED';
  headerType: 'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  headerContent?: string;
  bodyText: string;
  footerText?: string;
  rejectionReason?: string;
}

export interface WhatsAppAccountMetrics {
  qualityRating: 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN';
  messagingLimitTier: 'TIER_50' | 'TIER_1K' | 'TIER_10K' | 'TIER_100K' | 'UNLIMITED';
  verifiedName?: string;
  displayPhoneNumber?: string;
  codeVerificationStatus?: string;
}

export interface IWhatsAppProvider {
  sendMessage(options: SendMessageOptions): Promise<SendMessageResult>;
  fetchTemplates(): Promise<TemplateSyncItem[]>;
  createTemplate(template: {
    name: string;
    category: string;
    language: string;
    components: any[];
  }): Promise<{ id: string; status: string }>;
  getAccountMetrics(): Promise<WhatsAppAccountMetrics>;
  testConnection(): Promise<{ ok: boolean; message: string; details?: any }>;
}
