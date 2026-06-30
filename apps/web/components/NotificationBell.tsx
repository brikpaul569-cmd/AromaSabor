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
    <>
      {/* Bell button — no longer relative, keeps its spot in the sidebar */}
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

      {/* Overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onMouseDown={() => setOpen(false)}
        >
          {/* Panel — stopPropagation so clicks inside don't close */}
          <div
            ref={ref}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-900 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <span className="text-base font-semibold text-white/90">
                {t('notification.title')}
              </span>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-gray-400">
                    {t('notification.unreadCount', { count: unreadCount })}
                  </span>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-gray-500 hover:bg-white/10 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-5 py-12 text-center text-sm text-gray-500">
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
                    className={`flex items-start gap-3 px-5 py-4 text-sm transition hover:bg-white/5 ${
                      !n.read ? 'border-l-2 border-purple-400 bg-white/[0.02]' : ''
                    }`}
                  >
                    <span
                      className={`mt-1 h-2 w-2 shrink-0 rounded-full ${typeColor(n.type)}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`${!n.read ? 'font-medium text-white/90' : 'text-gray-400'}`}>
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
        </div>
      )}
    </>
  );
}
