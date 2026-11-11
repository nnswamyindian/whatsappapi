import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config(); // fallback to local cwd

const INSECURE_DEFAULT_SECRETS = [
  'greenwave-super-secret-jwt-key-2025-secure',
  'greenwave_production_jwt_secret_change_me_super_secure_random_string_2025',
];

if (process.env.NODE_ENV === 'production' && process.env.STRICT_PROD_CHECK === 'true') {
  if (INSECURE_DEFAULT_SECRETS.includes(process.env.JWT_SECRET || '')) {
    throw new Error('FATAL: Known default JWT_SECRET detected in production! Please provide a strong random JWT_SECRET.');
  }
}

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  JWT_SECRET: process.env.JWT_SECRET || 'greenwave-super-secret-jwt-key-2025-secure',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  WEBHOOK_VERIFY_TOKEN: process.env.WEBHOOK_VERIFY_TOKEN || 'greenwave_verify_token_prod_99',
  META_API_VERSION: process.env.META_API_VERSION || 'v21.0',
  META_APP_ID: process.env.META_APP_ID || '',
  META_CONFIG_ID: process.env.META_CONFIG_ID || '',
  META_APP_SECRET: process.env.META_APP_SECRET || '',
  META_WABA_ID: process.env.META_WABA_ID || '',
  META_PHONE_NUMBER_ID: process.env.META_PHONE_NUMBER_ID || '',
  META_ACCESS_TOKEN: process.env.META_ACCESS_TOKEN || '',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  ENABLE_DEMO_MODE: process.env.ENABLE_DEMO_MODE !== 'false',
  IS_SANDBOX: !process.env.META_ACCESS_TOKEN,
};
