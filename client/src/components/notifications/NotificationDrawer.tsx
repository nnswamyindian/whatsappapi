import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  X,
  Check,
  CheckCheck,
  ExternalLink,
  ShieldAlert,
  Send,
  Sparkles,
  Building2,
  Clock,
} from 'lucide-react';
import { api } from '../../services/api';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateUnreadCount: (count: number) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onUpdateUnreadCount,
}) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.get('/notifications');
      setNotifications(data.notifications || []);
      onUpdateUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      const remainingUnread = notifications.filter((n) => n.id !== id && !n.is_read).length;
      onUpdateUnreadCount(remainingUnread);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      onUpdateUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between animate-fade-in">
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Notification Center</h3>
                <p className="text-[11px] text-slate-500">Real-time platform & messaging alerts</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-brand-700 hover:text-brand-900 flex items-center gap-1 p-1"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mark all read</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-2xl border text-xs transition-all ${
                  n.is_read
                    ? 'bg-white border-slate-100 text-slate-600'
                    : 'bg-brand-50/50 border-brand-200/80 text-slate-900 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0"></span>
                    )}
                    <h4 className="font-bold text-xs">{n.title}</h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{n.message}</p>

                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100/60">
                  {n.link ? (
                    <Link
                      to={n.link}
                      onClick={onClose}
                      className="text-[11px] font-bold text-brand-700 hover:underline inline-flex items-center gap-1"
                    >
                      <span>View details</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  ) : (
                    <span></span>
                  )}

                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="text-[10px] font-semibold text-slate-400 hover:text-slate-600"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            ))}

            {notifications.length === 0 && !loading && (
              <div className="text-center py-16 space-y-2">
                <Bell className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">All caught up!</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  You have no new notifications. Campaign updates and system alerts will appear here.
                </p>
              </div>
            )}
          </div>

          {/* Footer Notice */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400">
            Powered by GreenWave Event Broker &bull; Instant SSE Streaming
          </div>
        </div>
      </div>
    </div>
  );
};

