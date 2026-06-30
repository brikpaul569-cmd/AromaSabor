'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

interface MenuItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export default function MenusPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<MenuItem[]>('/menus')
      .then(setMenus)
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <div className="p-8"><p className="text-gray-500">{t('common.loading')}</p></div>;

  return (
    <div className="p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('menus.title')}</h1>
          <p className="mt-1.5 text-sm text-gray-500">{menus.length} {t('menus.editor.items')}</p>
        </div>
        <button
          onClick={() => router.push('/chef/menus/new')}
          className="rounded-lg bg-brand-muted px-4 py-2 text-sm font-medium text-brand transition-colors duration-200 hover:bg-brand/20"
        >
          + {t('menus.new')}
        </button>
      </div>

      {menus.length === 0 ? (
        <div className="mt-6 rounded-xl bg-surface p-12 text-center">
          <p className="text-gray-500">{t('menus.empty')}</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {menus.map((menu) => (
            <button
              key={menu._id}
              onClick={() => router.push(`/chef/menus/${menu._id}`)}
              className="group w-full rounded-xl bg-surface p-6 text-left transition-all duration-200 hover:bg-[#1E2533] hover:-translate-y-0.5"
            >
              <h2 className="text-lg font-semibold text-white/90 group-hover:text-white transition-colors duration-200">{menu.name}</h2>
              {menu.description && (
                <p className="mt-1.5 text-sm text-gray-500 line-clamp-2">{menu.description}</p>
              )}
              <div className="mt-4 flex items-center gap-2">
                <span className={`inline-block h-2 w-2 rounded-full ${menu.isActive ? 'bg-green-400' : 'bg-gray-500'}`} />
                <span className="text-xs text-gray-500">{menu.isActive ? t('menus.active') : t('menus.draft')}</span>
                <span className="ml-auto text-xs text-gray-500">/{menu.slug}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
