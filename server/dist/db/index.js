import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SCHEMA_SQL } from './schema.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_PATH = path.join(DATA_DIR, 'greenwave.db');
const dbInstance = new DatabaseSync(DB_PATH);
// Initialize schema
dbInstance.exec(SCHEMA_SQL);
export const db = {
    raw: dbInstance,
    query(sql, params = []) {
        const stmt = dbInstance.prepare(sql);
        return stmt.all(...params);
    },
    queryOne(sql, params = []) {
        const results = this.query(sql, params);
        return results.length > 0 ? results[0] : null;
    },
    execute(sql, params = []) {
        const stmt = dbInstance.prepare(sql);
        const result = stmt.run(...params);
        return {
            changes: result.changes,
            lastInsertRowid: result.lastInsertRowid,
        };
    },
    transaction(fn) {
        dbInstance.exec('BEGIN IMMEDIATE');
        try {
            const res = fn();
            dbInstance.exec('COMMIT');
            return res;
        }
        catch (err) {
            dbInstance.exec('ROLLBACK');
            throw err;
        }
    },
};
// Seed initial system data (Rate cards, default platform admin, demo workspace)
export function seedDatabase() {
    const existingRates = db.query('SELECT COUNT(*) as count FROM rate_card');
    if (existingRates[0].count === 0) {
        const rates = [
            { id: 'rc_in_mkt', category: 'MARKETING', country_code: 'IN', provider: 0.0099, platform: 0.0020, date: '2025-01-01' },
            { id: 'rc_in_utl', category: 'UTILITY', country_code: 'IN', provider: 0.0018, platform: 0.0010, date: '2025-01-01' },
            { id: 'rc_in_ath', category: 'AUTHENTICATION', country_code: 'IN', provider: 0.0018, platform: 0.0010, date: '2025-01-01' },
            { id: 'rc_us_mkt', category: 'MARKETING', country_code: 'US', provider: 0.0250, platform: 0.0050, date: '2025-01-01' },
            { id: 'rc_us_utl', category: 'UTILITY', country_code: 'US', provider: 0.0150, platform: 0.0030, date: '2025-01-01' },
            { id: 'rc_us_ath', category: 'AUTHENTICATION', country_code: 'US', provider: 0.0135, platform: 0.0030, date: '2025-01-01' },
            { id: 'rc_def_mkt', category: 'MARKETING', country_code: 'DEFAULT', provider: 0.0350, platform: 0.0050, date: '2025-01-01' },
            { id: 'rc_def_utl', category: 'UTILITY', country_code: 'DEFAULT', provider: 0.0200, platform: 0.0030, date: '2025-01-01' },
            { id: 'rc_def_ath', category: 'AUTHENTICATION', country_code: 'DEFAULT', provider: 0.0180, platform: 0.0030, date: '2025-01-01' },
        ];
        for (const r of rates) {
            db.execute(`INSERT INTO rate_card (id, category, country_code, provider_rate_usd, platform_fee_usd, effective_date)
         VALUES (?, ?, ?, ?, ?, ?)`, [r.id, r.category, r.country_code, r.provider, r.platform, r.date]);
        }
    }
    // Seed default demo organization & user if none exist
    const existingUsers = db.query('SELECT COUNT(*) as count FROM users');
    if (existingUsers[0].count === 0) {
        const userId = uuidv4();
        const orgId = uuidv4();
        const now = new Date().toISOString();
        const passwordHash = bcrypt.hashSync('GreenWave#2025', 10);
        // 1. Create User
        db.execute(`INSERT INTO users (id, email, password_hash, full_name, is_platform_admin, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, ?, ?)`, [userId, 'admin@greenwave.io', passwordHash, 'Alex Vance (Platform Lead)', now, now]);
        // 2. Create Organization
        db.execute(`INSERT INTO organizations (id, name, slug, timezone, status, plan_tier, wallet_balance, low_balance_threshold, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'active', 'growth', 45.50, 10.00, ?, ?)`, [orgId, 'Acme Retail Global', 'acme-retail', 'Asia/Kolkata', now, now]);
        // 3. Create Membership
        db.execute(`INSERT INTO memberships (id, organization_id, user_id, role, created_at)
       VALUES (?, ?, ?, 'owner', ?)`, [uuidv4(), orgId, userId, now]);
        // 4. Initial Wallet Credit
        db.execute(`INSERT INTO wallet_ledger (id, organization_id, amount, balance_after, transaction_type, description, created_at)
       VALUES (?, ?, 45.50, 45.50, 'topup', 'Welcome promotional credit', ?)`, [uuidv4(), orgId, now]);
        // 5. Create WhatsApp Sandbox Connection
        db.execute(`INSERT INTO whatsapp_connections (id, organization_id, provider, mode, waba_id, phone_number_id, display_phone_number, verified_name, quality_rating, messaging_limit_tier, status, last_sync_at, created_at, updated_at)
       VALUES (?, ?, 'meta_cloud', 'sandbox', 'WABA_98241088214', 'PHONE_ID_1049281', '+1 (555) 019-2834', 'GreenWave Demo Verified', 'GREEN', 'TIER_10K', 'connected', ?, ?, ?)`, [uuidv4(), orgId, now, now, now]);
        // 6. Pre-seed standard WhatsApp Templates
        const templates = [
            {
                id: uuidv4(),
                name: 'order_status_update',
                category: 'UTILITY',
                header_type: 'TEXT',
                header_content: 'Order {{1}} Dispatched 📦',
                body_text: 'Hi {{2}}, your order {{1}} has been shipped via {{3}}! Track your live delivery package using the tracking link below.',
                footer_text: 'Thank you for shopping with Acme Retail.',
                buttons: JSON.stringify([
                    { type: 'URL', text: 'Track Shipment', url: 'https://example.com/track/{{1}}' },
                    { type: 'QUICK_REPLY', text: 'Contact Support' }
                ]),
                variables: JSON.stringify(['#ORD-8941', 'Sarah', 'BlueDart Express']),
                status: 'APPROVED',
            },
            {
                id: uuidv4(),
                name: 'seasonal_flash_sale_v2',
                category: 'MARKETING',
                header_type: 'IMAGE',
                header_content: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800',
                body_text: 'Hi {{1}}, get ready! Our exclusive VIP Festival Sale is live with flat {{2}}% OFF on all premium collections. Use promo code {{3}} at checkout.',
                footer_text: 'Valid until Sunday midnight. Reply STOP to opt out.',
                buttons: JSON.stringify([
                    { type: 'URL', text: 'Shop Exclusive Deals', url: 'https://example.com/sale' },
                    { type: 'QUICK_REPLY', text: 'View Catalog' },
                    { type: 'QUICK_REPLY', text: 'Opt Out' }
                ]),
                variables: JSON.stringify(['Rohan', '40', 'FESTIVE40']),
                status: 'APPROVED',
            },
            {
                id: uuidv4(),
                name: 'secure_login_otp_v1',
                category: 'AUTHENTICATION',
                header_type: 'NONE',
                header_content: null,
                body_text: 'Your GreenWave single-use verification code is {{1}}. Valid for {{2}} minutes. For security, never share this code with anyone.',
                footer_text: 'Secured by GreenWave Auth Engine.',
                buttons: JSON.stringify([
                    { type: 'URL', text: 'Copy OTP Code', url: 'https://greenwave.io/auth/verify?code={{1}}' }
                ]),
                variables: JSON.stringify(['482910', '10']),
                status: 'APPROVED',
            }
        ];
        for (const t of templates) {
            db.execute(`INSERT INTO templates (id, organization_id, name, category, language, header_type, header_content, body_text, footer_text, buttons_json, variables_json, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'en_US', ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [t.id, orgId, t.name, t.category, t.header_type, t.header_content, t.body_text, t.footer_text, t.buttons, t.variables, t.status, now, now]);
        }
        // 7. Seed Sample Contacts with verified consent
        const sampleContacts = [
            { phone: '+919876543210', first: 'Rahul', last: 'Sharma', email: 'rahul.s@example.com', tags: ['VIP', 'Repeat Customer'], custom: { city: 'Mumbai', tier: 'Gold' } },
            { phone: '+919812345678', first: 'Priya', last: 'Patel', email: 'priya.p@example.com', tags: ['Festival Lead'], custom: { city: 'Ahmedabad', tier: 'Silver' } },
            { phone: '+14155552671', first: 'Michael', last: 'Chen', email: 'michael.c@example.com', tags: ['Wholesale'], custom: { city: 'San Francisco', tier: 'Platinum' } },
            { phone: '+447911123456', first: 'Emma', last: 'Watson', email: 'emma.w@example.com', tags: ['VIP', 'Loyalty'], custom: { city: 'London', tier: 'Gold' } },
            { phone: '+919988776655', first: 'Vikram', last: 'Malhotra', email: 'vikram.m@example.com', tags: ['Tech Support'], custom: { city: 'Bengaluru', tier: 'Silver' } }
        ];
        for (const c of sampleContacts) {
            const cId = uuidv4();
            db.execute(`INSERT INTO contacts (id, organization_id, phone_e164, first_name, last_name, email, tags, custom_fields, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`, [cId, orgId, c.phone, c.first, c.last, c.email, JSON.stringify(c.tags), JSON.stringify(c.custom), now, now]);
            // Record explicit Consent
            db.execute(`INSERT INTO consent_ledger (id, organization_id, contact_id, phone_e164, status, purpose, source, evidence, timestamp)
         VALUES (?, ?, ?, ?, 'opted_in', 'marketing', 'website_form', 'Checkout checkbox agreement v1.2', ?)`, [uuidv4(), orgId, cId, c.phone, now]);
        }
        // 8. Seed Sample Conversations in Inbox
        const firstContact = db.queryOne('SELECT id, phone_e164, first_name FROM contacts WHERE phone_e164 = ?', ['+919876543210']);
        if (firstContact) {
            const convId = uuidv4();
            const windowExpiry = new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(); // 20 hours remaining
            db.execute(`INSERT INTO conversations (id, organization_id, contact_id, phone_e164, status, priority, assigned_agent_id, assigned_team, last_message_at, last_inbound_at, window_expires_at, unread_count, labels, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'open', 'high', ?, 'Support Tier 1', ?, ?, ?, 1, ?, ?, ?)`, [convId, orgId, firstContact.id, firstContact.phone_e164, userId, now, now, windowExpiry, JSON.stringify(['Shipping', 'VIP']), now, now]);
            // Inbound message
            db.execute(`INSERT INTO messages (id, organization_id, conversation_id, contact_id, phone_e164, direction, message_type, body, status, provider_message_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'inbound', 'text', 'Hello, can I change the delivery address for my order #ORD-8941?', 'delivered', ?, ?, ?)`, [uuidv4(), orgId, convId, firstContact.id, firstContact.phone_e164, `wamid.HBgMOTE5ODc2NTQzMjEwFQIAEhgg${Date.now()}A`, now, now]);
            // Internal agent note
            db.execute(`INSERT INTO internal_notes (id, conversation_id, user_id, user_name, content, created_at)
         VALUES (?, ?, ?, 'Alex Vance', 'Customer contacted via WhatsApp. Warehouse shipment package is already packed, checking with courier partner.', ?)`, [uuidv4(), convId, userId, now]);
        }
        // 9. Seed Canned Quick Replies
        const canned = [
            { shortcut: '/greeting', title: 'Standard Welcome', content: 'Hello! Thank you for reaching out to Acme Retail customer support. How may I assist you today?' },
            { shortcut: '/hours', title: 'Operating Hours', content: 'Our standard customer support desk operates Monday to Saturday from 9:00 AM to 8:00 PM IST.' },
            { shortcut: '/address', title: 'Address Change Confirmation', content: 'We have updated your delivery address in our fulfillment system. You will receive an automated tracking link once dispatched.' }
        ];
        for (const c of canned) {
            db.execute(`INSERT INTO canned_replies (id, organization_id, shortcut, title, content, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`, [uuidv4(), orgId, c.shortcut, c.title, c.content, now]);
        }
        // 10. Seed Demo API Key
        const apiKeyRaw = 'gw_live_7f8e9a2b1c4d3e5f6a8b0c2d4e6f8a0b';
        const keyHash = bcrypt.hashSync(apiKeyRaw, 10);
        db.execute(`INSERT INTO api_keys (id, organization_id, name, key_hash, key_prefix, permissions, last_used_at, status, created_at)
       VALUES (?, ?, 'Production Commerce API', ?, 'gw_live_7f8e...', '["messages:send","otp:verify","reports:read"]', ?, 'active', ?)`, [uuidv4(), orgId, keyHash, now, now]);
    }
}
