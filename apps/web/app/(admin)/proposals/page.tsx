'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

interface Proposal {
  _id: string;
  token: string;
  clientName: string;
  eventDate: string;
  guestCount: number;
  status: string;
  quotation: number;
  totalPrice?: number;
  createdAt: string;
  items: { _id: string; name: string }[];
}

const STATUS_COLORS: Record<string, string> = {
  borrador: 'bg-gray-500/20 text-gray-300',
  enviado: 'bg-blue-500/20 text-blue-300',
  modificado_por_cliente: 'bg-yellow-500/20 text-yellow-300',
  modificado_por_chef: 'bg-purple-500/20 text-purple-300',
  aceptado: 'bg-green-500/20 text-green-300',
  rechazado: 'bg-red-500/20 text-red-300',
  expirado: 'bg-red-500/10 text-red-400',
};

const FILTER_OPTIONS = ['all', 'borrador', 'enviado', 'modificado_por_cliente', 'modificado_por_chef', 'aceptado', 'rechazado', 'expirado'] as const;

function formatPrice(price: number): string {
  return '$' + price.toLocaleString('es-CO', { minimumFractionDigits: 2 });
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export default function ProposalsPage() {
  const { t } = useTranslation();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    api.get<Proposal[]>('/proposals')
      .then(setProposals)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? proposals : proposals.filter((p) => p.status === filter);

  const monthlyTotal = useMemo(() => {
    const now = new Date();
    return proposals
      .filter((p) => {
        const d = new Date(p.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && p.status === 'aceptado';
      })
      .reduce((sum, p) => sum + (p.totalPrice || p.quotation), 0);
  }, [proposals]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('proposals.title')}</h1>
        <Link
          href="/proposals/new"
          className="rounded-lg bg-white/10 px-4 py-2 text-sm transition hover:bg-white/20"
        >
          {t('proposals.new')}
        </Link>
      </div>

      {monthlyTotal > 0 && (
        <div className="mt-4 rounded-lg bg-green-500/10 px-4 py-3">
          <p className="text-xs text-green-400">{t('proposals.approvedThisMonth')}</p>
          <p className="text-lg font-semibold text-green-300">{formatPrice(monthlyTotal)}</p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              filter === f
                ? 'bg-white/20 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {f === 'all' ? t('proposals.filterAll') : t('status.' + f)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-8 text-gray-500">{t('common.loading')}</p>
      ) : filtered.length === 0 ? (
        <div className="mt-8 rounded-xl bg-white/5 p-8 text-center">
          <p className="text-gray-500">{t('proposals.noMatch')}</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {filtered.map((p) => (
            <Link
              key={p._id}
              href={`/proposals/${p._id}`}
              className="flex items-center justify-between rounded-lg bg-white/5 px-5 py-4 transition hover:bg-white/10"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">{p.clientName}</p>
                <p className="mt-0.5 text-sm text-gray-500">
                  {formatDate(p.eventDate)} · {p.items.length} items · {p.guestCount} guests
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">{formatPrice(p.quotation)}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[p.status] || 'bg-gray-500/20 text-gray-300'}`}>
                  {t('status.' + p.status)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
