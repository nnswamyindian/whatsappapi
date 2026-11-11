import { Router } from 'express';
import { db } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { NotificationService } from '../services/notifications.js';
const router = Router();
router.use(authMiddleware);
// List notifications
router.get('/', (req, res) => {
    const notifications = NotificationService.list(req.auth.userId, req.auth.orgId);
    const unreadCount = NotificationService.getUnreadCount(req.auth.userId, req.auth.orgId);
    res.json({ notifications, unreadCount });
});
// Get unread notification count
router.get('/unread-count', (req, res) => {
    const count = NotificationService.getUnreadCount(req.auth.userId, req.auth.orgId);
    res.json({ unreadCount: count });
});
// Mark single notification as read
router.post('/:id/read', (req, res) => {
    NotificationService.markAsRead(String(req.params.id), req.auth.userId);
    res.json({ success: true });
});
// Mark all as read
router.post('/mark-all-read', (req, res) => {
    NotificationService.markAllAsRead(req.auth.userId, req.auth.orgId);
    res.json({ success: true });
});
// Get notification preferences
router.get('/preferences', (req, res) => {
    let prefs = db.queryOne('SELECT * FROM notification_preferences WHERE user_id = ?', [req.auth.userId]);
    if (!prefs) {
        const now = new Date().toISOString();
        db.execute(`INSERT INTO notification_preferences (id, user_id, email_alerts, push_alerts, campaign_updates, chat_updates, security_alerts, updated_at)
       VALUES (?, ?, 1, 1, 1, 1, 1, ?)`, [`pref_${req.auth.userId}`, req.auth.userId, now]);
        prefs = db.queryOne('SELECT * FROM notification_preferences WHERE user_id = ?', [req.auth.userId]);
    }
    res.json(prefs);
});
// Update notification preferences
router.put('/preferences', (req, res) => {
    const { emailAlerts, pushAlerts, campaignUpdates, chatUpdates, securityAlerts } = req.body;
    const now = new Date().toISOString();
    db.execute(`INSERT INTO notification_preferences (id, user_id, email_alerts, push_alerts, campaign_updates, chat_updates, security_alerts, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       email_alerts = excluded.email_alerts,
       push_alerts = excluded.push_alerts,
       campaign_updates = excluded.campaign_updates,
       chat_updates = excluded.chat_updates,
       security_alerts = excluded.security_alerts,
       updated_at = excluded.updated_at`, [
        `pref_${req.auth.userId}`,
        req.auth.userId,
        emailAlerts ? 1 : 0,
        pushAlerts ? 1 : 0,
        campaignUpdates ? 1 : 0,
        chatUpdates ? 1 : 0,
        securityAlerts ? 1 : 0,
        now,
    ]);
    res.json({ success: true, message: 'Notification preferences updated.' });
});
// Save Web Push Subscription
router.post('/push/subscribe', (req, res) => {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys) {
        res.status(400).json({ error: 'Invalid push subscription payload' });
        return;
    }
    const now = new Date().toISOString();
    db.execute(`INSERT INTO push_subscriptions (id, user_id, endpoint, keys_json, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET keys_json = excluded.keys_json`, [`sub_${Date.now()}`, req.auth.userId, endpoint, JSON.stringify(keys), now]);
    res.json({ success: true, message: 'Web push subscription registered.' });
});
export default router;
