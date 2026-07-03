'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { UtensilsCrossed } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

export interface PlateItem {
  _id: string;
  name: string;
  description?: string;
  portionGrams?: number;
  pricePerPortion: number;
  unit: string;
  categoryId: string;
  categoryLabel?: string;
  imageUrl?: string;
}

export interface PlateViewProps {
  items: PlateItem[];
  categoryOrder: { id: string; label: string; color: string }[];
  onItemTap?: (item: PlateItem) => void;
}

const colorMap: Record<string, string> = {
  'bg-red-800/50': '#991b1b',
  'bg-yellow-700/50': '#a16207',
  'bg-green-800/50': '#166534',
  'bg-amber-800/60': '#92400e',
  'bg-blue-800/50': '#1e40af',
  'bg-purple-800/50': '#6b21a8',
  'bg-pink-800/50': '#9d174d',
  'bg-indigo-800/50': '#3730a3',
};

function toHex(colorClass: string): string {
  return colorMap[colorClass] ?? '#4b5563';
}

function PlateSvgBase() {
  return (
    <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <radialGradient id="plate-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.04)" />
          <stop offset="80%" stopColor="rgba(255,255,255,0.01)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="185" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" />
      <circle cx="200" cy="200" r="170" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
      <circle cx="200" cy="200" r="155" fill="url(#plate-glow)" />
      <circle cx="200" cy="200" r="145" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
    </svg>
  );
}

export default function PlateView({ items, categoryOrder, onItemTap }: PlateViewProps) {
  const totalWeight = useMemo(
    () => items.reduce((sum, item) => sum + (item.portionGrams || 0), 0),
    [items],
  );

  const enriched = useMemo(
    () =>
      items
        .map((item) => {
          const cat = categoryOrder.find((c) => c.id === item.categoryId);
          return { ...item, hex: cat ? toHex(cat.color) : '#4b5563' };
        })
        .reverse(),
    [items, categoryOrder],
  );

  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());

  if (items.length === 0) {
    return (
      <div className="relative mx-auto flex aspect-square w-full max-w-sm items-center justify-center rounded-full bg-neutral-950/50 backdrop-blur-md shadow-2xl border border-white/5">
        <PlateSvgBase />
        <div className="relative flex flex-col items-center gap-3">
          <UtensilsCrossed className="h-8 w-8 text-neutral-600" />
          <p className="px-6 text-center text-sm text-neutral-500">
            Seleccioná ingredientes para pintar tu plato
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="relative aspect-square w-full overflow-hidden rounded-full bg-neutral-950/50 backdrop-blur-md shadow-2xl border border-white/5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.06)_0%,_transparent_70%)]" />

        <PlateSvgBase />

        <div className="absolute inset-0">
          <AnimatePresence mode="popLayout">
            {enriched.map((item) => (
              <motion.button
                key={item._id}
                layoutId={`layer-${item.categoryId}`}
                type="button"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 20,
                  mass: 0.8,
                }}
                onClick={() => onItemTap?.(item)}
                className="absolute inset-0 flex cursor-pointer items-center justify-center overflow-hidden rounded-full focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                {item.imageUrl && !brokenImages.has(item.imageUrl) ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-full w-full object-contain"
                    draggable={false}
                    loading="lazy"
                    onError={() => setBrokenImages(prev => new Set(prev).add(item.imageUrl!))}
                  />
                ) : (
                  <div
                    className="flex h-3/4 w-3/4 items-center justify-center rounded-full opacity-60"
                    style={{ backgroundColor: item.hex }}
                  >
                    <span className="px-4 text-center text-xs font-semibold text-white drop-shadow-lg">
                      {item.name}
                    </span>
                  </div>
                )}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        <div className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_0_60px_rgba(0,0,0,0.6)]" />
      </div>

      <div
        className="absolute -bottom-2 right-2 flex items-center gap-2 rounded-full border border-white/10 bg-neutral-900/60 px-3.5 py-1.5 shadow-lg backdrop-blur-md"
        aria-label={`Peso estimado: ${totalWeight} gramos`}
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
        <span className="font-mono text-[10px] tracking-wider text-neutral-400 uppercase">
          Peso:
        </span>
        <AnimatedNumber
          value={totalWeight}
          format={(n) => `${n}g`}
          className="font-mono text-sm font-bold text-white tabular-nums"
        />
      </div>
    </div>
  );
}
