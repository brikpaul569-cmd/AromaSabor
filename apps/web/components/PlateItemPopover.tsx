'use client';

export interface PopoverItem {
  _id: string;
  name: string;
  description?: string;
  portionGrams?: number;
  pricePerPortion: number;
  unit: string;
  categoryId: string;
}

interface PlateItemPopoverProps {
  item: PopoverItem;
  canReplace: boolean;
  onRemove: () => void;
  onReplace: () => void;
  onClose: () => void;
}

import { useTranslation } from '@/lib/i18n';

export default function PlateItemPopover({ item, canReplace, onRemove, onReplace, onClose }: PlateItemPopoverProps) {
  const { t } = useTranslation();
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 rounded-xl bg-gray-800 px-6 py-4 shadow-2xl ring-1 ring-white/20 animate-fadeIn">
        <p className="mb-3 text-sm font-medium text-white/80">{item.name}</p>
        <div className="flex gap-3">
          <button
            onClick={onRemove}
            className="rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/30"
          >
            {t('plate.popover.remove')}
          </button>
          <button
            onClick={onReplace}
            disabled={!canReplace}
            className="rounded-lg bg-blue-500/20 px-4 py-2 text-sm text-blue-300 transition hover:bg-blue-500/30 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {t('plate.popover.replace')}
          </button>
        </div>
      </div>
    </div>
  );
}
