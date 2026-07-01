'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil } from 'lucide-react';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import PricingBreakdown from '@/components/PricingBreakdown';
import ProposalPlateEditor from '@/components/ProposalPlateEditor';
import type { ProposalPlateEditorProps } from '@/components/ProposalPlateEditor';
import ProposalTimeline from '@/components/ProposalTimeline';
import type { TimelineEvent } from '@/components/ProposalTimeline';

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
  slug?: string;
  categories?: MenuCategory[];
}

interface MenuCategory {
  id: string;
  label: string;
}

interface Proposal {
  _id: string;
  token: string;
  clientName: string;
  eventDate: string;
  guestCount: number;
  status: string;
  quotation: number;
  pricePerPlate?: number;
  totalPrice?: number;
  notes?: string;
  items: ProposalItem[];
  menuId: MenuRef;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  viewedAt?: string;
}

const STATUS_STYLES: Record<string, string> = {
  borrador: 'bg-gray-500/20 text-gray-300',
  enviado: 'bg-green-500/20 text-green-300',
  modificado_por_cliente: 'bg-yellow-500/20 text-yellow-300',
  modificado_por_chef: 'bg-purple-500/20 text-purple-300',
  respuesta_parcial: 'bg-yellow-500/20 text-yellow-300',
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

function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function ClientProposalDetailPage() {
  const params = useParams();
  const { t } = useTranslation();
  const id = params.id as string;

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);

  const fetchProposal = useCallback(() => {
    setLoading(true);
    api.get<Proposal>(`/proposals/client/${id}`)
      .then((data) => {
        setProposal(data);
        setNotFound(false);
      })
      .catch((err) => {
        if (err.statusCode === 404) setNotFound(true);
        else setError(err.message || t('proposals.errors.failedLoad'));
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch proposal on mount
  useEffect(() => {
    fetchProposal();
  }, [fetchProposal]);

  // Derive timeline events from proposal data
  useEffect(() => {
    if (!proposal) return;
    const events: TimelineEvent[] = [];

    events.push({ type: 'created', timestamp: proposal.createdAt, label: '' });

    if (proposal.status !== 'borrador') {
      events.push({ type: 'sent', timestamp: proposal.updatedAt, label: '' });
    }

    if (proposal.status === 'aceptado') {
      events.push({ type: 'accepted', timestamp: proposal.updatedAt, label: '' });
    } else if (proposal.status === 'rechazado') {
      events.push({ type: 'rejected', timestamp: proposal.updatedAt, label: '' });
    } else if (proposal.status === 'expirado') {
      events.push({ type: 'expired', timestamp: proposal.expiresAt, label: '' });
    }

    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    setTimelineEvents(events);
  }, [proposal]);

  const handleSave: ProposalPlateEditorProps['onSave'] = useCallback(
    async (items, guestCount, _reason) => {
      setIsSaving(true);
      setError(null);
      setSuccessMsg(null);
      try {
        const updated = await api.patch<Proposal>(`/proposals/client/${id}`, {
          items,
          guestCount,
        });
        setProposal(updated);
        setIsEditing(false);
        setSuccessMsg(t('proposals.edit.saved'));
        setTimeout(() => setSuccessMsg(null), 3000);
      } catch (err: any) {
        setError(err.message || t('proposals.errors.failedSave'));
      } finally {
        setIsSaving(false);
      }
    },
    [id],
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">{t('common.loading')}</p>
      </div>
    );
  }

  if (notFound || !proposal) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-white/60">{t('proposals.notFound')}</h1>
        <Link href="/client/proposals" className="mt-4 inline-block text-sm text-gray-500 hover:text-white">
          {t('proposals.back')}
        </Link>
      </div>
    );
  }

  const isExpired = proposal.status === 'expirado';
  const isTerminal = ['aceptado', 'rechazado'].includes(proposal.status);
  const canClientEdit = !isExpired && !isTerminal && proposal.status !== 'borrador';
  const viewedAt = proposal.viewedAt;
  const uniqueCategories = [
    ...new Map(proposal.items.map((i) => [i.categoryId, { id: i.categoryId, label: i.categoryLabel }])).values(),
  ];

  return (
    <div className="mx-auto max-w-3xl p-8">
      {/* Back navigation */}
      <Link
        href="/client/proposals"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-200"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('proposals.back')}
      </Link>

      {/* Expired banner */}
      {isExpired && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 px-5 py-4 text-center">
          <p className="text-lg font-semibold text-red-300">{t('public.proposal.expired')}</p>
          <p className="mt-1 text-sm text-red-400/80">{t('public.proposal.expiredDesc')}</p>
        </div>
      )}

      {/* Terminal banner */}
      {isTerminal && (
        <div className="mb-6 rounded-lg border border-green-500/20 bg-green-500/10 px-5 py-4 text-center">
          <p className="text-sm font-medium text-green-300">
            {proposal.status === 'aceptado'
              ? t('itemStatus.responseSent')
              : t('status.rechazado')}
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{proposal.clientName}</h1>
          <p className="mt-1 text-sm text-gray-500">{formatDate(proposal.eventDate)}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium ${STATUS_STYLES[proposal.status] || 'bg-gray-500/20 text-gray-300'}`}>
            {t('status.' + proposal.status)}
          </span>
          {canClientEdit && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Pencil className="h-3.5 w-3.5" />
              {t('proposals.edit.editItems')}
            </button>
          )}
        </div>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="mt-4 rounded-md bg-green-500/10 px-4 py-3 text-sm text-green-300">
          {successMsg}
          <button onClick={() => setSuccessMsg(null)} className="ml-3 underline">{t('common.close')}</button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-4 rounded-md bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
          <button onClick={() => setError(null)} className="ml-3 underline">{t('common.close')}</button>
        </div>
      )}

      {/* Info cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg bg-white/5 px-4 py-3">
          <p className="text-xs text-gray-500">{t('proposals.detail.menu')}</p>
          <p className="mt-1 text-sm font-medium">{proposal.menuId?.name || '—'}</p>
        </div>
        <div className="rounded-lg bg-white/5 px-4 py-3">
          <p className="text-xs text-gray-500">{t('proposals.detail.guests')}</p>
          <p className="mt-1 text-sm font-medium">{proposal.guestCount}</p>
        </div>
        <div className="rounded-lg bg-white/5 px-4 py-3">
          <p className="text-xs text-gray-500">{t('proposals.detail.perPlate')}</p>
          <p className="mt-1 text-sm font-medium">{formatPrice(proposal.pricePerPlate || 0)}</p>
        </div>
        <div className="rounded-lg bg-white/5 px-4 py-3">
          <p className="text-xs text-gray-500">{t('proposals.detail.total')}</p>
          <p className="mt-1 text-sm font-medium">{formatPrice(proposal.totalPrice || proposal.quotation)}</p>
        </div>
      </div>

      {/* Notes */}
      {proposal.notes && (
        <div className="mt-4 rounded-lg bg-white/5 px-4 py-3">
          <p className="text-xs text-gray-500">{t('proposals.detail.notes')}</p>
          <p className="mt-1 text-sm text-gray-300">{proposal.notes}</p>
        </div>
      )}

      {/* Editor or Items */}
      {isEditing ? (
        <div className="mt-8">
          <ProposalPlateEditor
            menuId={proposal.menuId._id}
            initialItems={proposal.items}
            guestCount={proposal.guestCount}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
            isSaving={isSaving}
          />
        </div>
      ) : (
        proposal.items.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-white/80">{t('proposals.detail.items')}</h2>
            <div className="flex flex-wrap gap-8">
              <div className="min-w-[280px] flex-1">
                <PricingBreakdown
                  items={proposal.items.map((i) => ({
                    _id: i._id,
                    name: i.name,
                    pricePerPortion: i.pricePerPortion,
                    categoryLabel: i.categoryLabel,
                  }))}
                  guestCount={proposal.guestCount}
                  categories={uniqueCategories}
                />
              </div>
              <div className="min-w-[200px] flex-1 space-y-2">
                {proposal.items.map((item) => {
                  const showItemStatus = proposal.status === 'respuesta_parcial';
                  const itemStatus = (item as any).itemStatus || 'pendiente';
                  const isAccepted = itemStatus === 'aceptado';
                  const isRejected = itemStatus === 'rechazado';
                  return (
                    <div key={item._id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">× {item.quantity}</span>
                        {showItemStatus && (
                          <span className={`text-xs font-medium ${isAccepted ? 'text-green-400' : isRejected ? 'text-red-400' : 'text-yellow-400'}`}>
                            {isAccepted
                              ? t('itemStatus.clientAccepted')
                              : isRejected
                                ? t('itemStatus.clientRejected')
                                : t('itemStatus.pending')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {proposal.status === 'respuesta_parcial' && (
                  <div className="mt-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-center text-sm text-yellow-300">
                    {t('itemStatus.waitingChef')}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      )}

      {/* Metadata */}
      <div className="mt-8 rounded-lg bg-white/5 px-4 py-3 text-xs text-gray-500">
        <p>{t('proposals.detail.id')}: {proposal._id.slice(-6).toUpperCase()}</p>
        <p className="mt-1">{t('proposals.detail.created')}: {formatDate(proposal.createdAt)}</p>
        {proposal.expiresAt && (
          <p className="mt-1">
            {t('proposals.detail.expires')}: {formatDate(proposal.expiresAt)}
            {new Date(proposal.expiresAt) < new Date() && proposal.status === 'enviado' && (
              <span className="ml-2 text-red-400">{t('proposals.detail.expired')}</span>
            )}
          </p>
        )}
        {viewedAt && (
          <p className="mt-1">{t('proposals.detail.viewedBy')}: {formatDateTime(viewedAt)}</p>
        )}
      </div>

      {/* Timeline */}
      {timelineEvents.length > 0 && (
        <div className="mt-8">
          <ProposalTimeline events={timelineEvents} />
        </div>
      )}
    </div>
  );
}
