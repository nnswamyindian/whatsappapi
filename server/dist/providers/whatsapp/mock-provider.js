import { v4 as uuidv4 } from 'uuid';
export class MockWhatsAppProvider {
    simulateDelayMs;
    constructor(simulateDelayMs = 250) {
        this.simulateDelayMs = simulateDelayMs;
    }
    async sendMessage(options) {
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
    async fetchTemplates() {
        await new Promise((resolve) => setTimeout(resolve, 150));
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
                buttons: [
                    { type: 'URL', text: 'Track Package', url: 'https://greenwave.io/track' },
                    { type: 'QUICK_REPLY', text: 'Help & Support' },
                ],
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
                buttons: [
                    { type: 'URL', text: 'Shop Now', url: 'https://greenwave.io/sale' },
                    { type: 'QUICK_REPLY', text: 'Unsubscribe' },
                ],
            },
            {
                id: 'mock_tpl_003',
                name: 'secure_login_otp_v1',
                category: 'AUTHENTICATION',
                language: 'en_US',
                status: 'APPROVED',
                headerType: 'NONE',
                bodyText: 'Your GreenWave single-use verification code is {{1}}. Valid for {{2}} minutes. For security, never share this code.',
                footerText: 'Secured by GreenWave Auth Engine.',
                buttons: [
                    { type: 'QUICK_REPLY', text: 'Copy Code' },
                ],
            },
            {
                id: 'mock_tpl_004',
                name: 'product_carousel_showcase_v1',
                category: 'MARKETING',
                language: 'en_US',
                status: 'APPROVED',
                headerType: 'NONE',
                bodyText: 'Explore our top featured arrivals this season! Swipe through to discover items tailored for you.',
                footerText: 'GreenWave Catalog',
                isCarousel: true,
                cards: [
                    {
                        cardIndex: 0,
                        headerType: 'IMAGE',
                        headerUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
                        bodyText: 'Premium Chrono Watch - 20% OFF today!',
                        buttons: [{ type: 'URL', text: 'View Watch', url: 'https://greenwave.io/item/watch' }],
                    },
                    {
                        cardIndex: 1,
                        headerType: 'IMAGE',
                        headerUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
                        bodyText: 'Wireless ANC Headphones - Studio clarity sound.',
                        buttons: [{ type: 'URL', text: 'View Audio', url: 'https://greenwave.io/item/audio' }],
                    },
                ],
            },
        ];
    }
    async createTemplate(template) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return {
            id: `mock_meta_tpl_${Date.now()}`,
            status: 'APPROVED', // Sandbox auto-approves for immediate testing
        };
    }
    async getAccountMetrics() {
        return {
            qualityRating: 'GREEN',
            messagingLimitTier: 'TIER_10K',
            verifiedName: 'GreenWave Sandbox Verified Business',
            displayPhoneNumber: '+1 (555) 019-2834',
            codeVerificationStatus: 'VERIFIED',
            nameStatus: 'APPROVED',
            accountStatus: 'CONNECTED',
        };
    }
    async testConnection() {
        return {
            ok: true,
            message: 'Sandbox Mock Provider active and fully functional. Simulated delivery enabled.',
            details: {
                mode: 'sandbox',
                simulatedTier: 'TIER_10K',
                quality: 'GREEN',
                phone: '+1 (555) 019-2834',
                name: 'GreenWave Sandbox Verified Business',
            },
        };
    }
}
