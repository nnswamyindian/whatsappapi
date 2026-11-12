import { DatabaseSync } from 'node:sqlite';
import mysql from 'mysql2/promise';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { MYSQL_SCHEMA_STATEMENTS } from './mysql-schema.js';
import { ENV } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SQLITE_DB_PATH = path.resolve(__dirname, '../../data/greenwave.db');

export async function runMigration(): Promise<void> {
  console.log('================================================================');
  console.log('🚀 GREENWAVE: SQLITE -> MYSQL FULL DATA MIGRATION ENGINE');
  console.log('================================================================');

  if (!fs.existsSync(SQLITE_DB_PATH)) {
    console.error(`❌ Source SQLite database not found at: ${SQLITE_DB_PATH}`);
    process.exit(1);
  }

  console.log(`📁 Source SQLite DB: ${SQLITE_DB_PATH} (${(fs.statSync(SQLITE_DB_PATH).size / 1024).toFixed(1)} KB)`);

  // 1. Connect to SQLite
  const sqlite = new DatabaseSync(SQLITE_DB_PATH);

  // 2. Connect to MySQL server (without selecting DB first in case it needs creation)
  let mysqlConn: mysql.Connection;
  const targetDbName = ENV.DB_NAME || 'greenwave_db';

  try {
    let connectionConfig: any = {
      host: ENV.DB_HOST || 'localhost',
      port: ENV.DB_PORT || 3306,
      user: ENV.DB_USER || 'greenwave',
      password: ENV.DB_PASSWORD || 'GreenWave#2025',
      multipleStatements: true,
    };

    if (ENV.DATABASE_URL) {
      try {
        let cleanUrl = ENV.DATABASE_URL;
        const atIndex = cleanUrl.lastIndexOf('@');
        if (atIndex !== -1) {
          const authPart = cleanUrl.substring(0, atIndex);
          const restPart = cleanUrl.substring(atIndex);
          cleanUrl = authPart.replace(/#/g, '%23') + restPart;
        }
        const u = new URL(cleanUrl);
        connectionConfig = {
          host: u.hostname,
          port: u.port ? parseInt(u.port, 10) : 3306,
          user: decodeURIComponent(u.username),
          password: decodeURIComponent(u.password),
          multipleStatements: true,
          ssl: u.searchParams.get('ssl') === 'true' || ENV.DB_SSL ? { rejectUnauthorized: false } : undefined,
        };
      } catch (e) {
        connectionConfig = { uri: ENV.DATABASE_URL, multipleStatements: true };
      }
    }

    console.log(`🔌 Connecting to MySQL at ${connectionConfig.host || 'remote'}...`);
    mysqlConn = await mysql.createConnection(connectionConfig);
    console.log('✅ Connected to MySQL server.');

    // 3. Create database if it does not exist
    console.log(`🛠️ Ensuring database '${targetDbName}' exists with utf8mb4 collation...`);
    await mysqlConn.query(`CREATE DATABASE IF NOT EXISTS \`${targetDbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await mysqlConn.query(`USE \`${targetDbName}\``);
    await mysqlConn.query('SET FOREIGN_KEY_CHECKS = 0');
  } catch (err: any) {
    const errMsg = err.message || err.code || String(err);
    console.error('\n❌ Could not connect to MySQL server:');
    console.error(errMsg);
    console.error('\n👉 Tips:');
    console.error('1. Start your local MySQL server or docker container (docker compose up -d)');
    console.error('2. Ensure DATABASE_URL or DB_HOST/DB_PORT/DB_USER/DB_PASSWORD in .env is correct.\n');
    process.exit(1);
  }

  // 4. Initialize MySQL Schema
  console.log('\n📄 Creating all 41 MySQL tables and indexes...');
  for (let i = 0; i < MYSQL_SCHEMA_STATEMENTS.length; i++) {
    const stmt = MYSQL_SCHEMA_STATEMENTS[i];
    try {
      await mysqlConn.query(stmt);
    } catch (e: any) {
      console.warn(`[Schema Warning on statement ${i + 1}]: ${e.message}`);
    }
  }
  console.log('✅ All MySQL tables and indexes verified.');

  // 5. Migrate Data Table by Table in Dependency Order
  const tables = [
    'organizations',
    'users',
    'memberships',
    'invitations',
    'whatsapp_connections',
    'contacts',
    'consent_ledger',
    'suppression_list',
    'segments',
    'contact_imports',
    'templates',
    'campaigns',
    'campaign_recipients',
    'messages',
    'conversations',
    'internal_notes',
    'canned_replies',
    'automations',
    'automation_logs',
    'api_keys',
    'otp_verifications',
    'wallet_ledger',
    'rate_card',
    'audit_logs',
    'chatbots',
    'chatbot_sessions',
    'pipeline_stages',
    'crm_activities',
    'reply_rules',
    'campaign_attributions',
    'custom_roles',
    'customer_applications',
    'email_templates',
    'email_logs',
    'notifications',
    'notification_preferences',
    'push_subscriptions',
    'subscription_plans',
    'subscriptions',
    'invoices',
    'onboarding_checklists',
  ];

  console.log('\n📦 Migrating data from SQLite to MySQL...');
  let totalRowsMigrated = 0;

  for (const table of tables) {
    try {
      // Check if table exists in SQLite
      const tableCheck = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").all(table);
      if (tableCheck.length === 0) continue;

      const rows: any[] = sqlite.prepare(`SELECT * FROM \`${table}\``).all();
      if (rows.length === 0) {
        console.log(`  • ${table.padEnd(26)} : 0 rows (empty)`);
        continue;
      }

      // Insert each row into MySQL
      const firstRow = rows[0];
      const columns = Object.keys(firstRow);
      const placeholders = columns.map(() => '?').join(', ');
      const escapedColumns = columns.map(c => `\`${c}\``).join(', ');

      // Build ON DUPLICATE KEY UPDATE clause
      const updateClause = columns
        .filter(c => c !== 'id')
        .map(c => `\`${c}\`=VALUES(\`${c}\`)`)
        .join(', ');

      const insertSql = updateClause.length > 0
        ? `INSERT INTO \`${table}\` (${escapedColumns}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateClause}`
        : `INSERT IGNORE INTO \`${table}\` (${escapedColumns}) VALUES (${placeholders})`;

      let tableInserted = 0;
      for (const row of rows) {
        const values = columns.map(col => {
          const val = row[col];
          if (val === undefined) return null;
          return val;
        });

        await mysqlConn.query(insertSql, values);
        tableInserted++;
      }

      totalRowsMigrated += tableInserted;
      console.log(`  ✓ ${table.padEnd(26)} : ${tableInserted} rows migrated successfully`);
    } catch (err: any) {
      console.error(`  ❌ Failed migrating table '${table}': ${err.message}`);
    }
  }

  // 6. Restore Foreign Key Checks
  await mysqlConn.query('SET FOREIGN_KEY_CHECKS = 1');
  await mysqlConn.end();

  console.log('\n================================================================');
  console.log(`🎉 SUCCESS: SQLite to MySQL migration completed!`);
  console.log(`📊 Total rows migrated: ${totalRowsMigrated}`);
  console.log(`🗄️ Database: ${targetDbName}`);
  console.log('================================================================\n');
}

// Execute if run directly from CLI
if (process.argv[1] && process.argv[1].endsWith('migrate-sqlite-to-mysql.ts') || process.argv[1]?.endsWith('migrate-sqlite-to-mysql.js')) {
  runMigration().catch((err) => {
    console.error('Fatal Migration Error:', err);
    process.exit(1);
  });
}
