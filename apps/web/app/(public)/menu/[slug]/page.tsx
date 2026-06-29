'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { usePlateStore, CategoryItem } from '@/stores/plate-store';
import PlateView from '@/components/PlateView';
import type { PlateItem } from '@/components/PlateView';
import type { PopoverItem } from '@/components/PlateItemPopover';
import PlateItemPopover from '@/components/PlateItemPopover';
import ReplaceSelector from '@/components/ReplaceSelector';
import type { ReplaceItem } from '@/components/ReplaceSelector';
import PricingBreakdown from '@/components/PricingBreakdown';
import type { PricingItem } from '@/components/PricingBreakdown';

interface MenuCategory {
  _id: string;
  id: string;
  label: string;
  maxItems: number;
  items: CategoryItem[];
}

interface MenuData {
  name: string;
  description?: string;
  categories: MenuCategory[];
  createdBy: { name: string };
}

const plateColors: Record<string, string> = {
  proteinas: 'bg-red-800/50',
  carbohidratos: 'bg-yellow-700/50',
  ensaladas: 'bg-green-800/50',
  salsas: 'bg-amber-800/60',
  bebidas: 'bg-blue-800/50',
  entrada: 'bg-green-800/50',
  plato_fuerte: 'bg-red-800/50',
  guarnicion: 'bg-yellow-700/50',
  postre: 'bg-amber-800/60',
};

const fallbackColors = [
  'bg-red-800/50', 'bg-yellow-700/50', 'bg-green-800/50',
  'bg-amber-800/60', 'bg-blue-800/50', 'bg-purple-800/50',
  'bg-pink-800/50', 'bg-indigo-800/50',
];

function formatPrice(price: number): string {
  return '$' + price.toLocaleString('es-CO', { minimumFractionDigits: 2 });
}

