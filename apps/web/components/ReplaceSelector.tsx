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

interface ReplaceSelectorProps {
  categoryLabel: string;
  items: MenuItem[];
  currentItemId: string;
  onSelect: (item: MenuItem) => void;
  onClose: () => void;
}

function formatPrice(price: number): string {
  return '$' + price.toLocaleString('es-CO', { minimumFractionDigits: 2 });
}

export default function ReplaceSelector({ categoryLabel, items, currentItemId, onSelect, onClose }: ReplaceSelectorProps) {
  const available = items.filter((i) => i._id !== currentItemId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-xl bg-gray-800 p-6 shadow-2xl ring-1 ring-white/20">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Replace {categoryLabel}</h3>
          <button onClick={onClose} className="text-sm text-gray-400 hover:text-white">Close</button>
        </div>

        {available.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">No other items available in this category</p>
        ) : (
          <ul className="space-y-2">
            {available.map((item) => (
              <li key={item._id}>
                <button
                  onClick={() => onSelect(item)}
                  className="flex w-full items-center justify-between rounded-lg bg-white/5 px-4 py-3 text-left transition hover:bg-white/10"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    {item.description && (
                      <p className="truncate text-xs text-gray-500">{item.description}</p>
                    )}
                  </div>
                  <div className="ml-4 flex shrink-0 items-center gap-3">
                    {item.weight && <span className="text-xs text-gray-500">{item.weight}g</span>}
                    <span className="text-sm font-medium">{formatPrice(item.price)}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
