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
        this.baseUrl = `https://graph.facebook.com/${ENV.META_API_VERSION}`;
    }
    async sendMessage(options) {
        const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
        let payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: options.toPhoneE164.replace('+', ''),
        };
        if (options.type === 'template' && options.template) {
            payload.type = 'template';
            payload.template = {
                name: options.template.name,
                language: { code: options.template.language || 'en_US' },
                components: options.template.components || [],
            };
        }
        else if (options.type === 'text' && options.text) {
            payload.type = 'text';
            payload.text = {
                body: options.text.body,
                preview_url: !!options.text.preview_url,
            };
        }
        else if (options.type === 'image' && options.media) {
            payload.type = 'image';
            payload.image = {
                link: options.media.link,
                caption: options.media.caption,
            };
        }
        else if (options.type === 'document' && options.media) {
            payload.type = 'document';
            payload.document = {
                link: options.media.link,
                caption: options.media.caption,
                filename: options.media.filename,
            };
        }
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!response.ok) {
                const error = data?.error || {};
                const code = error.code ? String(error.code) : 'META_ERROR';
                const message = error.message || 'Meta Cloud API call failed';
                return {
                    success: false,
                    status: 'failed',
                    errorCode: code,
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
    async fetchTemplates() {
        const url = `${this.baseUrl}/${this.wabaId}/message_templates?limit=100`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${this.accessToken}` },
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data?.error?.message || 'Failed to fetch templates from Meta Graph API');
        }
        return (data.data || []).map((t) => {
            let bodyText = '';
            let headerType = 'NONE';
            let headerContent = '';
            let footerText = '';
            for (const comp of t.components || []) {
                if (comp.type === 'BODY')
                    bodyText = comp.text || '';
                if (comp.type === 'HEADER') {
                    headerType = comp.format || 'TEXT';
                    headerContent = comp.text || '';
                }
                if (comp.type === 'FOOTER')
                    footerText = comp.text || '';
            }
            return {
                id: t.id,
                name: t.name,
                category: t.category,
                language: t.language,
                status: t.status, // APPROVED, REJECTED, PENDING
                headerType,
                headerContent,
                bodyText,
                footerText,
                rejectionReason: t.rejection_reason || undefined,
            };
        });
    }
    async createTemplate(template) {
        const url = `${this.baseUrl}/${this.wabaId}/message_templates`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(template),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data?.error?.message || 'Meta template submission failed');
        }
        return { id: data.id, status: data.status || 'PENDING' };
    }
    async getAccountMetrics() {
        const url = `${this.baseUrl}/${this.phoneNumberId}?fields=verified_name,display_phone_number,quality_rating,code_verification_status`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${this.accessToken}` },
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data?.error?.message || 'Failed to fetch phone number details from Meta');
        }
        return {
            qualityRating: data.quality_rating || 'GREEN',
            messagingLimitTier: 'TIER_10K',
            verifiedName: data.verified_name,
            displayPhoneNumber: data.display_phone_number,
            codeVerificationStatus: data.code_verification_status,
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
