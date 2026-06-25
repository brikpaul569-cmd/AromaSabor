'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface ProposalItem {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  quantity: number;
}

interface Proposal {
  _id: string;
  token: string;
  clientName: string;
  eventDate: string;
  guestCount: number;
  status: string;
  quotation: number;
  createdAt: string;
  items: ProposalItem[];
}

const STATUS_LABELS: Record<string, string> = {
  borrador: 'Draft',
  enviado: 'Sent',
  modificado_por_cliente: 'Modified by client',
  modificado_por_chef: 'Modified by chef',
  aceptado: 'Approved',
  rechazado: 'Rejected',
  expirado: 'Expired',
};

const STATUS_COLORS: Record<string, string> = {
  borrador: 'bg-gray-500/20 text-gray-300',
  enviado: 'bg-blue-500/20 text-blue-300',
  modificado_por_cliente: 'bg-yellow-500/20 text-yellow-300',
  modificado_por_chef: 'bg-purple-500/20 text-purple-300',
  aceptado: 'bg-green-500/20 text-green-300',
  rechazado: 'bg-red-500/20 text-red-300',
  expirado: 'bg-red-500/10 text-red-400',
};

function formatPrice(price: number): string {
  return '$' + price.toLocaleString('es-CO', { minimumFractionDigits: 2 });
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Proposal[]>('/proposals')
      .then(setProposals)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Proposals</h1>
        <Link
          href="/proposals/new"
          className="rounded-lg bg-white/10 px-4 py-2 text-sm transition hover:bg-white/20"
        >
          New Proposal
        </Link>
      </div>

      {loading ? (
        <p className="mt-8 text-gray-500">Loading...</p>
      ) : proposals.length === 0 ? (
        <div className="mt-8 rounded-xl bg-white/5 p-8 text-center">
          <p className="text-gray-500">No proposals yet. Create your first one.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {proposals.map((p) => (
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
                  {STATUS_LABELS[p.status] || p.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
