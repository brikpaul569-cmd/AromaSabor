'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { usePlateStore } from '@/stores/plate-store';
import PlateView from '@/components/PlateView';
import PlateItemPopover from '@/components/PlateItemPopover';
import ReplaceSelector from '@/components/ReplaceSelector';

type Category = 'entrada' | 'plato_fuerte' | 'guarnicion' | 'postre';

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  category: Category;
  price: number;
  weight?: number;
}

interface Menu {
  name: string;
  description?: string;
  items: MenuItem[];
  createdBy: { name: string };
}

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'plato_fuerte', label: 'Plato Fuerte' },
  { value: 'guarnicion', label: 'Guarnición' },
  { value: 'postre', label: 'Postre' },
];

function formatPrice(price: number): string {
  return '$' + price.toLocaleString('es-CO', { minimumFractionDigits: 2 });
}

export default function PublicMenuPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);

  // Story 9 state
  const [activePlateItem, setActivePlateItem] = useState<MenuItem | null>(null);
  const [replaceCategory, setReplaceCategory] = useState<Category | null>(null);

  const selections = usePlateStore((s) => s.selections);
  const selectItem = usePlateStore((s) => s.selectItem);
  const deselectItem = usePlateStore((s) => s.deselectItem);
  const clearAll = usePlateStore((s) => s.clearAll);
  const selectedItems = usePlateStore((s) => s.selectedItems());
  const isSelected = usePlateStore((s) => s.isSelected);

  const sel = selectedItems;

  useEffect(() => {
    api.get<Menu>('/menus/slug/' + slug)
      .then(setMenu)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleItemTap = useCallback((item: MenuItem) => {
    setActivePlateItem(item);
  }, []);

  const handleRemove = useCallback(() => {
    if (!activePlateItem) return;
    deselectItem(activePlateItem.category);
    setActivePlateItem(null);
  }, [activePlateItem, deselectItem]);

  const handleReplaceOpen = useCallback(() => {
    if (!activePlateItem) return;
    setReplaceCategory(activePlateItem.category);
  }, [activePlateItem]);

  const handleReplaceSelect = useCallback((item: MenuItem) => {
    selectItem(item);
    setReplaceCategory(null);
    setActivePlateItem(null);
  }, [selectItem]);

  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    items: menu?.items.filter((i) => i.category === cat.value) ?? [],
  }));

  const replaceGroup = replaceCategory
    ? grouped.find((g) => g.value === replaceCategory)
    : null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (notFound || !menu) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 p-8">
        <h1 className="text-2xl font-bold text-white/60">Menu not found</h1>
        <p className="mt-2 text-sm text-gray-500">This menu may not be published yet.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <header className="text-center">
          <h1 className="text-4xl font-bold">{menu.name}</h1>
          {menu.description && <p className="mt-2 text-gray-400">{menu.description}</p>}
          <p className="mt-1 text-sm text-gray-500">by {menu.createdBy?.name || 'Chef'}</p>
        </header>

        {/* Plate visual + selection */}
        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {/* Plate view */}
          <div className="relative flex flex-col items-center justify-center">
            <h2 className="mb-6 text-lg font-semibold text-white/80">Your Plate</h2>
            <PlateView items={sel} onItemTap={handleItemTap} />
            {sel.length > 0 && (
              <button
                onClick={clearAll}
                className="mt-6 text-sm text-gray-500 hover:text-white"
              >
                Clear plate
              </button>
            )}

            {activePlateItem && !replaceCategory && (
              <PlateItemPopover
                item={activePlateItem}
                canReplace={(grouped.find((g) => g.value === activePlateItem.category)?.items.length ?? 0) > 1}
                onRemove={handleRemove}
                onReplace={handleReplaceOpen}
                onClose={() => setActivePlateItem(null)}
              />
            )}
          </div>

          {/* Category items */}
          <div className="space-y-6">
            {grouped.map((group) => {
              const selected = selections[group.value];
              const isOpen = activeCategory === group.value;

              return (
                <div key={group.value}>
                  <button
                    onClick={() => setActiveCategory(isOpen ? null : group.value)}
                    className="flex w-full items-center justify-between rounded-lg bg-white/5 px-4 py-3 text-left transition hover:bg-white/10"
                  >
                    <span className="font-medium">
                      {group.label}
                      {selected && (
                        <span className="ml-2 text-sm text-green-400">({selected.name})</span>
                      )}
                    </span>
                    <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>

                  {isOpen && (
                    <ul className="mt-2 space-y-2">
                      {group.items.length === 0 ? (
                        <p className="px-4 py-2 text-sm text-gray-500">No items</p>
                      ) : (
                        group.items.map((item) => {
                          const selected = isSelected(item);
                          return (
                            <li key={item._id}>
                              <button
                                onClick={() => {
                                  if (selected) {
                                    deselectItem(item.category);
                                  } else {
                                    selectItem(item);
                                  }
                                }}
                                className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-left transition ${
                                  selected
                                    ? 'bg-green-500/20 ring-1 ring-green-400/40'
                                    : 'bg-white/5 hover:bg-white/10'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium">{item.name}</p>
                                  {item.description && (
                                    <p className="text-xs text-gray-500 truncate">{item.description}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 ml-4 shrink-0">
                                  {item.weight && (
                                    <span className="text-xs text-gray-500">{item.weight}g</span>
                                  )}
                                  <span className="text-sm font-medium">{formatPrice(item.price)}</span>
                                  <span className="text-xs">{selected ? '✓' : '+'}</span>
                                </div>
                              </button>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Replace selector modal */}
      {replaceGroup && activePlateItem && (
        <ReplaceSelector
          categoryLabel={replaceGroup.label}
          items={replaceGroup.items}
          currentItemId={activePlateItem._id}
          onSelect={handleReplaceSelect}
          onClose={() => setReplaceCategory(null)}
        />
      )}
    </div>
  );
}
