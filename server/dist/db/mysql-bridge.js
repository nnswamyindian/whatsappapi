import { Worker, receiveMessageOnPort, MessageChannel } from 'node:worker_threads';
import { ENV } from '../config/env.js';
export class MySQLSyncBridge {
    worker = null;
    signal = null;
    port = null;
    isTerminated = false;
    constructor(options) {
        this.initWorker(options);
    }
    parseOptions(options) {
        const base = {
            waitForConnections: true,
            connectionLimit: 15,
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 10000,
            timezone: 'Z',
            dateStrings: true,
            multipleStatements: false,
        };
        if (ENV.DATABASE_URL && ENV.DATABASE_URL.trim() !== '') {
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
                    ...base,
                    host: parsed.hostname,
                    port: parsed.port ? parseInt(parsed.port, 10) : 3306,
                    user: decodeURIComponent(parsed.username),
                    password: decodeURIComponent(parsed.password),
                    database: parsed.pathname.replace(/^\//, ''),
                    ssl: parsed.searchParams.get('ssl') === 'true' || ENV.DB_SSL ? { rejectUnauthorized: false } : undefined,
                };
            }
            catch (err) {
                return {
                    ...base,
                    uri: ENV.DATABASE_URL,
                    ssl: ENV.DB_SSL ? { rejectUnauthorized: false } : undefined,
                };
            }
        }
        return {
            ...base,
            host: options?.host || ENV.DB_HOST || 'localhost',
            port: options?.port || ENV.DB_PORT || 3306,
            user: options?.user || ENV.DB_USER || 'greenwave',
            password: options?.password || ENV.DB_PASSWORD || 'GreenWave#2025',
            database: options?.database || ENV.DB_NAME || 'greenwave_db',
            ssl: (options?.ssl !== undefined ? options.ssl : ENV.DB_SSL) ? { rejectUnauthorized: false } : undefined,
        };
    }
    initWorker(options) {
        const connectionConfig = this.parseOptions(options);
        const sab = new SharedArrayBuffer(4);
        this.signal = new Int32Array(sab);
        const ch = new MessageChannel();
        this.port = ch.port1;
        // Inline worker script evaluated in V8 engine
        const workerScript = `
      const { workerData } = require('node:worker_threads');
      const mysql = require('mysql2/promise');
      const signal = new Int32Array(workerData.sab);
      const port = workerData.port;
      const config = workerData.config;

      let pool = null;
      let txConn = null;

      function translateSql(sql) {
        let converted = sql;
        if (converted.includes('INSERT OR REPLACE INTO')) {
          converted = converted.replace(/INSERT\\s+OR\\s+REPLACE\\s+INTO/gi, 'REPLACE INTO');
        }
        if (converted.includes('ON CONFLICT')) {
          converted = converted.replace(/ON\\s+CONFLICT\\s*\\([^)]*\\)\\s*DO\\s+UPDATE\\s+SET/gi, 'ON DUPLICATE KEY UPDATE');
          converted = converted.replace(/excluded\\.([a-zA-Z0-9_]+)/gi, 'VALUES($1)');
        }
        if (converted.includes('||')) {
          converted = converted.replace(/([^\\s]+)\\s*\\|\\|\\s*([^\\s]+)\\s*\\|\\|\\s*([^\\s]+)/g, 'CONCAT($1, $2, $3)');
        }
        return converted;
      }

      async function getPool() {
        if (!pool) {
          pool = mysql.createPool(config);
        }
        return pool;
      }

      port.on('message', async (msg) => {
        try {
          const p = await getPool();
          if (msg.type === 'query') {
            const client = txConn || p;
            const translated = translateSql(msg.sql);
            const sanitized = (msg.params || []).map(param => (param === undefined ? null : param));
            const [rows] = await client.query(translated, sanitized);
            port.postMessage({ ok: true, result: Array.isArray(rows) ? rows : [] });
          } else if (msg.type === 'execute') {
            const client = txConn || p;
            const translated = translateSql(msg.sql);
            const sanitized = (msg.params || []).map(param => (param === undefined ? null : param));
            const [result] = await client.execute(translated, sanitized);
            port.postMessage({
              ok: true,
              result: {
                changes: result.affectedRows || 0,
                lastInsertRowid: result.insertId || 0,
              },
            });
          } else if (msg.type === 'begin') {
            if (!txConn) {
              txConn = await p.getConnection();
              await txConn.beginTransaction();
            }
            port.postMessage({ ok: true });
          } else if (msg.type === 'commit') {
            if (txConn) {
              await txConn.commit();
              txConn.release();
              txConn = null;
            }
            port.postMessage({ ok: true });
          } else if (msg.type === 'rollback') {
            if (txConn) {
              await txConn.rollback();
              txConn.release();
              txConn = null;
            }
            port.postMessage({ ok: true });
          } else if (msg.type === 'close') {
            if (txConn) {
              try { txConn.release(); } catch (_) {}
              txConn = null;
            }
            if (pool) {
              await pool.end();
              pool = null;
            }
            port.postMessage({ ok: true });
          }
        } catch (err) {
          if (txConn && (msg.type === 'commit' || msg.type === 'rollback')) {
            try { txConn.release(); } catch (_) {}
            txConn = null;
          }
          port.postMessage({ ok: false, error: err.message || String(err) });
        } finally {
          Atomics.store(signal, 0, 1);
          Atomics.notify(signal, 0, 1);
        }
      });
    `;
        this.worker = new Worker(workerScript, {
            eval: true,
            workerData: {
                sab,
                port: ch.port2,
                config: connectionConfig,
            },
            transferList: [ch.port2],
        });
        this.worker.on('error', (err) => {
            console.error('[MySQL Sync Bridge Error]', err);
        });
    }
    dispatch(msg) {
        if (this.isTerminated || !this.signal || !this.port) {
            throw new Error('[MySQL Sync Bridge] Bridge worker has been terminated or not initialized.');
        }
        Atomics.store(this.signal, 0, 0);
        this.port.postMessage(msg);
        Atomics.wait(this.signal, 0, 0);
        const response = receiveMessageOnPort(this.port);
        if (!response || !response.message) {
            throw new Error('[MySQL Sync Bridge] Received empty response from worker bridge.');
        }
        if (!response.message.ok) {
            throw new Error(response.message.error || '[MySQL Sync Bridge] Query execution failed.');
        }
        return response.message.result;
    }
    querySync(sql, params = []) {
        return this.dispatch({ type: 'query', sql, params });
    }
    queryOneSync(sql, params = []) {
        const rows = this.querySync(sql, params);
        return rows.length > 0 ? rows[0] : null;
    }
    executeSync(sql, params = []) {
        return this.dispatch({ type: 'execute', sql, params });
    }
    transactionSync(fn) {
        this.dispatch({ type: 'begin' });
        try {
            const res = fn();
            this.dispatch({ type: 'commit' });
            return res;
        }
        catch (err) {
            this.dispatch({ type: 'rollback' });
            throw err;
        }
    }
    close() {
        if (this.isTerminated)
            return;
        this.isTerminated = true;
        try {
            this.dispatch({ type: 'close' });
        }
        catch (_) { }
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
    }
}
export const mySqlSyncBridge = new MySQLSyncBridge();
