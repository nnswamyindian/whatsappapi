import { ENV } from '../../config/env.js';
export class MetaCloudApiProvider {
    phoneNumberId;
    wabaId;
    accessToken;
    baseUrl;
    constructor(config) {
        this.phoneNumberId = config.phoneNumberId;
        this.wabaId = config.wabaId;
        this.accessToken = config.accessToken;
        this.baseUrl = `https://graph.facebook.com/${ENV.META_API_VERSION || 'v21.0'}`;
    }
    async sendMessage(options) {
        const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
        let payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: options.toPhoneE164.replace('+', ''),
        };
        switch (options.type) {
            case 'template':
                if (options.template) {
                    payload.type = 'template';
                    payload.template = {
                        name: options.template.name,
                        language: { code: options.template.language || 'en_US' },
                        components: options.template.components || [],
                    };
                }
                break;
            case 'text':
                if (options.text) {
                    payload.type = 'text';
                    payload.text = {
                        body: options.text.body,
                        preview_url: !!options.text.preview_url,
                    };
                }
                break;
            case 'image':
                if (options.media) {
                    payload.type = 'image';
                    payload.image = options.media.id
                        ? { id: options.media.id, caption: options.media.caption }
                        : { link: options.media.link, caption: options.media.caption };
                }
                break;
            case 'video':
                if (options.media) {
                    payload.type = 'video';
                    payload.video = options.media.id
                        ? { id: options.media.id, caption: options.media.caption }
                        : { link: options.media.link, caption: options.media.caption };
                }
                break;
            case 'audio':
                if (options.media) {
                    payload.type = 'audio';
                    payload.audio = options.media.id ? { id: options.media.id } : { link: options.media.link };
                }
                break;
            case 'document':
                if (options.media) {
                    payload.type = 'document';
                    payload.document = options.media.id
                        ? { id: options.media.id, caption: options.media.caption, filename: options.media.filename }
                        : { link: options.media.link, caption: options.media.caption, filename: options.media.filename };
                }
                break;
            case 'sticker':
                if (options.media) {
                    payload.type = 'sticker';
                    payload.sticker = options.media.id ? { id: options.media.id } : { link: options.media.link };
                }
                break;
            case 'location':
                if (options.location) {
                    payload.type = 'location';
                    payload.location = {
                        latitude: options.location.latitude,
                        longitude: options.location.longitude,
                        name: options.location.name,
                        address: options.location.address,
                    };
                }
                break;
            case 'contacts':
                if (options.contacts) {
                    payload.type = 'contacts';
                    payload.contacts = options.contacts;
                }
                break;
            case 'reaction':
                if (options.reaction) {
                    payload.type = 'reaction';
                    payload.reaction = {
                        message_id: options.reaction.message_id,
                        emoji: options.reaction.emoji,
                    };
                }
                break;
            case 'interactive':
                if (options.interactive) {
                    payload.type = 'interactive';
                    payload.interactive = options.interactive;
                }
                break;
            default:
                return {
                    success: false,
                    status: 'failed',
                    errorCode: 'UNSUPPORTED_TYPE',
                    errorMessage: `Message type '${options.type}' is not supported by Meta Graph API`,
                };
        }
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            const data = (await response.json());
            if (!response.ok) {
                const error = data?.error || {};
                const code = error.code ? String(error.code) : 'META_ERROR';
                const subcode = error.error_subcode ? ` (Subcode ${error.error_subcode})` : '';
                const message = this.normalizeMetaErrorMessage(code, error.message || 'Meta Cloud API call failed');
                return {
                    success: false,
                    status: 'failed',
                    errorCode: `${code}${subcode}`,
                    errorMessage: message,
                };
            }
            const wamid = data?.messages?.[0]?.id || `wamid.${Date.now()}`;
            return {
                success: true,
                status: 'accepted',
                providerMessageId: wamid,
            };
        }
        catch (err) {
            return {
                success: false,
                status: 'failed',
                errorCode: 'NETWORK_ERROR',
                errorMessage: err.message || 'Network exception communicating with Meta Cloud API',
            };
        }
    }
    normalizeMetaErrorMessage(code, rawMessage) {
        switch (code) {
            case '190':
                return 'Meta Access Token is invalid, expired, or revoked. Please re-generate a permanent System User token in Meta Business Manager.';
            case '131026':
                return 'Message undeliverable. The recipient phone number is not registered on WhatsApp or has privacy restrictions.';
            case '131047':
                return 'Re-engagement message error. More than 24 hours have passed since the customer last messaged. You must send an approved template message.';
            case '131056':
                return 'Rate limit hit. WhatsApp spam rate limit exceeded for this business account.';
            case '130429':
                return 'Throughput limit exceeded. Your WhatsApp Cloud API tier limit reached. Slow down message dispatch rate.';
            case '100':
                return `Invalid parameter in Meta payload: ${rawMessage}`;
            case '132000':
                return 'Template does not exist or has not been approved by Meta for this language.';
            case '132001':
                return 'Template variable parameter count mismatch. Ensure all placeholders {{1}}, {{2}} are provided.';
            default:
                return rawMessage;
        }
    }
    async fetchTemplates() {
        const url = `${this.baseUrl}/${this.wabaId}/message_templates?limit=150`;
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${this.accessToken}` },
        });
        const data = (await response.json());
        if (!response.ok) {
            throw new Error(data?.error?.message || 'Failed to fetch templates from Meta Graph API');
        }
        return (data.data || []).map((t) => {
            let bodyText = '';
            let headerType = 'NONE';
            let headerContent = '';
            let footerText = '';
            let buttons = [];
            let isCarousel = false;
            let cards = [];
            for (const comp of t.components || []) {
                if (comp.type === 'BODY')
                    bodyText = comp.text || '';
                if (comp.type === 'HEADER') {
                    headerType = comp.format || 'TEXT';
                    headerContent = comp.text || '';
                }
                if (comp.type === 'FOOTER')
                    footerText = comp.text || '';
                if (comp.type === 'BUTTONS')
                    buttons = comp.buttons || [];
                if (comp.type === 'CAROUSEL') {
                    isCarousel = true;
                    cards = (comp.cards || []).map((card, idx) => {
                        let cardBody = '';
                        let cardHeaderType = 'IMAGE';
                        let cardHeaderUrl = '';
                        let cardButtons = [];
                        for (const c of card.components || []) {
                            if (c.type === 'BODY')
                                cardBody = c.text || '';
                            if (c.type === 'HEADER') {
                                cardHeaderType = c.format || 'IMAGE';
                                cardHeaderUrl = c.example?.header_handle?.[0] || '';
                            }
                            if (c.type === 'BUTTONS')
                                cardButtons = c.buttons || [];
                        }
                        return {
                            cardIndex: idx,
                            headerType: cardHeaderType,
                            headerUrl: cardHeaderUrl,
                            bodyText: cardBody,
                            buttons: cardButtons,
                        };
                    });
                }
            }
            return {
                id: t.id,
                name: t.name,
                category: t.category,
                language: t.language,
                status: t.status, // APPROVED, REJECTED, PENDING, PAUSED
                headerType,
                headerContent,
                bodyText,
                footerText,
                buttons,
                isCarousel,
                cards,
                rejectionReason: t.rejection_reason || undefined,
            };
        });
    }
    async createTemplate(template) {
        const url = `${this.baseUrl}/${this.wabaId}/message_templates`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(template),
        });
        const data = (await response.json());
        if (!response.ok) {
            const err = data?.error || {};
            throw new Error(err.message || 'Meta template submission failed');
        }
        return { id: data.id, status: data.status || 'PENDING' };
    }
    async getAccountMetrics() {
        const url = `${this.baseUrl}/${this.phoneNumberId}?fields=verified_name,display_phone_number,quality_rating,code_verification_status,name_status,status`;
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${this.accessToken}` },
        });
        const data = (await response.json());
        if (!response.ok) {
            throw new Error(data?.error?.message || 'Failed to fetch phone number details from Meta Graph API');
        }
        return {
            qualityRating: data.quality_rating || 'GREEN',
            messagingLimitTier: 'TIER_10K',
            verifiedName: data.verified_name,
            displayPhoneNumber: data.display_phone_number,
            codeVerificationStatus: data.code_verification_status,
            nameStatus: data.name_status,
            accountStatus: data.status,
        };
    }
    async testConnection() {
        try {
            const metrics = await this.getAccountMetrics();
            return {
                ok: true,
                message: `Connected successfully to Meta Cloud API (${metrics.verifiedName || metrics.displayPhoneNumber})`,
                details: metrics,
            };
        }
        catch (err) {
            return {
                ok: false,
                message: err.message || 'Failed to authenticate with Meta Graph API',
            };
        }
    }
}
