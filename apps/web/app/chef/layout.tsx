'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiClientError } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import AdminSidebar from '@/components/AdminSidebar';

interface AdminUser {
  _id: string;
  email: string;
  name: string;
}

export default function ChefLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
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
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AdminSidebar user={user} />
      <main className="ml-60 min-h-screen">{children}</main>
    </div>
  );
}
