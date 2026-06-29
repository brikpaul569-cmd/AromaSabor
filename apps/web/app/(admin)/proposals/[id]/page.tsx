'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import PricingBreakdown from '@/components/PricingBreakdown';
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
  notes?: string;
  items: ProposalItem[];
  menuId: MenuRef;
  createdBy: AdminRef;
  createdAt: string;
  expiresAt: string;
  viewedAt?: string;
  menu?: { categories: MenuCategory[] };
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
  const id = params.id as string;

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
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

  const handleSend = async () => {
    setSending(true);
    setSendError(null);
    try {
      const updated = await api.patch<Proposal>(`/proposals/${id}/send`);
      setProposal(updated);
      setShowConfirm(false);
    } catch (err: any) {
      setSendError(err.message || 'Failed to send proposal');
    } finally {
      setSending(false);
    }
  };

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
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (notFound || !proposal) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-white/60">Proposal not found</h1>
        <button onClick={() => router.push('/proposals')} className="mt-4 text-sm text-gray-500 hover:text-white">
          Back to proposals
        </button>
      </div>
    );
  }

  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/prop/${proposal.token}`;
  const canSend = proposal.status === 'borrador';
  const isSentOrExpired = ['enviado', 'expirado'].includes(proposal.status);
  const isTerminal = ['aceptado', 'rechazado'].includes(proposal.status);
  const clientViewed = !!proposal.viewedAt;
  const isActive = proposal.status === 'enviado' && clientViewed;

  const uniqueCategories = [...new Map(proposal.items.map((i) => [i.categoryId, { id: i.categoryId, label: i.categoryLabel }])).values()];

  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{proposal.clientName}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {formatDate(proposal.eventDate)} · Created by {proposal.createdBy?.name || 'Chef'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isActive && (
            <span className="rounded-full bg-green-500/20 px-4 py-1.5 text-sm font-medium text-green-300">Active</span>
          )}
          <span className={`rounded-full px-4 py-1.5 text-sm font-medium ${STATUS_STYLES[proposal.status] || 'bg-gray-500/20 text-gray-300'}`}>
            {STATUS_LABELS[proposal.status] || proposal.status}
          </span>
          {canSend && (
            <button onClick={() => setShowConfirm(true)}
              className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
              Send to Client
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
              <p className="text-xs text-blue-400">Public URL</p>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 truncate text-sm text-blue-200">{publicUrl}</code>
                <button onClick={handleCopyLink}
                  className="shrink-0 rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700">
                  {copied ? 'Copied!' : 'Copy'}
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

      {proposal.items.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-white/80">Items</h2>
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
      )}

      <div className="mt-8 rounded-lg bg-white/5 px-4 py-3 text-xs text-gray-500">
        <p>ID: {proposal._id}</p>
        {isSentOrExpired && <p className="mt-1">Token: {proposal.token}</p>}
        <p className="mt-1">Created: {formatDate(proposal.createdAt)}</p>
        {proposal.expiresAt && (
          <p className="mt-1">
            Expires: {formatDate(proposal.expiresAt)}
            {new Date(proposal.expiresAt) < new Date() && proposal.status === 'enviado' && (
              <span className="ml-2 text-red-400">(Expired)</span>
            )}
          </p>
        )}
        {proposal.viewedAt && (
          <p className="mt-1">Viewed by client: {formatDateTime(proposal.viewedAt)}</p>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-lg bg-gray-900 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white">Send to Client?</h3>
            <p className="mt-2 text-sm text-gray-400">
              This will set a 20-minute expiration timer. The client will receive a unique URL to view the proposal.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => { setShowConfirm(false); setSendError(null); }}
                className="rounded-md px-4 py-2 text-sm text-gray-400 hover:text-white" disabled={sending}>
                Cancel
              </button>
              <button onClick={handleSend} disabled={sending}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
