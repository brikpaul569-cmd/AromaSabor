'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { api, ApiClientError } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (pathname === '/login') {
      setChecking(false);
      return;
    }

    api.get<{ _id: string; email: string; name: string }>('/auth/me')
      .then(() => setChecking(false))
      .catch((err) => {
        if (err instanceof ApiClientError && err.statusCode === 401) {
          router.push('/login');
        } else {
          setChecking(false);
        }
      });
  }, [pathname, router]);

  if (checking && pathname !== '/login') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">{t('common.loading')}</p>
      </div>
    );
  }

  if (pathname === '/login') return <>{children}</>;

  return (
    <div>
      <nav className="flex items-center gap-6 border-b border-white/10 px-8 py-4">
        <a href="/dashboard" className="text-sm font-medium text-white/70 hover:text-white">
          {t('nav.dashboard')}
        </a>
        <a href="/menus" className="text-sm font-medium text-white/70 hover:text-white">
          {t('nav.menus')}
        </a>
        <a href="/proposals" className="text-sm font-medium text-white/70 hover:text-white">
          {t('nav.proposals')}
        </a>
      </nav>
      <main>{children}</main>
    </div>
  );
}