export default function PublicMenuPage() {
  const params = useParams();
  const { t } = useTranslation();
  const slug = params.slug as string;

  const [menu, setMenu] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const [activePlateItem, setActivePlateItem] = useState<PopoverItem | null>(null);
  const [replaceCategoryId, setReplaceCategoryId] = useState<string | null>(null);

  const selections = usePlateStore((s) => s.selections);
  const guestCount = usePlateStore((s) => s.guestCount);
  const initCategories = usePlateStore((s) => s.initCategories);
  const selectItem = usePlateStore((s) => s.selectItem);
  const deselectItem = usePlateStore((s) => s.deselectItem);
  const clearAll = usePlateStore((s) => s.clearAll);
  const setGuestCount = usePlateStore((s) => s.setGuestCount);
  const isSelected = usePlateStore((s) => s.isSelected);
  const getSelectionCount = usePlateStore((s) => s.getSelectionCount);

  useEffect(() => {
    api.get<MenuData>('/menus/slug/' + slug)
      .then((data) => {
        setMenu(data);
        initCategories(data.categories.map((c) => ({ _id: c._id, id: c.id, label: c.label, maxItems: c.maxItems })));
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug, initCategories]);

  const handleItemTap = useCallback((item: PlateItem) => {
    setActivePlateItem({
      _id: item._id,
      name: item.name,
      description: item.description,
      portionGrams: item.portionGrams,
      pricePerPortion: item.pricePerPortion,
      unit: item.unit,
      categoryId: item.categoryId,
    });
  }, []);

  const handleRemove = useCallback(() => {
    if (!activePlateItem) return;
    deselectItem(activePlateItem.categoryId, activePlateItem._id);
    setActivePlateItem(null);
  }, [activePlateItem, deselectItem]);

  const handleReplaceOpen = useCallback(() => {
    if (!activePlateItem) return;
    setReplaceCategoryId(activePlateItem.categoryId);
  }, [activePlateItem]);

  const handleReplaceSelect = useCallback((item: ReplaceItem) => {
    if (!replaceCategoryId || !activePlateItem) return;
    deselectItem(activePlateItem.categoryId, activePlateItem._id);
    const cat = menu?.categories.find((c) => c._id === replaceCategoryId);
    if (!cat) return;
    const fullItem = cat.items.find((i) => i._id === item._id);
    if (fullItem) {
      selectItem(replaceCategoryId, fullItem, cat.maxItems);
    }
    setReplaceCategoryId(null);
    setActivePlateItem(null);
  }, [replaceCategoryId, activePlateItem, menu, selectItem, deselectItem]);

  const handleItemSelect = useCallback((cat: MenuCategory, item: CategoryItem) => {
    if (isSelected(cat._id, item._id)) {
      deselectItem(cat._id, item._id);
    } else {
      selectItem(cat._id, item, cat.maxItems);
    }
  }, [isSelected, deselectItem, selectItem]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <p className="text-gray-500">{t('common.loading')}</p>
      </div>
    );
  }

  if (notFound || !menu) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 p-8">
        <h1 className="text-2xl font-bold text-white/60">{t('public.menu.notFound')}</h1>
        <p className="mt-2 text-sm text-gray-500">{t('public.menu.notFoundDesc')}</p>
      </div>
    );
  }

  const categoryOrder = menu.categories.map((cat) => ({
    id: cat._id,
    label: cat.label,
    color: plateColors[cat.id] ?? fallbackColors[menu.categories.indexOf(cat) % fallbackColors.length] ?? 'bg-gray-800/50',
  }));

  const sel: PlateItem[] = [];
  for (const [catId, items] of Object.entries(selections)) {
    const cat = menu.categories.find((c) => c._id === catId);
    for (const item of items) {
      sel.push({ ...item, categoryId: catId, categoryLabel: cat?.label });
    }
  }

  const pricingItems: PricingItem[] = sel.map((i) => ({
    _id: i._id, name: i.name, pricePerPortion: i.pricePerPortion, categoryLabel: i.categoryLabel,
  }));

  const activePlateCat = activePlateItem
    ? menu.categories.find((c) => c._id === activePlateItem.categoryId)
    : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <header className="text-center">
          <h1 className="text-4xl font-bold">{menu.name}</h1>
          {menu.description && <p className="mt-2 text-gray-400">{menu.description}</p>}
          <p className="mt-1 text-sm text-gray-500">{t('plate.by', { name: menu.createdBy?.name || 'Chef' })}</p>
        </header>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {/* Plate view */}
          <div className="relative flex flex-col items-center justify-center">
            <h2 className="mb-6 text-lg font-semibold text-white/80">{t('plate.yourPlate')}</h2>
            <PlateView items={sel} categoryOrder={categoryOrder} onItemTap={handleItemTap} />

            <div className="mt-6 w-full max-w-xs">
              <label className="mb-2 block text-sm text-gray-400">{t('plate.guestCount')}</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setGuestCount(guestCount - 1)}
                  disabled={guestCount <= 1}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-lg transition hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
                >−</button>
                <input
                  type="number" min={1} value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  className="h-10 w-20 rounded-lg bg-white/10 px-3 text-center text-white outline-none ring-1 ring-white/20 focus:ring-2 focus:ring-white/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button
                  onClick={() => setGuestCount(guestCount + 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-lg transition hover:bg-white/20"
                >+</button>
              </div>
            </div>

            <div className="mt-6">
              <PricingBreakdown items={pricingItems} guestCount={guestCount} categories={categoryOrder} />
            </div>

            {sel.length > 0 && (
              <button onClick={clearAll} className="mt-4 text-sm text-gray-500 hover:text-white">{t('plate.clear')}</button>
            )}

            {activePlateItem && !replaceCategoryId && (
              <PlateItemPopover
                item={activePlateItem}
                canReplace={(activePlateCat?.items.length ?? 0) > 1}
                onRemove={handleRemove}
                onReplace={handleReplaceOpen}
                onClose={() => setActivePlateItem(null)}
              />
            )}
          </div>

          {/* Category items */}
          <div className="space-y-6">
            {menu.categories.map((cat) => {
              const isOpen = activeCategory === cat._id;
              const selCount = getSelectionCount(cat._id);
              const remaining = cat.maxItems - selCount;

              return (
                <div key={cat._id}>
                  <button
                    onClick={() => setActiveCategory(isOpen ? null : cat._id)}
                    className="flex w-full items-center justify-between rounded-lg bg-white/5 px-4 py-3 text-left transition hover:bg-white/10"
                  >
                    <span className="font-medium">
                      {cat.label}
                      {selCount > 0 && (
                        <span className="ml-2 text-sm text-green-400">({selCount}/{cat.maxItems})</span>
                      )}
                    </span>
                    <span className={`text-xs text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                  </button>

                  {isOpen && (
                    <ul className="mt-2 space-y-2">
                      {cat.items.length === 0 ? (
                        <p className="px-4 py-2 text-sm text-gray-500">{t('plate.noItems')}</p>
                      ) : (
                        cat.items.filter((i) => i.isAvailable).map((item) => {
                          const selected = isSelected(cat._id, item._id);
                          const canSelect = !selected && remaining <= 0;
                          return (
                            <li key={item._id}>
                              <button
                                onClick={() => handleItemSelect(cat, item)}
                                disabled={canSelect}
                                className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-left transition ${
                                  selected
                                    ? 'bg-green-500/20 ring-1 ring-green-400/40'
                                    : canSelect
                                      ? 'bg-white/5 opacity-40 cursor-not-allowed'
                                      : 'bg-white/5 hover:bg-white/10'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium">{item.name}</p>
                                  {item.description && (
                                    <p className="truncate text-xs text-gray-500">{item.description}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 ml-4 shrink-0">
                                  {item.portionGrams && (
                                    <span className="text-xs text-gray-500">{item.portionGrams}{item.unit}</span>
                                  )}
                                  <span className="text-sm font-medium">{formatPrice(item.pricePerPortion)}</span>
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

      {replaceCategoryId && activePlateItem && activePlateCat && (
        <ReplaceSelector
          categoryLabel={activePlateCat.label}
          items={activePlateCat.items}
          currentItemId={activePlateItem._id}
          onSelect={handleReplaceSelect}
          onClose={() => setReplaceCategoryId(null)}
        />
      )}
    </div>
  );
}
