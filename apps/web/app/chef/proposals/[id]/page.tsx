'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import PricingBreakdown from '@/components/PricingBreakdown';
import ProposalPlateEditor from '@/components/ProposalPlateEditor';
import type { ProposalPlateEditorProps } from '@/components/ProposalPlateEditor';
import QRCode from 'qrcode';

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

interface EditHistoryEntry {
  modifiedBy: string;
  modifiedAt: string;
  note?: string;
  reason?: string;
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
  createdBy: AdminRef;
  createdAt: string;
  expiresAt: string;
  viewedAt?: string;
  menu?: { categories: MenuCategory[] };
}

const STATUS_STYLES: Record<string, string> = {
  borrador: 'bg-gray-500/20 text-gray-300',
  enviado: 'bg-blue-500/20 text-blue-300',
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

function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const id = params.id as string;
  const [backLink, setBackLink] = useState('/proposals');

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<EditHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const qrGenerated = useRef(false);

  useEffect(() => {
    api.get<Proposal>(`/proposals/id/${id}`)
      .then(setProposal)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (proposal && !qrGenerated.current) {
      const url = `${window.location.origin}/prop/${proposal.token}`;
      QRCode.toDataURL(url, { width: 200, margin: 1 })
        .then(setQrDataUrl)
        .catch(() => {});
      qrGenerated.current = true;
    }
  }, [proposal]);

  const loadHistory = async () => {
    try {
      const data = await api.get<EditHistoryEntry[]>(`/proposals/id/${id}/history`);
      setHistory(data);
      setShowHistory(true);
    } catch {}
  };

  const handleSend = async () => {
    setSending(true);
    setSendError(null);
    try {
      const updated = await api.patch<Proposal>(`/proposals/${id}/send`);
      setProposal(updated);
      setShowConfirm(false);
    } catch (err: any) {
      setSendError(err.message || t('proposals.errors.failedSend'));
    } finally {
      setSending(false);
    }
  };

  const handleApprove = async () => {
    try {
      const updated = await api.patch<Proposal>(`/proposals/${id}/approve`);
      setProposal(updated);
    } catch (err: any) {
      setSendError(err.message || t('proposals.errors.failedApprove'));
    }
  };

  const handleReject = async () => {
    try {
      const updated = await api.patch<Proposal>(`/proposals/${id}/reject`);
      setProposal(updated);
    } catch (err: any) {
      setSendError(err.message || t('proposals.errors.failedReject'));
    }
  };

  const handleChefSave: ProposalPlateEditorProps['onSave'] = useCallback(
    async (items, guestCount, reason) => {
      setIsSaving(true);
      try {
        const updated = await api.patch<Proposal>(`/proposals/${id}`, { items, guestCount, reason });
        setProposal(updated);
        setIsEditing(false);
      } catch (err: any) {
        setSendError(err.message || t('proposals.errors.failedSave'));
      } finally {
        setIsSaving(false);
      }
    },
    [id],
  );

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/prop/${proposal?.token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">{t('common.loading')}</p>
      </div>
    );
  }

  if (notFound || !proposal) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-white/60">{t('proposals.notFound')}</h1>
        <button onClick={() => router.push('/proposals')} className="mt-4 text-sm text-gray-500 hover:text-white">
          {t('proposals.back')}
        </button>
      </div>
    );
  }

  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/prop/${proposal.token}`;
  const canSend = proposal.status === 'borrador';
  const canApprove = ['enviado', 'modificado_por_cliente', 'modificado_por_chef'].includes(proposal.status);
  const canReject = ['enviado', 'modificado_por_cliente', 'modificado_por_chef'].includes(proposal.status);
  const isSentOrExpired = ['enviado', 'expirado'].includes(proposal.status);
  const isTerminal = ['aceptado', 'rechazado'].includes(proposal.status);
  const canChefEdit = proposal.status === 'enviado' || proposal.status === 'modificado_por_cliente';
  const clientViewed = !!proposal.viewedAt;
  const isActive = proposal.status === 'enviado' && clientViewed;

  const uniqueCategories = [...new Map(proposal.items.map((i) => [i.categoryId, { id: i.categoryId, label: i.categoryLabel }])).values()];

  return (
    <div className="mx-auto max-w-3xl p-8">
      {/* Back navigation */}
      <Link
        href="/chef/proposals"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-200"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('proposals.back')}
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{proposal.clientName}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {formatDate(proposal.eventDate)} · {t('proposals.detail.created')}: {proposal.createdBy?.name || t('proposals.detail.chef')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isActive && (
            <span className="rounded-full bg-green-500/20 px-4 py-1.5 text-sm font-medium text-green-300">{t('status.active')}</span>
          )}
          <span className={`rounded-full px-4 py-1.5 text-sm font-medium ${STATUS_STYLES[proposal.status] || 'bg-gray-500/20 text-gray-300'}`}>
            {t('status.' + proposal.status)}
          </span>
          {canSend && (
            <button onClick={() => setShowConfirm(true)}
              className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
              {t('proposals.detail.sendToClient')}
            </button>
          )}
          {canChefEdit && !isEditing && (
            <button onClick={() => setIsEditing(true)}
              className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
              {t('proposals.edit.editItems')}
            </button>
          )}
          {canApprove && !isEditing && (
            <button onClick={handleApprove}
              className="rounded-md bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700">
              {t('proposals.detail.approve')}
            </button>
          )}
          {canReject && !isEditing && (
            <button onClick={handleReject}
              className="rounded-md bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700">
              {t('proposals.detail.reject')}
            </button>
          )}
        </div>
      </div>

      {sendError && (
        <div className="mt-4 rounded-md bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {sendError}
          <button onClick={() => setSendError(null)} className="ml-3 underline">Dismiss</button>
        </div>
      )}

      {isSentOrExpired && (
        <div className="mt-4 rounded-lg bg-blue-500/10 px-4 py-3">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-blue-400">{t('proposals.detail.publicUrl')}</p>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 truncate text-sm text-blue-200">{publicUrl}</code>
                <button onClick={handleCopyLink}
                  className="shrink-0 rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700">
                  {copied ? t('common.copied') : t('common.copy')}
                </button>
              </div>
            </div>
            {qrDataUrl && (
              <div className="shrink-0">
                <img src={qrDataUrl} alt="QR Code" className="h-20 w-20 rounded-md" />
              </div>
            )}
          </div>
        </div>
      )}

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

      {proposal.notes && (
        <div className="mt-4 rounded-lg bg-white/5 px-4 py-3">
          <p className="text-xs text-gray-500">{t('proposals.detail.notes')}</p>
          <p className="mt-1 text-sm text-gray-300">{proposal.notes}</p>
        </div>
      )}

      {isEditing ? (
        <div className="mt-8">
          <ProposalPlateEditor
            menuId={proposal.menuId._id}
            initialItems={proposal.items}
            guestCount={proposal.guestCount}
            onSave={handleChefSave}
            onCancel={() => setIsEditing(false)}
            isSaving={isSaving}
          />
        </div>
      ) : (
        proposal.items.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-white/80">{t('proposals.detail.items')}</h2>
            <div className={`flex flex-wrap gap-8 ${isSentOrExpired || isTerminal ? 'opacity-70' : ''}`}>
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
        )
      )}

      <div className="mt-8 flex items-center justify-between rounded-lg bg-white/5 px-4 py-3 text-xs text-gray-500">
        <div>
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
          {proposal.viewedAt && (
            <p className="mt-1">{t('proposals.detail.viewedBy')}: {formatDateTime(proposal.viewedAt)}</p>
          )}
        </div>
        <button onClick={loadHistory} className="text-blue-400 hover:text-blue-300 underline">
          {showHistory ? t('proposals.detail.refreshHistory') : t('proposals.detail.viewHistory')}
        </button>
      </div>

      {showHistory && (
        <div className="mt-4 rounded-lg bg-white/5 px-4 py-4">
          <h3 className="mb-3 text-sm font-semibold text-white/70">{t('proposals.detail.editHistory')}</h3>
          {history.length === 0 ? (
            <p className="text-sm text-gray-500">{t('proposals.detail.noHistory')}</p>
          ) : (
            <div className="space-y-3">
              {[...history].reverse().map((entry, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${entry.modifiedBy === 'chef' ? 'bg-blue-400' : 'bg-yellow-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-300">
                      <span className="font-medium">{entry.modifiedBy === 'chef' ? t('proposals.detail.chef') : t('proposals.detail.client')}</span>
                      <span className="text-gray-500"> · {formatDateTime(entry.modifiedAt)}</span>
                    </p>
                    {(entry.note || entry.reason) && (
                      <p className="mt-0.5 text-gray-500">{entry.note || entry.reason}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-lg bg-gray-900 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white">{t('proposals.detail.sendConfirm')}</h3>
            <p className="mt-2 text-sm text-gray-400">
              {t('proposals.detail.sendDesc')}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => { setShowConfirm(false); setSendError(null); }}
                className="rounded-md px-4 py-2 text-sm text-gray-400 hover:text-white" disabled={sending}>
                {t('common.cancel')}
              </button>
              <button onClick={handleSend} disabled={sending}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {sending ? t('proposals.detail.sending') : t('proposals.detail.sendToClient')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
