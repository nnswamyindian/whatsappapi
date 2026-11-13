import mysql from 'mysql2/promise';
import { ENV } from '../config/env.js';
export class MySQLDatabaseEngine {
    pool = null;
    isConnecting = false;
    heartbeatTimer = null;
    lastPingLatency = 0;
    constructor() {
        // Lazy or explicit initialization
    }
    /**
     * Parse connection options from DATABASE_URL or individual env variables
     */
    buildPoolOptions() {
        const baseOptions = {
            waitForConnections: true,
            connectionLimit: ENV.DB_POOL_MAX || 20,
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 10000,
            timezone: 'Z',
            dateStrings: true,
            multipleStatements: false,
        };
        if (ENV.DATABASE_URL && ENV.DATABASE_URL.trim() !== '') {
            // Parse standard URL: mysql://user:pass@host:port/database?ssl=...
            try {
                let cleanUrl = ENV.DATABASE_URL;
                const atIndex = cleanUrl.lastIndexOf('@');
                if (atIndex !== -1) {
                    const authPart = cleanUrl.substring(0, atIndex);
                    const restPart = cleanUrl.substring(atIndex);
                    cleanUrl = authPart.replace(/#/g, '%23') + restPart;
                }
                const parsed = new URL(cleanUrl);
                return {
                    ...baseOptions,
                    host: parsed.hostname,
                    port: parsed.port ? parseInt(parsed.port, 10) : 3306,
                    user: decodeURIComponent(parsed.username),
                    password: decodeURIComponent(parsed.password),
                    database: parsed.pathname.replace(/^\//, ''),
                    ssl: parsed.searchParams.get('ssl') === 'true' || ENV.DB_SSL ? { rejectUnauthorized: false } : undefined,
                };
            }
            catch (err) {
                console.warn('[MySQL Pool] Failed to parse DATABASE_URL as standard URL, using as URI:', err);
                return {
                    ...baseOptions,
                    uri: ENV.DATABASE_URL,
                    ssl: ENV.DB_SSL ? { rejectUnauthorized: false } : undefined,
                };
            }
        }
        return {
            ...baseOptions,
            host: ENV.DB_HOST || 'localhost',
            port: ENV.DB_PORT || 3306,
            user: ENV.DB_USER || 'greenwave',
            password: ENV.DB_PASSWORD || 'GreenWave#2025',
            database: ENV.DB_NAME || 'greenwave_db',
            ssl: ENV.DB_SSL ? { rejectUnauthorized: false } : undefined,
        };
    }
    /**
     * Initialize MySQL Connection Pool
     */
    async initialize() {
        if (this.pool)
            return true;
        if (this.isConnecting)
            return false;
        this.isConnecting = true;
        try {
            const options = this.buildPoolOptions();
            const hostInfo = options.host || 'remote cloud';
            const dbInfo = options.database || 'greenwave_db';
            console.log(`[MySQL Engine] Initializing connection pool to ${hostInfo}/${dbInfo}...`);
            this.pool = mysql.createPool(options);
            // Verify connection with immediate ping
            const startTime = Date.now();
            const conn = await this.pool.getConnection();
            await conn.ping();
            conn.release();
            this.lastPingLatency = Date.now() - startTime;
            console.log(`✅ [MySQL Engine] Connected successfully to MySQL (${this.lastPingLatency}ms latency).`);
            // Start keep-alive heartbeat interval every 30 seconds
            this.startHeartbeat();
            this.isConnecting = false;
            return true;
        }
        catch (err) {
            this.isConnecting = false;
            const errMsg = err.message || err.code || String(err);
            console.warn(`⚠️ [MySQL Engine] MySQL connection could not be established: ${errMsg}`);
            return false;
        }
    }
    getPool() {
        return this.pool;
    }
    isConnected() {
        return this.pool !== null;
    }
    startHeartbeat() {
        if (this.heartbeatTimer)
            clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = setInterval(async () => {
            if (!this.pool)
                return;
            try {
                const start = Date.now();
                await this.pool.query('SELECT 1');
                this.lastPingLatency = Date.now() - start;
            }
            catch (err) {
                console.warn(`[MySQL Engine] Heartbeat ping failed: ${err.message}`);
            }
        }, 30000);
    }
    /**
     * Health Check & Pool Telemetry
     */
    async healthCheck() {
        if (!this.pool) {
            return {
                connected: false,
                engine: 'mysql',
                latencyMs: -1,
                database: ENV.DB_NAME || 'greenwave_db',
                error: 'Pool not initialized or database unreachable',
            };
        }
        try {
            const start = Date.now();
            await this.pool.query('SELECT 1');
            const latencyMs = Date.now() - start;
            this.lastPingLatency = latencyMs;
            return {
                connected: true,
                engine: 'mysql',
                latencyMs,
                database: ENV.DB_NAME || 'greenwave_db',
            };
        }
        catch (err) {
            return {
                connected: false,
                engine: 'mysql',
                latencyMs: -1,
                database: ENV.DB_NAME || 'greenwave_db',
                error: err.message,
            };
        }
    }
    /**
     * Dialect Translator: Converts SQLite-specific syntax into MySQL standard
     */
    translateSql(sql) {
        let converted = sql;
        // 1. Normalize SQLite `ON CONFLICT (...) DO UPDATE SET ...` to MySQL `ON DUPLICATE KEY UPDATE ...`
        if (converted.includes('ON CONFLICT')) {
            converted = converted.replace(/ON\s+CONFLICT\s*\([^)]*\)\s*DO\s+UPDATE\s+SET/gi, 'ON DUPLICATE KEY UPDATE');
            // Replace SQLite `excluded.col` with `VALUES(col)` for MySQL compatibility
            converted = converted.replace(/excluded\.([a-zA-Z0-9_]+)/gi, 'VALUES($1)');
        }
        // 2. Normalize SQLite string concatenation `||` to CONCAT
        // If standard pattern: `? LIKE '%' || trigger_keyword || '%'` -> `? LIKE CONCAT('%', trigger_keyword, '%')`
        if (converted.includes("||")) {
            converted = converted.replace(/([^\s]+)\s*\|\|\s*([^\s]+)\s*\|\|\s*([^\s]+)/g, 'CONCAT($1, $2, $3)');
        }
        return converted;
    }
    /**
     * Query multiple rows with strict prepared statements
     */
    async query(sql, params = []) {
        if (!this.pool)
            throw new Error('MySQL connection pool is not active.');
        const translated = this.translateSql(sql);
        const sanitized = params.map(p => (p === undefined ? null : p));
        const [rows] = await this.pool.query(translated, sanitized);
        return Array.isArray(rows) ? rows : [];
    }
    /**
     * Query single row with strict prepared statements
     */
    async queryOne(sql, params = []) {
        const rows = await this.query(sql, params);
        return rows.length > 0 ? rows[0] : null;
    }
    /**
     * Execute INSERT, UPDATE, DELETE with prepared statements
     */
    async execute(sql, params = []) {
        if (!this.pool)
            throw new Error('MySQL connection pool is not active.');
        const translated = this.translateSql(sql);
        const sanitized = params.map(p => (p === undefined ? null : p));
        const [result] = await this.pool.execute(translated, sanitized);
        return {
            changes: result.affectedRows || 0,
            lastInsertRowid: result.insertId || 0,
        };
    }
    /**
     * Execute transaction with automatic rollback and connection release
     */
    async withTransaction(callback) {
        if (!this.pool)
            throw new Error('MySQL connection pool is not active.');
        const conn = await this.pool.getConnection();
        await conn.beginTransaction();
        try {
            const res = await callback(conn);
            await conn.commit();
            return res;
        }
        catch (err) {
            await conn.rollback();
            throw err;
        }
        finally {
            conn.release();
        }
    }
    /**
     * Graceful Shutdown: Drain and close all connections
     */
    async close() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        if (this.pool) {
            console.log('[MySQL Engine] Draining connection pool and closing connections...');
            await this.pool.end();
            this.pool = null;
        }
    }
}
export const mySqlEngine = new MySQLDatabaseEngine();
