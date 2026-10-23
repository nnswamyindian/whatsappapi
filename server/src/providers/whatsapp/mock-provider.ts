import { IWhatsAppProvider, SendMessageOptions, SendMessageResult, TemplateSyncItem, WhatsAppAccountMetrics } from './provider-interface.js';
import { v4 as uuidv4 } from 'uuid';

export class MockWhatsAppProvider implements IWhatsAppProvider {
  private simulateDelayMs: number;

  constructor(simulateDelayMs: number = 300) {
    this.simulateDelayMs = simulateDelayMs;
  }

  async sendMessage(options: SendMessageOptions): Promise<SendMessageResult> {
    await new Promise((resolve) => setTimeout(resolve, this.simulateDelayMs));

    // Simulate occasional delivery bounce if phone ends in 0000
    if (options.toPhoneE164.endsWith('0000')) {
      return {
        success: false,
        status: 'failed',
        errorCode: '131026',
        errorMessage: 'Sandbox Simulation: Destination phone number is not a valid WhatsApp user',
      };
    }

    const mockWamid = `wamid.MOCK_${Date.now()}_${uuidv4().substring(0, 8)}`;
    return {
      success: true,
      status: 'accepted',
      providerMessageId: mockWamid,
    };
  }

  async fetchTemplates(): Promise<TemplateSyncItem[]> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return [
      {
        id: 'mock_tpl_001',
        name: 'order_status_update',
        category: 'UTILITY',
        language: 'en_US',
        status: 'APPROVED',
        headerType: 'TEXT',
        headerContent: 'Order {{1}} Dispatched',
        bodyText: 'Hi {{2}}, your order {{1}} has been shipped via {{3}}! Track your live package below.',
        footerText: 'Thank you for shopping with us.',
      },
      {
        id: 'mock_tpl_002',
        name: 'seasonal_flash_sale_v2',
        category: 'MARKETING',
        language: 'en_US',
        status: 'APPROVED',
        headerType: 'IMAGE',
        headerContent: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800',
        bodyText: 'Hi {{1}}, get ready! Our exclusive VIP Festival Sale is live with flat {{2}}% OFF on all premium collections. Use promo code {{3}} at checkout.',
        footerText: 'Valid until Sunday midnight. Reply STOP to opt out.',
      },
      {
        id: 'mock_tpl_003',
        name: 'secure_login_otp_v1',
        category: 'AUTHENTICATION',
        language: 'en_US',
        status: 'APPROVED',
        headerType: 'NONE',
        bodyText: 'Your GreenWave single-use verification code is {{1}}. Valid for {{2}} minutes.',
        footerText: 'Secured by GreenWave Auth Engine.',
      },
    ];
  }

  async createTemplate(template: {
    name: string;
    category: string;
    language: string;
    components: any[];
  }): Promise<{ id: string; status: string }> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return {
      id: `mock_meta_tpl_${Date.now()}`,
      status: 'APPROVED', // Sandbox auto-approves for immediate testing
    };
  }

  async getAccountMetrics(): Promise<WhatsAppAccountMetrics> {
    return {
      qualityRating: 'GREEN',
      messagingLimitTier: 'TIER_10K',
      verifiedName: 'GreenWave Sandbox Verified Business',
      displayPhoneNumber: '+1 (555) 019-2834',
      codeVerificationStatus: 'VERIFIED',
    };
  }

  async testConnection(): Promise<{ ok: boolean; message: string; details?: any }> {
    return {
      ok: true,
      message: 'Sandbox Mock Provider active and fully functional. Simulated delivery enabled.',
      details: {
        mode: 'sandbox',
        simulatedTier: 'TIER_10K',
        quality: 'GREEN',
      },
    };
  }
}
