'use client';

import { useEffect, useState } from 'react';
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
  respuesta_parcial: 'bg-yellow-500/10 text-yellow-400',
  aceptado: 'bg-green-500/10 text-green-400',
  rechazado: 'bg-red-500/10 text-red-400',
  expirado: 'bg-gray-500/10 text-gray-400',
};

function formatPrice(price: number): string {
  return '$' + price.toLocaleString('es-CO', { minimumFractionDigits: 2 });
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export default function ClientProposalsPage() {
  const { t } = useTranslation();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Proposal[]>('/proposals/client')
      .then(setProposals)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  };

  const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
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
          <h1 className="text-3xl font-bold tracking-tight">{t('client.myProposals')}</h1>
          <p className="mt-1.5 text-sm text-gray-500">
            {proposals.length} {t('dashboard.totalProposals')}
          </p>
        </div>
      </motion.div>

      {loading ? (
        <motion.p variants={fadeUp} className="mt-8 text-gray-500">{t('common.loading')}</motion.p>
      ) : proposals.length === 0 ? (
        <motion.div variants={fadeUp} className="mt-6 rounded-xl bg-surface p-12 text-center">
          <p className="text-gray-500">{t('client.proposalsEmpty')}</p>
          <p className="mt-1 text-sm text-gray-600">{t('client.proposalsEmptyMessage')}</p>
        </motion.div>
      ) : (
        <motion.div
          className="mt-6 space-y-3"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {proposals.map((p) => (
            <motion.div key={p._id} variants={fadeUp}>
              <Link
                href={`/client/proposals/${p._id}`}
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
