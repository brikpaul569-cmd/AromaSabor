'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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

interface Proposal {
  _id: string;
  clientName: string;
  eventDate: string;
  guestCount: number;
  status: string;
  quotation: number;
  notes?: string;
  items: ProposalItem[];
  menuId: MenuRef;
  createdAt: string;
  expiresAt: string;
  viewedAt?: string;
}

const STATUS_LABELS: Record<string, string> = {
  borrador: 'Draft',
  enviado: 'Active',
  modificado_por_cliente: 'Modified by client',
  modificado_por_chef: 'Modified by chef',
  aceptado: 'Approved',
  rechazado: 'Rejected',
  expirado: 'Expired',
};

const STATUS_STYLES: Record<string, string> = {
  borrador: 'bg-gray-500/20 text-gray-300',
  enviado: 'bg-green-500/20 text-green-300',
  modificado_por_cliente: 'bg-yellow-500/20 text-yellow-300',
  modificado_por_chef: 'bg-purple-500/20 text-purple-300',
  aceptado: 'bg-green-500/20 text-green-300',
  rechazado: 'bg-red-500/20 text-red-300',
  expirado: 'bg-red-500/20 text-red-300',
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

export default function PublicProposalPage() {
  const params = useParams();
  const token = params.token as string;

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Proposal>(`/proposals/${token}`)
      .then(setProposal)
      .catch((err) => {
        if (err.statusCode === 404) setNotFound(true);
        else setError(err.message || 'Failed to load proposal');
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <p className="text-gray-500">Loading proposal...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-8">
        <h1 className="text-2xl font-bold text-white/60">Proposal not found</h1>
        <p className="mt-2 text-sm text-gray-500">The link may be invalid or expired.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-8">
        <h1 className="text-2xl font-bold text-red-400">Something went wrong</h1>
        <p className="mt-2 text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  if (!proposal) return null;

  const isExpired = proposal.status === 'expirado';
  const isActive = proposal.status === 'enviado';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="mx-auto max-w-3xl p-8">
        {/* Expired banner */}
        {isExpired && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 px-5 py-4 text-center">
            <p className="text-lg font-semibold text-red-300">This proposal has expired</p>
            <p className="mt-1 text-sm text-red-400/80">The 20-minute window to review this proposal has passed. Please contact the chef for an updated version.</p>
          </div>
        )}

        {/* Active banner */}
        {isActive && (
          <div className="mb-6 rounded-lg border border-green-500/20 bg-green-500/10 px-5 py-4 text-center">
            <p className="text-sm text-green-300">
              This proposal is active and ready for your review.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{proposal.clientName}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {formatDate(proposal.eventDate)}
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium ${STATUS_STYLES[proposal.status] || 'bg-gray-500/20 text-gray-300'}`}>
            {STATUS_LABELS[proposal.status] || proposal.status}
          </span>
        </div>

        {/* Info cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-white/5 px-4 py-3">
            <p className="text-xs text-gray-500">Menu</p>
            <p className="mt-1 text-sm font-medium text-white/80">{proposal.menuId?.name || '—'}</p>
          </div>
          <div className="rounded-lg bg-white/5 px-4 py-3">
            <p className="text-xs text-gray-500">Guests</p>
            <p className="mt-1 text-sm font-medium text-white/80">{proposal.guestCount}</p>
          </div>
          <div className="rounded-lg bg-white/5 px-4 py-3">
            <p className="text-xs text-gray-500">Total</p>
            <p className="mt-1 text-sm font-medium text-white/80">{formatPrice(proposal.quotation)}</p>
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
            <h2 className="mb-4 text-lg font-semibold text-white/80">Menu Items</h2>
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

        {/* Footer */}
        <div className="mt-8 border-t border-white/5 pt-4 text-center text-xs text-gray-600">
          <p>AromaSabor — Proposal</p>
        </div>
      </div>
    </div>
  );
}
