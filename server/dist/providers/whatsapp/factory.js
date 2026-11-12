import { MetaCloudApiProvider } from './meta-cloud-api.js';
import { MockWhatsAppProvider } from './mock-provider.js';
import { db } from '../../db/index.js';
import { decryptSecret } from '../../utils/crypto.js';
export function getWhatsAppProviderForOrg(orgId) {
    const conn = db.queryOne('SELECT provider, mode, phone_number_id, waba_id, access_token FROM whatsapp_connections WHERE organization_id = ?', [orgId]);
    if (conn &&
        conn.mode === 'live' &&
        conn.access_token &&
        conn.phone_number_id &&
        conn.waba_id) {
        const rawToken = decryptSecret(conn.access_token);
        return {
            provider: new MetaCloudApiProvider({
                phoneNumberId: conn.phone_number_id,
                wabaId: conn.waba_id,
                accessToken: rawToken,
            }),
            isSandbox: false,
        };
    }
    // Fallback to clearly labelled Mock Sandbox mode
    return {
        provider: new MockWhatsAppProvider(),
        isSandbox: true,
    };
}
export function getWhatsAppProvider(orgId) {
    if (orgId) {
        return getWhatsAppProviderForOrg(orgId).provider;
    }
    return new MockWhatsAppProvider();
}
