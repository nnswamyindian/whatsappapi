export interface SendMessageOptions {
  toPhoneE164: string;
  type:
    | 'template'
    | 'text'
    | 'image'
    | 'video'
    | 'audio'
    | 'document'
    | 'sticker'
    | 'location'
    | 'contacts'
    | 'reaction'
    | 'interactive';
  text?: {
    body: string;
    preview_url?: boolean;
  };
  media?: {
    link?: string;
    id?: string;
    caption?: string;
    filename?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  contacts?: Array<{
    name: {
      formatted_name: string;
      first_name?: string;
      last_name?: string;
    };
    phones?: Array<{
      phone: string;
      type?: string;
    }>;
    emails?: Array<{
      email: string;
      type?: string;
    }>;
  }>;
  reaction?: {
    message_id: string;
    emoji: string;
  };
  interactive?: {
    type: 'button' | 'list' | 'flow' | 'product' | 'product_list';
    header?: {
      type: 'text' | 'image' | 'video' | 'document';
      text?: string;
      image?: { link: string };
      video?: { link: string };
      document?: { link: string; filename?: string };
    };
    body: {
      text: string;
    };
    footer?: {
      text: string;
    };
    action: {
      button?: string;
      buttons?: Array<{
        type: 'reply';
        reply: {
          id: string;
          title: string;
        };
      }>;
      sections?: Array<{
        title: string;
        rows: Array<{
          id: string;
          title: string;
          description?: string;
        }>;
      }>;
      name?: string; // e.g. "flow"
      parameters?: Record<string, any>;
    };
  };
  template?: {
    name: string;
    language: string;
    components?: Array<{
      type: 'header' | 'body' | 'button' | 'carousel';
      sub_type?: 'url' | 'quick_reply' | 'copy_code';
      index?: string;
      parameters?: Array<{
        type: 'text' | 'currency' | 'date_time' | 'image' | 'video' | 'document' | 'payload';
        text?: string;
        image?: { link: string };
        video?: { link: string };
        document?: { link: string; filename?: string };
        payload?: string;
      }>;
      cards?: Array<{
        card_index: number;
        components: Array<{
          type: 'header' | 'body' | 'button';
          sub_type?: 'url' | 'quick_reply';
          index?: string;
          parameters: Array<any>;
        }>;
      }>;
    }>;
  };
}

export interface SendMessageResult {
  success: boolean;
  providerMessageId?: string; // e.g. wamid.HBg...
  status: 'queued' | 'accepted' | 'sent' | 'failed';
  errorCode?: string;
  errorMessage?: string;
}

export interface TemplateCardItem {
  cardIndex: number;
  headerType?: 'IMAGE' | 'VIDEO';
  headerUrl?: string;
  bodyText: string;
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'URL';
    text: string;
    url?: string;
  }>;
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
  buttons?: any[];
  isCarousel?: boolean;
  cards?: TemplateCardItem[];
}

export interface WhatsAppAccountMetrics {
  qualityRating: 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN';
  messagingLimitTier: 'TIER_50' | 'TIER_250' | 'TIER_1K' | 'TIER_10K' | 'TIER_100K' | 'UNLIMITED';
  verifiedName?: string;
  displayPhoneNumber?: string;
  codeVerificationStatus?: string;
  nameStatus?: string;
  accountStatus?: string;
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
