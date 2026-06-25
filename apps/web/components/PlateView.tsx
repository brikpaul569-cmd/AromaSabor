'use client';

type Category = 'entrada' | 'plato_fuerte' | 'guarnicion' | 'postre';

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  category: Category;
  price: number;
  weight?: number;
}

interface PlateViewProps {
  items: MenuItem[];
  onItemTap?: (item: MenuItem) => void;
}

const layers: { key: Category; label: string; color: string }[] = [
  { key: 'postre', label: 'Postre', color: 'bg-amber-800/60' },
  { key: 'guarnicion', label: 'Guarnición', color: 'bg-yellow-700/50' },
  { key: 'plato_fuerte', label: 'Plato Fuerte', color: 'bg-red-800/50' },
  { key: 'entrada', label: 'Entrada', color: 'bg-green-800/50' },
];

export default function PlateView({ items, onItemTap }: PlateViewProps) {
  if (items.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-full border-2 border-dashed border-white/20">
        <p className="text-sm text-gray-500">Select items to build your plate</p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-72 w-72 items-center justify-center">
      <div className="absolute inset-0 rounded-full border-2 border-white/10" />
      {layers.map((layer, i) => {
        const item = items.find((it) => it.category === layer.key);
        if (!item) return null;
        return (
          <button
            key={item._id}
            type="button"
            onClick={() => onItemTap?.(item)}
            className={`absolute inset-4 rounded-full ${layer.color} flex animate-fadeIn flex-col items-center justify-center backdrop-blur-sm transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white/40`}
            style={{
              animationDelay: `${i * 150}ms`,
              zIndex: i,
              margin: `${i * 8}px`,
            }}
          >
            <p className="text-sm font-medium text-white drop-shadow-lg">{item.name}</p>
            {item.weight && (
              <p className="text-xs text-white/70 drop-shadow">{item.weight}g</p>
            )}
          </button>
        );
      })}
    </div>
  );
}
