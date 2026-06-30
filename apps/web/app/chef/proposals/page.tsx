'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
  borrador: 'bg-white/5 text-gray-400',
  enviado: 'bg-blue-500/10 text-blue-400',
  modificado_por_cliente: 'bg-amber-500/10 text-amber-400',
  modificado_por_chef: 'bg-purple-500/10 text-purple-400',
  aceptado: 'bg-green-500/10 text-green-400',
  rechazado: 'bg-red-500/10 text-red-400',
  expirado: 'bg-gray-500/10 text-gray-400',
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

  const stagger = {
    hidden: { opacity: 0 },
    visible: { transition: { staggerChildren: 0.04 } },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  };

  return (
    <motion.div
      className="p-8"
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.08 } },
      }}
    >
      <motion.div variants={fadeUp} className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('proposals.title')}</h1>
          <p className="mt-1.5 text-sm text-gray-500">{proposals.length} {t('dashboard.totalProposals')}</p>
        </div>
        <Link
          href="/chef/proposals/new"
          className="rounded-lg bg-brand-muted px-4 py-2 text-sm font-medium text-brand transition-colors duration-200 hover:bg-brand/20"
        >
          + {t('proposals.new')}
        </Link>
      </motion.div>

      {monthlyTotal > 0 && (
        <motion.div variants={fadeUp} className="mt-6 rounded-xl bg-surface px-5 py-4">
          <p className="text-xs text-green-400">{t('proposals.approvedThisMonth')}</p>
          <p className="mt-1 text-2xl font-bold text-green-300">{formatPrice(monthlyTotal)}</p>
        </motion.div>
      )}

      <motion.div variants={fadeUp} className="mt-6 flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
              filter === f
                ? 'bg-brand-muted text-brand'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
            }`}
          >
            {f === 'all' ? t('proposals.filterAll') : t('status.' + f)}
          </button>
        ))}
      </motion.div>

      {loading ? (
        <motion.p variants={fadeUp} className="mt-8 text-gray-500">{t('common.loading')}</motion.p>
      ) : filtered.length === 0 ? (
        <motion.div variants={fadeUp} className="mt-6 rounded-xl bg-surface p-12 text-center">
          <p className="text-gray-500">{t('proposals.noMatch')}</p>
        </motion.div>
      ) : (
        <motion.div
          className="mt-6 space-y-3"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {filtered.map((p) => (
            <motion.div key={p._id} variants={fadeUp}>
              <Link
                href={`/chef/proposals/${p._id}`}
                className="flex items-center justify-between rounded-xl bg-surface px-5 py-4 transition-all duration-200 hover:bg-[#1E2533] hover:-translate-y-0.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white/90">{p.clientName}</p>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {formatDate(p.eventDate)} · {p.items.length} {t('menus.editor.items')} · {p.guestCount} {t('proposals.detail.guests')}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">{formatPrice(p.quotation)}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[p.status] || 'bg-white/5 text-gray-400'}`}>
                    {t('status.' + p.status)}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
