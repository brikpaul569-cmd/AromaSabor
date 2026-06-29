'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { UtensilsCrossed } from 'lucide-react';
import { useMemo } from 'react';

export interface PlateItem {
  _id: string;
  name: string;
  description?: string;
  portionGrams?: number;
  pricePerPortion: number;
  unit: string;
  categoryId: string;
  categoryLabel?: string;
}

export interface PlateViewProps {
  items: PlateItem[];
  categoryOrder: { id: string; label: string; color: string }[];
  onItemTap?: (item: PlateItem) => void;
}

const colorMap: Record<string, string> = {
  'bg-red-800/50': 'rgba(153, 27, 27, 0.5)',
  'bg-yellow-700/50': 'rgba(161, 98, 7, 0.5)',
  'bg-green-800/50': 'rgba(22, 101, 52, 0.5)',
  'bg-amber-800/60': 'rgba(146, 64, 14, 0.6)',
  'bg-blue-800/50': 'rgba(30, 64, 175, 0.5)',
  'bg-purple-800/50': 'rgba(107, 33, 168, 0.5)',
  'bg-pink-800/50': 'rgba(157, 23, 77, 0.5)',
  'bg-indigo-800/50': 'rgba(55, 48, 163, 0.5)',
};

function toRgba(colorClass: string): string {
  return colorMap[colorClass] ?? 'rgba(75, 85, 99, 0.5)';
}

const BOWL_W = 288;
const BOWL_H = 200;
const RIM_H = 14;

export default function PlateView({ items, categoryOrder, onItemTap }: PlateViewProps) {
  const layers = useMemo(
    () =>
      categoryOrder
        .map((cat) => ({
          ...cat,
          bg: toRgba(cat.color),
          items: items.filter((it) => it.categoryId === cat.id),
        }))
        .filter((l) => l.items.length > 0),
    [items, categoryOrder],
  );

  // Empty state
  if (layers.length === 0) {
    return (
      <div
        className="relative mx-auto flex items-center justify-center"
        style={{ width: BOWL_W, height: BOWL_H + RIM_H }}
      >
        <div
          className="absolute inset-x-0"
          style={{
            top: RIM_H,
            bottom: 0,
            borderRadius: '0 0 50% 50% / 0 0 100% 100%',
            border: '2px dashed rgba(255,255,255,0.2)',
          }}
        />
        <div className="relative flex flex-col items-center gap-2">
          <UtensilsCrossed className="h-6 w-6 text-gray-500" />
          <p className="px-4 text-center text-sm text-gray-500">
            Select items to build your bowl
          </p>
        </div>
      </div>
    );
  }

  const count = layers.length;

  return (
    <div className="relative mx-auto" style={{ width: BOWL_W }}>
      {/* Rim ellipse */}
      <div
        className="relative z-10"
        style={{
          height: RIM_H,
          width: '104%',
          marginLeft: '-2%',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%)',
          borderRadius: '50%',
        }}
      />

      {/* Bowl body */}
      <div
        className="relative overflow-hidden"
        style={{
          height: BOWL_H,
          borderRadius: '0 0 50% 50% / 0 0 100% 100%',
          background: '#1a1a2e',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {/* Inner shadow at top for depth */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10"
          style={{
            height: 16,
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 100%)',
          }}
        />

        {/* Layers stacked from bottom */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col">
          <AnimatePresence mode="popLayout">
            {layers.map((layer, i) => {
              const h = Math.floor(BOWL_H / count);
              const isTop = i === count - 1;

              return (
                <motion.button
                  key={layer.id}
                  type="button"
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{
                    opacity: { duration: 0.2, delay: i * 0.1 },
                    y: { duration: 0.25, delay: i * 0.1 },
                    layout: { duration: 0.3, ease: 'easeOut' },
                  }}
                  onClick={() => { const item = layer.items[0]; if (item) onItemTap?.(item); }}
                  className="flex cursor-pointer flex-col items-center justify-center gap-0.5 px-2 text-center transition hover:brightness-110 focus:outline-none focus:ring-1 focus:ring-white/30"
                  style={{
                    height: h,
                    background: layer.bg,
                    borderTopLeftRadius: isTop ? 10 : 4,
                    borderTopRightRadius: isTop ? 10 : 4,
                  }}
                >
                  {layer.items.map((item) => (
                    <span
                      key={item._id}
                      className="text-xs font-medium leading-tight text-white"
                      style={{
                        textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                      }}
                    >
                      {item.name}
                    </span>
                  ))}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
