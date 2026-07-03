'use client';

import { calculateQuotation, formatPrice } from '@aromasabor/utils';
import { useTranslation } from '@/lib/i18n';

export interface PricingItem {
  _id: string;
  name: string;
  pricePerPortion: number;
  categoryLabel?: string;
}

interface PricingBreakdownProps {
  items: PricingItem[];
  guestCount: number;
  categories: { id: string; label: string }[];
}

export default function PricingBreakdown({ items, guestCount, categories }: PricingBreakdownProps) {
  const { t } = useTranslation();
  const perPlate = items.reduce((sum, i) => sum + i.pricePerPortion, 0);
  const q = calculateQuotation(
    items.map((i) => ({ price: i.pricePerPortion, quantity: guestCount })),
  );

  if (items.length === 0) {
    return (
      <div className="w-full max-w-xs rounded-xl border border-white/10 bg-neutral-950/50 px-4 py-3 text-sm text-gray-500 backdrop-blur-md">
        <p className="text-center">{t('pricing.selectItems')}</p>
      </div>
    );
  }

  const catTotals = new Map<string, number>();
  for (const item of items) {
    const label = item.categoryLabel || t('pricing.other');
    catTotals.set(label, (catTotals.get(label) || 0) + item.pricePerPortion);
  }

  return (
    <div className="w-full max-w-xs rounded-xl border border-white/10 bg-neutral-950/50 px-4 py-3 text-sm backdrop-blur-md">
      {categories.map((cat) => {
        const total = catTotals.get(cat.label);
        if (!total) return null;
        return (
          <div key={cat.id} className="flex justify-between text-gray-400">
            <span>{cat.label}</span>
            <span>{formatPrice(total)}</span>
          </div>
        );
      })}

      <hr className="my-2 border-white/10" />

      <div className="flex justify-between text-gray-300">
        <span>{t('pricing.pricePerPlate')}</span>
        <span>{formatPrice(perPlate)}</span>
      </div>
      <div className="flex justify-between text-gray-500">
        <span>{t('pricing.guestCount')}</span>
        <span>× {guestCount}</span>
      </div>

      <hr className="my-2 border-white/10" />

      <div className="flex justify-between text-gray-200">
        <span>{t('pricing.subtotal')}</span>
        <span>{formatPrice(q.subtotal)}</span>
      </div>
      <div className="flex justify-between text-gray-400">
        <span>{t('pricing.iva')}</span>
        <span>{formatPrice(q.tax)}</span>
      </div>
      <div className="mt-1 flex justify-between font-semibold text-white">
        <span>{t('pricing.total')}</span>
        <span>{formatPrice(q.total)}</span>
      </div>
    </div>
  );
}
