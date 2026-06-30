'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import PricingBreakdown from '@/components/PricingBreakdown';
import ProposalPlateEditor from '@/components/ProposalPlateEditor';
import type { ProposalPlateEditorProps } from '@/components/ProposalPlateEditor';

interface ProposalItem {
  _id: string;
  name: string;
  description: string;
  categoryId: string;
  categoryLabel: string;
  pricePerPortion: number;
  portionGrams?: number;
  unit: string;
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
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default function PublicProposalPage() {
  const params = useParams();
  const { t } = useTranslation();
  const token = params.token as string;

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  useEffect(() => {
    api.get<Proposal>(`/proposals/${token}`)
      .then(setProposal)
      .catch((err) => {
        if (err.statusCode === 404) setNotFound(true);
        else setError(err.message || t('proposals.errors.failedLoad'));
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleClientSave: ProposalPlateEditorProps['onSave'] = useCallback(
    async (items, guestCount, reason) => {
      setIsSaving(true);
      try {
        await api.patch(`/proposals/token/${token}/items`, { items, guestCount, reason });
        const updated = await api.get<Proposal>(`/proposals/${token}`);
        setProposal(updated);
        setIsEditing(false);
      } catch (err: any) {
        setError(err.message || t('proposals.errors.failedSave'));
      } finally {
        setIsSaving(false);
      }
    },
    [token],
  );

  const handleApprove = useCallback(async () => {
    setIsApproving(true);
    setActionMsg(null);
    try {
      const updated = await api.patch<Proposal>(`/proposals/token/${token}/approve`);
      setProposal(updated);
    } catch (err: any) {
      setActionMsg(err.message || 'Error al aprobar');
    } finally {
      setIsApproving(false);
    }
  }, [token]);

  const handleReject = useCallback(async () => {
    setIsApproving(true);
    setActionMsg(null);
    try {
      const updated = await api.patch<Proposal>(`/proposals/token/${token}/reject`);
      setProposal(updated);
    } catch (err: any) {
      setActionMsg(err.message || 'Error al rechazar');
    } finally {
      setIsApproving(false);
    }
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <p className="text-gray-500">{t('public.proposal.loading')}</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-8">
        <h1 className="text-2xl font-bold text-white/60">{t('public.proposal.notFound')}</h1>
        <p className="mt-2 text-sm text-gray-500">{t('public.proposal.notFoundDesc')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-8">
        <h1 className="text-2xl font-bold text-red-400">{t('common.error')}</h1>
        <p className="mt-2 text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  if (!proposal) return null;

  const isExpired = proposal.status === 'expirado' || new Date(proposal.expiresAt) < new Date();
  const isActive = proposal.status === 'enviado';
  const canClientEdit = proposal.status === 'enviado' || proposal.status === 'modificado_por_chef';
  const canClientApprove = ['enviado', 'modificado_por_chef', 'modificado_por_cliente'].includes(proposal.status);
  const isTerminal = ['aceptado', 'rechazado', 'expirado'].includes(proposal.status);
  const uniqueCategories = [...new Map(proposal.items.map((i) => [i.categoryId, { id: i.categoryId, label: i.categoryLabel }])).values()];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="mx-auto max-w-3xl p-8">
        {isExpired && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 px-5 py-4 text-center">
            <p className="text-lg font-semibold text-red-300">{t('public.proposal.expired')}</p>
            <p className="mt-1 text-sm text-red-400/80">{t('public.proposal.expiredDesc')}</p>
          </div>
        )}

        {isActive && (
          <div className="mb-6 rounded-lg border border-green-500/20 bg-green-500/10 px-5 py-4 text-center">
            <p className="text-sm text-green-300">{t('public.proposal.active')}</p>
          </div>
        )}

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{proposal.clientName}</h1>
            <p className="mt-1 text-sm text-gray-500">{formatDate(proposal.eventDate)}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium ${STATUS_STYLES[proposal.status] || 'bg-gray-500/20 text-gray-300'}`}>
              {t('status.' + proposal.status)}
            </span>
            {canClientEdit && !isEditing && !isExpired && (
              <button onClick={() => setIsEditing(true)}
                className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
                {t('proposals.edit.editItems')}
              </button>
            )}
            {canClientApprove && !isEditing && !isTerminal && !isExpired && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReject}
                  disabled={isApproving}
                  className="rounded-md bg-red-600/80 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {isApproving ? '...' : t('proposals.detail.reject')}
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="rounded-md bg-green-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
                >
                  {isApproving ? '...' : t('proposals.detail.approve')}
                </button>
              </div>
            )}
          </div>
      </div>

      {actionMsg && (
        <div className="mt-4 rounded-md bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {actionMsg}
          <button onClick={() => setActionMsg(null)} className="ml-3 underline">Dismiss</button>
        </div>
      )}

      {isEditing ? (
          <div className="mt-8">
            <ProposalPlateEditor
              menuId={proposal.menuId._id}
              initialItems={proposal.items}
              guestCount={proposal.guestCount}
              onSave={handleClientSave}
              onCancel={() => setIsEditing(false)}
              isSaving={isSaving}
            />
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-white/5 px-4 py-3">
                <p className="text-xs text-gray-500">{t('public.proposal.menu')}</p>
                <p className="mt-1 text-sm font-medium text-white/80">{proposal.menuId?.name || '—'}</p>
              </div>
              <div className="rounded-lg bg-white/5 px-4 py-3">
                <p className="text-xs text-gray-500">{t('public.proposal.guests')}</p>
                <p className="mt-1 text-sm font-medium text-white/80">{proposal.guestCount}</p>
              </div>
              <div className="rounded-lg bg-white/5 px-4 py-3">
                <p className="text-xs text-gray-500">{t('public.proposal.total')}</p>
                <p className="mt-1 text-sm font-medium text-white/80">{formatPrice(proposal.quotation)}</p>
              </div>
            </div>

            {proposal.notes && (
              <div className="mt-4 rounded-lg bg-white/5 px-4 py-3">
                <p className="text-xs text-gray-500">{t('public.proposal.notes')}</p>
                <p className="mt-1 text-sm text-gray-300">{proposal.notes}</p>
              </div>
            )}

            {proposal.items.length > 0 && (
              <div className="mt-8">
                <h2 className="mb-4 text-lg font-semibold text-white/80">{t('public.proposal.menuItems')}</h2>
                <div className="flex flex-wrap gap-8">
                  <div className="flex-1 min-w-[280px]">
                    <PricingBreakdown
                      items={proposal.items.map((i) => ({ _id: i._id, name: i.name, pricePerPortion: i.pricePerPortion, categoryLabel: i.categoryLabel }))}
                      guestCount={proposal.guestCount}
                      categories={uniqueCategories}
                    />
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

            <div className="mt-8 border-t border-white/5 pt-4 text-center text-xs text-gray-600">
              <p>{t('app.footer')}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
