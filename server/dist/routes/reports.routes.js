import { Router } from 'express';
import { db } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
const router = Router();
router.use(authMiddleware);
// Aggregated Summary Analytics
router.get('/summary', (req, res) => {
    const orgId = req.auth.orgId;
    const campaignId = req.query.campaignId;
    const days = parseInt(req.query.days || '30', 10);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    let msgQuery = `
    SELECT
      COUNT(*) as total_outbound,
      SUM(CASE WHEN status IN ('sent', 'delivered', 'read') THEN 1 ELSE 0 END) as sent_count,
      SUM(CASE WHEN status IN ('delivered', 'read') THEN 1 ELSE 0 END) as delivered_count,
      SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as read_count,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
      SUM(cost) as total_cost
    FROM messages
    WHERE organization_id = ? AND direction = 'outbound' AND created_at >= ?
  `;
    const params = [orgId, startDate];
    const stats = db.queryOne(msgQuery, params);
    // Inbound replies count
    const inboundCount = db.queryOne(`SELECT COUNT(*) as count FROM messages WHERE organization_id = ? AND direction = 'inbound' AND created_at >= ?`, [orgId, startDate])?.count || 0;
    const sent = stats?.sent_count || 0;
    const delivered = stats?.delivered_count || 0;
    const read = stats?.read_count || 0;
    const failed = stats?.failed_count || 0;
    const cost = stats?.total_cost || 0;
    const deliveryRate = sent > 0 ? Number(((delivered / sent) * 100).toFixed(1)) : 0;
    const readRate = delivered > 0 ? Number(((read / delivered) * 100).toFixed(1)) : 0;
    const failureRate = sent > 0 ? Number(((failed / sent) * 100).toFixed(1)) : 0;
    const costPerDelivered = delivered > 0 ? Number((cost / delivered).toFixed(4)) : 0;
    // Category breakdown
    const categoryBreakdown = db.query(`SELECT template_category, COUNT(*) as count, SUM(cost) as category_cost
     FROM messages
     WHERE organization_id = ? AND direction = 'outbound' AND created_at >= ?
     GROUP BY template_category`, [orgId, startDate]);
    res.json({
        periodDays: days,
        totals: {
            sent,
            delivered,
            read,
            failed,
            replies: inboundCount,
            totalCost: Number(cost.toFixed(2)),
        },
        rates: {
            deliveryRate,
            readRate,
            failureRate,
            costPerDelivered,
        },
        categoryBreakdown,
    });
});
// CSV Export Endpoint
router.get('/export', (req, res) => {
    const orgId = req.auth.orgId;
    const messages = db.query(`SELECT id, phone_e164, direction, message_type, template_name, template_category, status, cost, created_at
     FROM messages
     WHERE organization_id = ?
     ORDER BY created_at DESC LIMIT 500`, [orgId]);
    const header = 'Message ID,Phone,Direction,Type,Template,Category,Status,Cost (USD),Timestamp\n';
    const rows = messages.map((m) => [
        m.id,
        m.phone_e164,
        m.direction,
        m.message_type,
        m.template_name || '',
        m.template_category || '',
        m.status,
        m.cost,
        m.created_at,
    ].join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="greenwave_messaging_export.csv"');
    res.send(header + rows);
});
export default router;
