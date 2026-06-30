'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

interface AdminUser {
  _id: string;
  email: string;
  name: string;
}

interface Proposal {
  _id: string;
  clientName: string;
  status: string;
  quotation: number;
  createdAt: string;
}

function formatPrice(price: number): string {
  return '$' + price.toLocaleString('es-CO', { minimumFractionDigits: 2 });
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<AdminUser>('/auth/me').catch(() => null),
      api.get<Proposal[]>('/proposals'),
    ])
      .then(([user, proposals]) => {
        setAdmin(user);
        setProposals(proposals);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8"><p className="text-gray-500">{t('common.loading')}</p></div>;

  const totalProposals = proposals.length;
  const sentCount = proposals.filter((p) => p.status === 'enviado').length;
  const draftCount = proposals.filter((p) => p.status === 'borrador').length;
  const recent = proposals.slice(0, 5);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
          {admin && <p className="mt-1 text-gray-400">{t('dashboard.welcome', { name: admin.name })}</p>}
        </div>
      </div>

      {/* Stats cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link href="/chef/proposals" className="rounded-xl bg-white/5 p-6 transition hover:bg-white/10">
          <p className="text-3xl font-bold">{totalProposals}</p>
          <p className="mt-1 text-sm text-gray-500">{t('dashboard.totalProposals')}</p>
        </Link>
        <Link href="/chef/proposals" className="rounded-xl bg-white/5 p-6 transition hover:bg-white/10">
          <p className="text-3xl font-bold text-blue-300">{sentCount}</p>
          <p className="mt-1 text-sm text-gray-500">{t('dashboard.sent')}</p>
        </Link>
        <Link href="/chef/proposals" className="rounded-xl bg-white/5 p-6 transition hover:bg-white/10">
          <p className="text-3xl font-bold text-gray-300">{draftCount}</p>
          <p className="mt-1 text-sm text-gray-500">{t('dashboard.drafts')}</p>
        </Link>
      </div>

      {/* Recent proposals */}
      <div className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white/80">{t('dashboard.recentProposals')}</h2>
          <Link href="/chef/proposals" className="text-sm text-gray-500 hover:text-white">{t('common.viewAll')}</Link>
        </div>

        {recent.length === 0 ? (
          <div className="mt-4 rounded-xl bg-white/5 p-8 text-center">
            <p className="text-gray-500">{t('dashboard.noProposals')}</p>
            <Link
              href="/proposals/new"
              className="mt-2 inline-block text-sm text-blue-400 hover:text-blue-300"
            >
              {t('dashboard.createFirst')}
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {recent.map((p) => (
              <Link
                key={p._id}
                href={`/proposals/${p._id}`}
                className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3 transition hover:bg-white/10"
              >
                <span className="text-sm font-medium">{p.clientName}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">{formatPrice(p.quotation)}</span>
                  <span className="text-xs text-gray-500">
                    {t('status.' + p.status)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
