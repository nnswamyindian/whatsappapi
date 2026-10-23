import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config(); // fallback to local cwd

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  JWT_SECRET: process.env.JWT_SECRET || 'greenwave-super-secret-jwt-key-2025-secure',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  WEBHOOK_VERIFY_TOKEN: process.env.WEBHOOK_VERIFY_TOKEN || 'greenwave_verify_token_prod_99',
  META_API_VERSION: process.env.META_API_VERSION || 'v21.0',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  ENABLE_DEMO_MODE: process.env.ENABLE_DEMO_MODE !== 'false',
};
