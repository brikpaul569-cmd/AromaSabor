'use client';

import { calculateQuotation } from '@aromasabor/utils';

type Category = 'entrada' | 'plato_fuerte' | 'guarnicion' | 'postre';

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  category: Category;
  price: number;
  weight?: number;
}

interface PricingBreakdownProps {
  items: MenuItem[];
  guestCount: number;
}

const CATEGORY_LABELS: Record<Category, string> = {
  entrada: 'Entrada',
  plato_fuerte: 'Plato Fuerte',
  guarnicion: 'Guarnición',
  postre: 'Postre',
};

function formatPrice(price: number): string {
  return '$' + price.toLocaleString('es-CO', { minimumFractionDigits: 2 });
}

export default function PricingBreakdown({ items, guestCount }: PricingBreakdownProps) {
  const perPlate = items.reduce((sum, i) => sum + i.price, 0);
  const q = calculateQuotation(
    items.map((i) => ({ price: i.price, quantity: guestCount }))
  );

  const categories: Record<Category, MenuItem[]> = {
    entrada: [],
    plato_fuerte: [],
    guarnicion: [],
    postre: [],
  };
  for (const item of items) {
    categories[item.category]?.push(item);
  }

  const activeCategories = (Object.keys(categories) as Category[]).filter(
    (c) => categories[c].length > 0
  );

  if (items.length === 0) {
    return (
      <div className="w-full max-w-xs rounded-lg bg-white/5 px-4 py-3 text-sm text-gray-500">
        <p className="text-center">Select items to see pricing</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xs rounded-lg bg-white/5 px-4 py-3 text-sm">
      {activeCategories.map((cat) => {
        const catTotal = categories[cat].reduce((s, i) => s + i.price, 0);
        return (
          <div key={cat} className="flex justify-between text-gray-400">
            <span>{CATEGORY_LABELS[cat]}</span>
            <span>{formatPrice(catTotal)}</span>
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
