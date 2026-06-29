'use client';

import { calculateQuotation } from '@aromasabor/utils';

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

function formatPrice(price: number): string {
  return '$' + price.toLocaleString('es-CO', { minimumFractionDigits: 2 });
}

export default function PricingBreakdown({ items, guestCount, categories }: PricingBreakdownProps) {
  const perPlate = items.reduce((sum, i) => sum + i.pricePerPortion, 0);
  const q = calculateQuotation(
    items.map((i) => ({ price: i.pricePerPortion, quantity: guestCount })),
  );

  if (items.length === 0) {
    return (
      <div className="w-full max-w-xs rounded-lg bg-white/5 px-4 py-3 text-sm text-gray-500">
        <p className="text-center">Select items to see pricing</p>
      </div>
    );
  }

  const catTotals = new Map<string, number>();
  for (const item of items) {
    const label = item.categoryLabel || 'Other';
    catTotals.set(label, (catTotals.get(label) || 0) + item.pricePerPortion);
  }

  return (
    <div className="w-full max-w-xs rounded-lg bg-white/5 px-4 py-3 text-sm">
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
        <span>Price per plate</span>
        <span>{formatPrice(perPlate)}</span>
      </div>
      <div className="flex justify-between text-gray-500">
        <span>Number of people</span>
        <span>× {guestCount}</span>
      </div>

      <hr className="my-2 border-white/10" />

      <div className="flex justify-between text-gray-200">
        <span>Subtotal</span>
        <span>{formatPrice(q.subtotal)}</span>
      </div>
      <div className="flex justify-between text-gray-400">
        <span>IVA (16%)</span>
        <span>{formatPrice(q.tax)}</span>
      </div>
      <div className="mt-1 flex justify-between font-semibold text-white">
        <span>Total</span>
        <span>{formatPrice(q.total)}</span>
      </div>
    </div>
  );
}
