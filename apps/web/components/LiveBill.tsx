'use client';

import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { usePlateStore } from '@/stores/plate-store';
import { calculateQuotation } from '@aromasabor/utils';
import { useMemo } from 'react';

export interface LiveBillItem {
  _id: string;
  name: string;
  pricePerPortion: number;
}

interface LiveBillProps {
  items: LiveBillItem[];
}

function formatPrice(n: number): string {
  return '$' + n.toLocaleString('es-CO', { minimumFractionDigits: 2 });
}

export default function LiveBill({ items }: LiveBillProps) {
  const guestCount = usePlateStore((s) => s.guestCount);
  const setGuestCount = usePlateStore((s) => s.setGuestCount);

  const perPlate = useMemo(
    () => items.reduce((sum, i) => sum + i.pricePerPortion, 0),
    [items],
  );

  const grandTotal = useMemo(
    () => calculateQuotation(items.map((i) => ({ price: i.pricePerPortion, quantity: guestCount }))).total,
    [items, guestCount],
  );

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-neutral-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 md:px-6">
        {/* Price per person */}
        <div className="flex flex-col">
          <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
            Por persona
          </span>
          <AnimatedNumber
            value={perPlate}
            format={(n) => formatPrice(n)}
            className="text-lg font-bold text-white tabular-nums md:text-xl"
          />
        </div>

        {/* Guest count */}
        <div className="flex items-center gap-2 md:gap-3">
          <button
            type="button"
            onClick={() => setGuestCount(guestCount - 1)}
            disabled={guestCount <= 1}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-lg transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            value={guestCount}
            onChange={(e) => setGuestCount(Number(e.target.value))}
            className="h-12 w-16 rounded-lg bg-white/10 px-2 text-center text-lg font-bold text-white outline-none ring-1 ring-white/20 focus:ring-2 focus:ring-white/40 [appearance:textfield] md:w-20 md:text-xl [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={() => setGuestCount(guestCount + 1)}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-lg transition hover:bg-white/20"
          >
            +
          </button>
        </div>

        {/* Grand total */}
        <div className="flex flex-col items-end">
          <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
            Total
          </span>
          <AnimatedNumber
            value={grandTotal}
            format={(n) => formatPrice(n)}
            className="text-lg font-bold text-amber-400 tabular-nums md:text-xl"
          />
        </div>
      </div>
    </div>
  );
}
