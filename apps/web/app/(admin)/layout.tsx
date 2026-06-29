'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { api, ApiClientError } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import AdminSidebar from '@/components/AdminSidebar';

interface AdminUser {
  _id: string;
  email: string;
  name: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    if (pathname === '/login') {
      setChecking(false);
      return;
    }

    api.get<AdminUser>('/auth/me')
      .then((u) => {
        setUser(u);
        setChecking(false);
      })
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
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <p className="text-gray-500">{t('common.loading')}</p>
      </div>
    );
  }

  if (pathname === '/login') return <>{children}</>;

  return (
    <div className="min-h-screen bg-gray-950">
      <AdminSidebar user={user} />
      <main className="ml-60 min-h-screen">{children}</main>
    </div>
  );
}
