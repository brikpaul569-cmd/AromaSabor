'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface NotificationItem {
  _id: string;
  proposalId: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const NOTIFICATION_TYPE_COLORS: Record<string, string> = {
  proposal_created: 'bg-blue-500',
  proposal_updated: 'bg-purple-500',
  proposal_sent: 'bg-green-500',
  proposal_accepted: 'bg-green-500',
  proposal_rejected: 'bg-red-500',
  proposal_expired: 'bg-gray-500',
};

function typeColor(type: string): string {
  return NOTIFICATION_TYPE_COLORS[type] ?? 'bg-blue-500';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function NotificationBell() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  /* Fetch notifications */
  const fetchNotifications = async () => {
    try {
      const data = await api.get<NotificationItem[]>('/notifications');
      setNotifications(data);
    } catch {
      // silently fail — notifications are non-critical
    }
  };

  /* Initial fetch + poll every 30s */
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Mark one notification as read */
  const markRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
      );
    } catch {
      // silent
    }
  };

  /* Click outside to close */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-white/10 hover:text-white"
        aria-label={t('notification.title')}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown — opens upward because the bell is at the bottom of the sidebar */}
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-80 rounded-xl border border-white/10 bg-gray-900 shadow-2xl" style={{ zIndex: 100 }}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <span className="text-sm font-semibold text-white/90">
              {t('notification.title')}
            </span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-gray-400">
                {t('notification.unreadCount', { count: unreadCount })}
              </span>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500">
                {t('notification.empty')}
              </p>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <a
                  key={n._id}
                  href={`/chef/proposals/${n.proposalId}`}
                  onClick={() => {
                    if (!n.read) markRead(n._id);
                  }}
                  className={`flex items-start gap-3 px-4 py-3 text-sm transition hover:bg-white/5 ${
                    !n.read ? 'border-l-2 border-purple-400 bg-white/[0.02]' : ''
                  }`}
                >
                  <span
                    className={`mt-1 h-2 w-2 shrink-0 rounded-full ${typeColor(n.type)}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`truncate ${!n.read ? 'font-medium text-white/90' : 'text-gray-400'}`}>
                      {n.message}
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-600">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                  {!n.read && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        markRead(n._id);
                      }}
                      className="shrink-0 text-[11px] text-gray-500 hover:text-white"
                    >
                      {t('notification.markRead')}
                    </button>
                  )}
                </a>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
