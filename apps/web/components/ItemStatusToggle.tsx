'use client';

import { useTranslation } from '@/lib/i18n';

interface ItemStatusToggleProps {
  itemId: string;
  itemName: string;
  currentStatus: string;
  onToggle: (itemId: string, newStatus: string) => void;
  disabled: boolean;
}

export default function ItemStatusToggle({
  itemId,
  itemName,
  currentStatus,
  onToggle,
  disabled,
}: ItemStatusToggleProps) {
  const { t } = useTranslation();
  const isPendiente = currentStatus === 'pendiente' || !currentStatus;
  const isAccepted = currentStatus === 'aceptado';
  const isRejected = currentStatus === 'rechazado';

  return (
    <div data-testid={`item-toggle-${itemName.toLowerCase().replace(/\s+/g, '-')}`} className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3">
      <span className="text-sm text-gray-300">{itemName}</span>
      <div className="flex items-center gap-2">
        {/* Aceptar button */}
        <button
          onClick={() => onToggle(itemId, 'pendiente')}
          disabled={disabled}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            isPendiente
              ? 'bg-yellow-500/30 text-yellow-300 ring-1 ring-yellow-500/50'
              : 'bg-white/5 text-gray-500 hover:bg-white/10'
          } disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {t('itemStatus.pending')}
        </button>

        {/* Aceptar button */}
        <button
          onClick={() => onToggle(itemId, 'aceptado')}
          disabled={disabled}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            isAccepted
              ? 'bg-green-500/30 text-green-300 ring-1 ring-green-500/50'
              : 'bg-white/5 text-gray-500 hover:bg-white/10'
          } disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {t('itemStatus.accept')}
        </button>

        {/* Rechazar button */}
        <button
          onClick={() => onToggle(itemId, 'rechazado')}
          disabled={disabled}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            isRejected
              ? 'bg-red-500/30 text-red-300 ring-1 ring-red-500/50'
              : 'bg-white/5 text-gray-500 hover:bg-white/10'
          } disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {t('itemStatus.reject')}
        </button>
      </div>
    </div>
  );
}
