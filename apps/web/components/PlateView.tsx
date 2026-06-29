'use client';

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

interface PlateViewProps {
  items: PlateItem[];
  categoryOrder: { id: string; label: string; color: string }[];
  onItemTap?: (item: PlateItem) => void;
}

const defaultColors = [
  'bg-amber-800/60',
  'bg-yellow-700/50',
  'bg-red-800/50',
  'bg-green-800/50',
  'bg-blue-800/50',
  'bg-purple-800/50',
  'bg-pink-800/50',
  'bg-indigo-800/50',
];

export default function PlateView({ items, categoryOrder, onItemTap }: PlateViewProps) {
  if (items.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-full border-2 border-dashed border-white/20">
        <p className="text-sm text-gray-500">Select items to build your plate</p>
      </div>
    );
  }

  const layers = categoryOrder.map((cat, i) => ({
    ...cat,
    color: cat.color || defaultColors[i % defaultColors.length],
    items: items.filter((it) => it.categoryId === cat.id),
  }));

  return (
    <div className="relative mx-auto flex h-72 w-72 items-center justify-center">
      <div className="absolute inset-0 rounded-full border-2 border-white/10" />
      {layers.map((layer, i) => {
        if (layer.items.length === 0) return null;
        return layer.items.map((item) => (
          <button
            key={item._id}
            type="button"
            onClick={() => onItemTap?.(item)}
            className={`absolute inset-4 rounded-full ${layer.color} flex animate-fadeIn flex-col items-center justify-center backdrop-blur-sm transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white/40`}
            style={{
              animationDelay: `${i * 150}ms`,
              zIndex: categoryOrder.length - i,
              margin: `${i * 8}px`,
            }}
          >
            <p className="text-sm font-medium text-white drop-shadow-lg">{item.name}</p>
            {item.portionGrams && (
              <p className="text-xs text-white/70 drop-shadow">{item.portionGrams}{item.unit}</p>
            )}
          </button>
        ));
      })}
    </div>
  );
}
