import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { sseManager } from './sse.js';

export interface CreateNotificationInput {
  organizationId?: string | null;
  userId?: string | null;
  type: 'registration' | 'approval' | 'whatsapp' | 'campaign' | 'billing' | 'security' | 'system';
  title: string;
  message: string;
  link?: string;
}

export class NotificationService {
  /**
   * Create an in-app notification and broadcast via SSE
   */
  static notify(input: CreateNotificationInput): string {
    const id = uuidv4();
    const now = new Date().toISOString();

    db.execute(
      `INSERT INTO notifications (id, organization_id, user_id, type, title, message, link, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [
        id,
        input.organizationId || null,
        input.userId || null,
        input.type,
        input.title,
        input.message,
        input.link || null,
        now,
      ]
    );

    // Broadcast in real-time to active sessions via SSE
    if (input.organizationId) {
      sseManager.broadcastToOrg(input.organizationId, 'notification', {
        id,
        organizationId: input.organizationId,
        userId: input.userId,
        notificationType: input.type,
        title: input.title,
        message: input.message,
        link: input.link,
        isRead: false,
        createdAt: now,
      });
    }

    return id;
  }

  /**
   * Get paginated notifications for a user or tenant
   */
  static list(userId: string, orgId?: string, limit = 50) {
    return db.query<any>(
      `SELECT * FROM notifications 
       WHERE (user_id = ? OR (user_id IS NULL AND organization_id = ?))
       ORDER BY created_at DESC 
       LIMIT ?`,
      [userId, orgId || '', limit]
    );
  }

  /**
   * Get unread count
   */
  static getUnreadCount(userId: string, orgId?: string): number {
    const res = db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM notifications 
       WHERE (user_id = ? OR (user_id IS NULL AND organization_id = ?)) 
       AND is_read = 0`,
      [userId, orgId || '']
    );
    return res?.count || 0;
  }

  /**
   * Mark notification as read
   */
  static markAsRead(id: string, userId: string) {
    db.execute(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND (user_id = ? OR user_id IS NULL)`,
      [id, userId]
    );
  }

  /**
   * Mark all as read
   */
  static markAllAsRead(userId: string, orgId?: string) {
    db.execute(
      `UPDATE notifications SET is_read = 1 
       WHERE (user_id = ? OR (user_id IS NULL AND organization_id = ?))`,
      [userId, orgId || '']
    );
  }
}
