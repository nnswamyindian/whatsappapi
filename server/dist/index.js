import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ENV } from './config/env.js';
import { seedDatabase } from './db/index.js';
import { sseManager } from './services/sse.js';
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
const app = express();
// Security and parser middleware
app.use(cors({
    origin: true, // Allow frontend dev server
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Health Check
app.get('/api/v1/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'GreenWave WhatsApp Business API Engine',
        version: '1.0.0',
        metaApiVersion: ENV.META_API_VERSION,
        timestamp: new Date().toISOString(),
    });
});
// Real-time SSE Stream Endpoint
app.get('/api/v1/events', (req, res) => {
    const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
    const orgId = req.query.orgId;
    if (!token) {
        res.status(401).send('Missing token for event stream');
        return;
    }
    try {
        const decoded = jwt.verify(token, ENV.JWT_SECRET);
        const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        sseManager.addClient(clientId, orgId || 'default', res);
    }
    catch (err) {
        res.status(401).send('Invalid event stream token');
    }
});
// API Documentation / Schema Specification
app.get('/api/v1/docs', (req, res) => {
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
// Serve static client build if present
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_DIST = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(CLIENT_DIST)) {
    app.use(express.static(CLIENT_DIST));
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api/'))
            return next();
        res.sendFile(path.join(CLIENT_DIST, 'index.html'));
    });
}
// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[Unhandled Server Error]:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message || 'An unexpected error occurred',
    });
});
// Initialize database and start listening
try {
    seedDatabase();
    console.log('✅ SQLite database schema initialized & seeded successfully.');
}
catch (err) {
    console.error('❌ Database initialization error:', err.message);
}
app.listen(ENV.PORT, () => {
    console.log(`🚀 GreenWave WhatsApp Platform Server running on http://localhost:${ENV.PORT}`);
    console.log(`📡 Meta Cloud API Webhook URL: http://localhost:${ENV.PORT}/api/v1/webhooks/whatsapp`);
    console.log(`📖 OpenAPI Documentation: http://localhost:${ENV.PORT}/api/v1/docs`);
});
