import { IWhatsAppProvider } from './provider-interface.js';
import { MetaCloudApiProvider } from './meta-cloud-api.js';
import { MockWhatsAppProvider } from './mock-provider.js';
import { db } from '../../db/index.js';

import { decryptSecret } from '../../utils/crypto.js';

export function getWhatsAppProviderForOrg(orgId: string): { provider: IWhatsAppProvider; isSandbox: boolean } {
  const conn = db.queryOne<{
    provider: string;
    mode: string;
    phone_number_id?: string;
    waba_id?: string;
    access_token?: string;
  }>(
    'SELECT provider, mode, phone_number_id, waba_id, access_token FROM whatsapp_connections WHERE organization_id = ?',
    [orgId]
  );

  if (
    conn &&
    conn.mode === 'live' &&
    conn.access_token &&
    conn.phone_number_id &&
    conn.waba_id
  ) {
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
