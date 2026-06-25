'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import PricingBreakdown from '@/components/PricingBreakdown';

type Category = 'entrada' | 'plato_fuerte' | 'guarnicion' | 'postre';

interface ProposalItem {
  _id: string;
  name: string;
  description: string;
  category: Category;
  price: number;
  quantity: number;
}

interface MenuRef {
  _id: string;
  name: string;
}

interface AdminRef {
  _id: string;
  name: string;
  email: string;
}

interface Proposal {
  _id: string;
  token: string;
  clientName: string;
  eventDate: string;
  guestCount: number;
  status: string;
  quotation: number;
  notes?: string;
  items: ProposalItem[];
  menuId: MenuRef;
  createdBy: AdminRef;
  createdAt: string;
  expiresAt: string;
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

function formatPrice(price: number): string {
  return '$' + price.toLocaleString('es-CO', { minimumFractionDigits: 2 });
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get<Proposal>(`/proposals/id/${id}`)
      .then(setProposal)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (notFound || !proposal) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-white/60">Proposal not found</h1>
        <button
          onClick={() => router.push('/proposals')}
          className="mt-4 text-sm text-gray-500 hover:text-white"
        >
          Back to proposals
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{proposal.clientName}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {formatDate(proposal.eventDate)} · Created by {proposal.createdBy?.name || 'Chef'}
          </p>
        </div>
        <span className={`rounded-full px-4 py-1.5 text-sm font-medium ${
          proposal.status === 'borrador' ? 'bg-gray-500/20 text-gray-300' : 'bg-blue-500/20 text-blue-300'
        }`}>
          {STATUS_LABELS[proposal.status] || proposal.status}
        </span>
      </div>

      {/* Info cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-white/5 px-4 py-3">
          <p className="text-xs text-gray-500">Menu</p>
          <p className="mt-1 text-sm font-medium">{proposal.menuId?.name || '—'}</p>
        </div>
        <div className="rounded-lg bg-white/5 px-4 py-3">
          <p className="text-xs text-gray-500">Guests</p>
          <p className="mt-1 text-sm font-medium">{proposal.guestCount}</p>
        </div>
        <div className="rounded-lg bg-white/5 px-4 py-3">
          <p className="text-xs text-gray-500">Total</p>
          <p className="mt-1 text-sm font-medium">{formatPrice(proposal.quotation)}</p>
        </div>
      </div>

      {proposal.notes && (
        <div className="mt-4 rounded-lg bg-white/5 px-4 py-3">
          <p className="text-xs text-gray-500">Notes</p>
          <p className="mt-1 text-sm text-gray-300">{proposal.notes}</p>
        </div>
      )}

      {/* Items + Pricing */}
      {proposal.items.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-white/80">Items</h2>
          <div className="flex flex-wrap gap-8">
            <div className="flex-1 min-w-[280px]">
              <PricingBreakdown items={proposal.items} guestCount={proposal.guestCount} />
            </div>
            <div className="flex-1 min-w-[200px] space-y-2">
              {proposal.items.map((item) => (
                <div key={item._id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{item.name}</span>
                  <span className="text-gray-500">× {item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="mt-8 rounded-lg bg-white/5 px-4 py-3 text-xs text-gray-500">
        <p>ID: {proposal._id}</p>
        <p className="mt-1">Token: {proposal.token}</p>
        <p className="mt-1">Created: {formatDate(proposal.createdAt)}</p>
      </div>
    </div>
  );
}
