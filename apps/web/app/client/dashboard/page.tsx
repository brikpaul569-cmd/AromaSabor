'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  ClipboardList,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

interface ClientUser {
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

const STATUS_BADGE_STYLES: Record<string, string> = {
  aceptado: 'bg-green-500/10 text-green-400',
  rechazado: 'bg-red-500/10 text-red-400',
  enviado: 'bg-blue-500/10 text-blue-400',
  borrador: 'bg-white/5 text-gray-400',
  modificado_por_cliente: 'bg-amber-500/10 text-amber-400',
  modificado_por_chef: 'bg-purple-500/10 text-purple-400',
  respuesta_parcial: 'bg-yellow-500/10 text-yellow-400',
  expirado: 'bg-gray-500/10 text-gray-400',
};

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium leading-tight ${STATUS_BADGE_STYLES[status] ?? 'bg-white/5 text-gray-400'}`}>
      {t('status.' + status)}
    </span>
  );
}

export default function ClientDashboardPage() {
  const { t } = useTranslation();
  const [user, setUser] = useState<ClientUser | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<ClientUser>('/auth/client/me').catch(() => null),
      api.get<Proposal[]>('/proposals/client'),
    ])
      .then(([userData, proposalsData]) => {
        setUser(userData);
        setProposals(proposalsData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">{t('common.loading')}</p>
      </div>
    );
  }

  const totalProposals = proposals.length;
  const pendingCount = proposals.filter((p) => p.status === 'enviado').length;
  const respondedCount = proposals.filter((p) =>
    ['aceptado', 'rechazado', 'respuesta_parcial', 'modificado_por_cliente'].includes(p.status)
  ).length;
  const recent = proposals.slice(0, 5);

  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  };

  const stagger = {
    hidden: { opacity: 0 },
    visible: { transition: { staggerChildren: 0.05 } },
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
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('client.dashboard')}</h1>
          {user && (
            <p className="mt-1.5 text-base font-medium text-white/70">
              {t('dashboard.welcome', { name: user.name })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-surface px-4 py-2.5 text-sm text-gray-400">
          <CalendarDays className="h-4 w-4 text-brand" />
          <span suppressHydrationWarning>
            {new Date().toLocaleDateString('es-CO', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </span>
        </div>
      </motion.div>

      {/* Stats cards */}
      <motion.div variants={fadeUp} className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link href="/client/proposals" className="group relative rounded-xl bg-surface p-6 transition-all duration-200 hover:bg-white/[0.04] hover:-translate-y-0.5">
          <ClipboardList className="absolute right-4 top-4 h-5 w-5 text-white/10 group-hover:text-brand/30 transition-colors duration-200" />
          <p className="text-3xl font-bold text-white">{totalProposals}</p>
          <p className="mt-1 text-sm text-gray-500">{t('dashboard.totalProposals')}</p>
        </Link>
        <Link href="/client/proposals" className="group relative rounded-xl bg-surface p-6 transition-all duration-200 hover:bg-white/[0.04] hover:-translate-y-0.5">
          <Send className="absolute right-4 top-4 h-5 w-5 text-white/10 group-hover:text-brand/30 transition-colors duration-200" />
          <p className="text-3xl font-bold text-brand-light">{pendingCount}</p>
          <p className="mt-1 text-sm text-gray-500">{t('client.dashboardPending')}</p>
        </Link>
        <Link href="/client/proposals" className="group relative rounded-xl bg-surface p-6 transition-all duration-200 hover:bg-white/[0.04] hover:-translate-y-0.5">
          <CheckCircle2 className="absolute right-4 top-4 h-5 w-5 text-white/10 group-hover:text-brand/30 transition-colors duration-200" />
          <p className="text-3xl font-bold text-green-400">{respondedCount}</p>
          <p className="mt-1 text-sm text-gray-500">{t('client.dashboardResponded')}</p>
        </Link>
      </motion.div>

      {/* Recent proposals */}
      <motion.div variants={fadeUp} className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white/80">{t('dashboard.recentProposals')}</h2>
          <Link href="/client/proposals" className="text-sm text-gray-500 hover:text-white transition-colors duration-200">
            {t('common.viewAll')}
          </Link>
        </div>

        {recent.length === 0 ? (
          <motion.div variants={fadeUp} className="mt-4 rounded-xl bg-surface p-8 text-center">
            <p className="text-gray-500">{t('client.proposalsEmpty')}</p>
            <p className="mt-1 text-sm text-gray-600">{t('client.proposalsEmptyMessage')}</p>
          </motion.div>
        ) : (
          <motion.div
            className="mt-4 space-y-3"
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            {recent.map((p) => (
              <motion.div key={p._id} variants={fadeUp}>
                <Link
                  href={`/client/proposals/${p._id}`}
                  className="flex items-center justify-between rounded-xl bg-surface px-5 py-4 transition-all duration-200 hover:bg-[#1E2533] hover:-translate-y-0.5"
                >
                  <span className="text-sm font-medium text-white/90">{p.clientName}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400">{formatPrice(p.quotation)}</span>
                    <StatusBadge status={p.status} />
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
