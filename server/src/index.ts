import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ENV } from './config/env.js';
import { db, seedDatabase, initDatabaseConnections } from './db/index.js';
import { mySqlEngine } from './db/mysql-pool.js';
import { sseManager } from './services/sse.js';
import { ClientLifecycleService } from './services/client-lifecycle.js';
import jwt from 'jsonwebtoken';

// Route modules
import authRoutes from './routes/auth.routes.js';
import orgRoutes from './routes/organizations.routes.js';
import whatsappRoutes from './routes/whatsapp.routes.js';
import contactsRoutes from './routes/contacts.routes.js';
import templatesRoutes from './routes/templates.routes.js';
import campaignsRoutes from './routes/campaigns.routes.js';
import inboxRoutes from './routes/inbox.routes.js';
import automationsRoutes from './routes/automations.routes.js';
import transactionalRoutes from './routes/transactional.routes.js';
import billingRoutes from './routes/billing.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import teamRoutes from './routes/team.routes.js';
import webhooksRoutes from './routes/webhooks.routes.js';
import adminRoutes from './routes/admin.routes.js';
import chatbotsRoutes from './routes/chatbots.routes.js';
import crmRoutes from './routes/crm.routes.js';
import replyRulesRoutes from './routes/reply-rules.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import onboardingRoutes from './routes/onboarding.routes.js';

const app = express();

// Security and parser middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(cors({
  origin: true, // Allow frontend dev server
  credentials: true,
}));

app.use(express.json({
  limit: '50mb',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static Media Uploads Serving (Images, Videos, Documents for WhatsApp Templates)
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'");
  next();
}, express.static(UPLOADS_DIR));

// Health Check
app.get('/api/v1/health', async (req: Request, res: Response) => {
  const dbHealth = await db.getHealth();
  res.json({
    status: 'ok',
    service: 'GreenWave WhatsApp Business API Engine',
    version: '1.0.0',
    metaApiVersion: ENV.META_API_VERSION,
    database: dbHealth,
    timestamp: new Date().toISOString(),
  });
});

// Real-time SSE Stream Endpoint
app.get('/api/v1/events', (req: Request, res: Response) => {
  const token = (req.query.token as string) || req.headers.authorization?.replace('Bearer ', '');
  const orgId = req.query.orgId as string;

  if (!token) {
    res.status(401).send('Missing token for event stream');
    return;
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    sseManager.addClient(clientId, orgId || 'default', res);
  } catch (err) {
    res.status(401).send('Invalid event stream token');
  }
});

// API Documentation / Schema Specification
app.get('/api/v1/docs', (req: Request, res: Response) => {
  res.json({
    openapi: '3.0.0',
    info: {
      title: 'GreenWave WhatsApp Business API Engine',
      version: '1.0.0',
      description: 'Production-grade WhatsApp Business Messaging, Campaigns, OTP & Shared Team Inbox Platform',
    },
    servers: [{ url: `http://localhost:${ENV.PORT}/api/v1` }],
    endpoints: [
      { path: '/auth/register', method: 'POST', description: 'User and workspace onboarding' },
      { path: '/auth/login', method: 'POST', description: 'Authenticate and receive session token' },
      { path: '/whatsapp/status', method: 'GET', description: 'WhatsApp Business API connection health' },
      { path: '/whatsapp/configure', method: 'POST', description: 'Configure Meta Cloud API credentials or toggle sandbox' },
      { path: '/contacts', method: 'GET', description: 'List contacts with search, tags, pagination' },
      { path: '/contacts/import', method: 'POST', description: 'CSV/XLSX contact import wizard with compliance validation' },
      { path: '/templates', method: 'GET', description: 'WhatsApp templates and approval statuses' },
      { path: '/templates', method: 'POST', description: 'Create and submit WhatsApp template to Meta' },
      { path: '/campaigns/estimate', method: 'POST', description: 'Calculate audience eligibility & transparent cost estimate' },
      { path: '/campaigns', method: 'POST', description: 'Launch immediate or scheduled WhatsApp campaign' },
      { path: '/inbox/conversations', method: 'GET', description: 'Shared team inbox conversation threads with 24h timer' },
      { path: '/messages', method: 'POST', description: 'Server-to-server transactional WhatsApp send' },
      { path: '/auth/otp/request', method: 'POST', description: 'Request single-use cryptographic WhatsApp OTP' },
      { path: '/auth/otp/verify', method: 'POST', description: 'Verify single-use WhatsApp OTP' },
      { path: '/webhooks/whatsapp', method: 'GET', description: 'Meta subscription challenge verification' },
      { path: '/webhooks/whatsapp', method: 'POST', description: 'Meta delivery status and message ingestion' },
    ],
  });
});

// Mount modular API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/organizations', orgRoutes);
app.use('/api/v1/whatsapp', whatsappRoutes);
app.use('/api/v1/contacts', contactsRoutes);
app.use('/api/v1/templates', templatesRoutes);
app.use('/api/v1/campaigns', campaignsRoutes);
app.use('/api/v1/inbox', inboxRoutes);
app.use('/api/v1/automations', automationsRoutes);
app.use('/api/v1', transactionalRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/team', teamRoutes);
app.use('/api/v1/webhooks', webhooksRoutes);
app.use('/api/v1/chatbots', chatbotsRoutes);
app.use('/api/v1/crm', crmRoutes);
app.use('/api/v1/reply-rules', replyRulesRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/onboarding', onboardingRoutes);
app.use('/api/v1/admin', adminRoutes);
// Serve static client build if present
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_DIST = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

// Catch unmatched API routes with clean JSON 404
app.use('/api', (req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint Not Found', path: req.originalUrl });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
  });
});

// Initialize Enterprise MySQL database connections and schema
initDatabaseConnections().then(() => {
  console.log('✅ MySQL database engine ready & operational.');
}).catch((err) => {
  console.error('❌ [Database Engine] MySQL connection error:', err.message);
});

// Omnichannel Automated Lifecycle Background Engine (Periodic check every 12h)
setTimeout(() => {
  ClientLifecycleService.runScheduledLifecycleCheck().catch(e =>
    console.warn('[Lifecycle Engine Startup Check Notice]:', e.message)
  );
}, 5000);

setInterval(() => {
  ClientLifecycleService.runScheduledLifecycleCheck().catch(e =>
    console.warn('[Lifecycle Engine Routine Check Notice]:', e.message)
  );
}, 12 * 60 * 60 * 1000);

const server = app.listen(ENV.PORT, () => {
  console.log(`🚀 MetaGreenWave Platform Server running on http://localhost:${ENV.PORT}`);
  console.log(`📡 Meta Cloud API Webhook URL: http://localhost:${ENV.PORT}/api/v1/webhooks/whatsapp`);
  console.log(`📖 OpenAPI Documentation: http://localhost:${ENV.PORT}/api/v1/docs`);
});

// Graceful Shutdown: Drain MySQL Pool and Terminate
const handleShutdown = async (signal: string) => {
  console.log(`\n[Server] Received ${signal}. Draining connection pools and shutting down...`);
  await mySqlEngine.close();
  server.close(() => {
    console.log('[Server] HTTP server closed gracefully.');
    process.exit(0);
  });
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
