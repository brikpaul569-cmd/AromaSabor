'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { api } from '@/lib/api';
import NotificationBell from '@/components/NotificationBell';
import {
  LayoutDashboard,
  UtensilsCrossed,
  FileText,
  LogOut,
  ChefHat,
} from 'lucide-react';

interface AdminUser {
  _id: string;
  email: string;
  name: string;
}

interface AdminSidebarProps {
  user: AdminUser | null;
}

const NAV_ITEMS = [
  { href: '/chef/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { href: '/chef/menus', labelKey: 'nav.menus', icon: UtensilsCrossed },
  { href: '/chef/proposals', labelKey: 'nav.proposals', icon: FileText },
] as const;

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();

  const isActive = (href: string) => {
    if (href === '/chef/dashboard') return pathname === '/chef/dashboard';
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await api.post('/auth/logout');
    router.push('/login');
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r border-white/10 bg-gray-950">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-orange-500/20">
          <ChefHat className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">{t('app.title')}</p>
          <p className="text-[10px] text-gray-500 leading-tight">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 pt-6">
        {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'bg-gradient-to-r from-amber-500/15 to-orange-600/10 text-amber-400 shadow-sm shadow-amber-500/5'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? 'text-amber-400' : ''}`} />
              <span>{t(labelKey)}</span>
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Notification bell */}
      <div className="border-t border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">{t('notification.title')}</span>
          <NotificationBell />
        </div>
      </div>

      {/* User + Logout */}
      {user && (
        <div className="border-t border-white/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-bold text-white shadow-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-200">{user.name}</p>
              <p className="truncate text-[11px] text-gray-500">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-white/10 hover:text-red-400"
              title={t('auth.logout')}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
