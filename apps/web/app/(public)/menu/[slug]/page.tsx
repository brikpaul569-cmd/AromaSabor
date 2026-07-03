'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { usePlateStore, CategoryItem } from '@/stores/plate-store';
import PlateView from '@/components/PlateView';
import type { PlateItem } from '@/components/PlateView';
import type { PopoverItem } from '@/components/PlateItemPopover';
import PlateItemPopover from '@/components/PlateItemPopover';

import PricingBreakdown from '@/components/PricingBreakdown';
import type { PricingItem } from '@/components/PricingBreakdown';
import { formatPrice } from '@aromasabor/utils';

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

export default function PublicMenuPage() {
  const params = useParams();
  const { t } = useTranslation();
  const slug = params.slug as string;

  const [menu, setMenu] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);

  const router = useRouter();

  const [activePlateItem, setActivePlateItem] = useState<PopoverItem | null>(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [notes, setNotes] = useState('');

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
    if (!activePlateItem || !menu) return;
    const catIndex = menu.categories.findIndex(
      (c) => c._id === activePlateItem.categoryId,
    );
    if (catIndex >= 0) setActiveCategoryIndex(catIndex);
    setActivePlateItem(null);
  }, [activePlateItem, menu]);

  const handleItemSelect = useCallback((cat: MenuCategory, item: CategoryItem) => {
    if (isSelected(cat._id, item._id)) {
      deselectItem(cat._id, item._id);
    } else {
      selectItem(cat._id, item, cat.maxItems);
    }
  }, [isSelected, deselectItem, selectItem]);

  const handleReviewBowl = useCallback(() => {
    setShowConfirm(true);
  }, []);

  const handleSubmitPlate = useCallback(async () => {
    // Build selected items from store + menu data
    const flatItems: PlateItem[] = [];
    if (menu) {
      for (const [catId, items] of Object.entries(selections)) {
        const cat = menu.categories.find((c) => c._id === catId);
        for (const item of items) {
          flatItems.push({ ...item, categoryId: catId, categoryLabel: cat?.label });
        }
      }
    }

    if (flatItems.length === 0) {
      setSubmitError(t('plate.submitErrorNoItems'));
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const submitItems = flatItems.map((i) => ({ _id: i._id, categoryId: i.categoryId }));
      const result = await api.post<{ token: string; url: string }>(
        `/menus/${slug}/submit-plate`,
        { items: submitItems, guestCount, clientName: clientName || undefined, notes: notes || undefined },
      );
      router.push(result.url);
    } catch (err: any) {
      console.error('[submit] error', err);
      setSubmitError(err.message || t('plate.submitErrorFailed'));
      setSubmitting(false);
    }
  }, [menu, selections, slug, guestCount, clientName, notes, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.03)_0%,_transparent_70%)]">
        <p className="text-gray-500">{t('common.loading')}</p>
      </div>
    );
  }

  if (notFound || !menu) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.03)_0%,_transparent_70%)] p-8">
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

  const orderedCategories = menu.categories;

  return (
    <div className="min-h-screen bg-neutral-950 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.03)_0%,_transparent_70%)] pb-20 text-white">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <header className="text-center">
          <h1 className="text-4xl font-bold">{menu.name}</h1>
          {menu.description && <p className="mt-2 text-gray-400">{menu.description}</p>}
          <p className="mt-1 text-sm text-gray-500">{t('plate.by', { name: menu.createdBy?.name || 'Chef' })}</p>
        </header>

        {/* Top section: Plate + Pricing sidebar */}
        <div className="mt-12 grid gap-8 items-start lg:grid-cols-[3fr_1fr]">
          {/* Plate view */}
          <div className="relative flex flex-col items-center">
            <h2 className="mb-6 text-lg font-semibold text-white/80">{t('plate.yourPlate')}</h2>
            <PlateView items={sel} categoryOrder={categoryOrder} onItemTap={handleItemTap} />

            {sel.length > 0 && (
              <button onClick={clearAll} className="mt-4 text-sm text-gray-500 hover:text-white">{t('plate.clear')}</button>
            )}

            {activePlateItem && (
              <PlateItemPopover
                item={activePlateItem}
                canReplace={true}
                onRemove={handleRemove}
                onReplace={handleReplaceOpen}
                onClose={() => setActivePlateItem(null)}
              />
            )}
          </div>

          {/* Pricing sidebar — desktop */}
          <aside className="hidden lg:block">
            <PricingBreakdown items={pricingItems} guestCount={guestCount} categories={categoryOrder} />
          </aside>
        </div>

        {/* Pricing — mobile */}
        <div className="mt-6 lg:hidden">
          <PricingBreakdown items={pricingItems} guestCount={guestCount} categories={categoryOrder} />
        </div>

        {/* Category pills */}
        <div className="mt-8">
          <div className="flex flex-wrap gap-2">
            {menu.categories.map((cat, i) => {
              const isActive = activeCategoryIndex === i;
              const hasSelection = getSelectionCount(cat._id) > 0;
              return (
                <button
                  key={cat._id}
                  onClick={() => setActiveCategoryIndex(i)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-white text-gray-900'
                      : hasSelection
                        ? 'bg-green-500/20 text-green-300 ring-1 ring-green-400/40'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {cat.label}
                  {hasSelection && ` (${getSelectionCount(cat._id)})`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ingredient list for active category */}
        <div className="mt-6">
          {(() => {
            const cat = orderedCategories[activeCategoryIndex];
            if (!cat) return null;
            return (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-base font-medium text-white">{cat.label}</h3>
                  <span className="text-xs text-green-400">
                    {getSelectionCount(cat._id)}/{cat.maxItems} {t('plate.selected')}
                  </span>
                </div>

                <ul className="space-y-2">
                  {cat.items.filter((i) => i.isAvailable).length === 0 ? (
                    <p className="py-2 text-sm text-gray-500">{t('plate.noItems')}</p>
                  ) : (
                    cat.items
                      .filter((i) => i.isAvailable)
                      .map((item) => {
                        const selected = isSelected(cat._id, item._id);
                        const selCount = getSelectionCount(cat._id);
                        const remaining = cat.maxItems - selCount;
                        const atMax = !selected && remaining <= 0;

                        return (
                          <li key={item._id}>
                            <button
                              onClick={() => handleItemSelect(cat, item)}
                              disabled={atMax}
                              className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-left transition ${
                                selected
                                  ? 'bg-green-500/20 ring-1 ring-green-400/40'
                                  : atMax
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
                              <div className="ml-4 flex shrink-0 items-center gap-3">
                                {item.portionGrams && (
                                  <span className="text-xs text-gray-500">{item.portionGrams}{item.unit}</span>
                                )}
                                <span className="text-sm font-medium">{formatPrice(item.pricePerPortion)}</span>
                                <span className={`text-xs ${selected ? 'text-green-400' : 'text-white/60'}`}>
                                  {selected ? '✓' : '+'}
                                </span>
                              </div>
                            </button>
                          </li>
                        );
                      })
                  )}
                </ul>
              </>
            );
          })()}
        </div>

        {/* Guest count + Notes + Submit */}
        <div className="mt-8 space-y-5">
          {/* Guest count */}
          <div>
            <label className="mb-2 block text-sm text-gray-400">{t('plate.guestCount')}</label>
            <div className="flex items-center gap-3">
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
                className="h-12 w-20 rounded-lg bg-white/10 px-3 text-center text-lg font-bold text-white outline-none ring-1 ring-white/20 focus:ring-2 focus:ring-white/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => setGuestCount(guestCount + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-lg transition hover:bg-white/20"
              >
                +
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-sm text-gray-400">{t('plate.notesOptional')}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('plate.notesPlaceholder')}
              rows={2}
              className="w-full max-w-md resize-none rounded-lg bg-white/10 px-4 py-2 text-sm text-white outline-none ring-1 ring-white/20 placeholder:text-gray-600 focus:ring-2 focus:ring-white/40"
            />
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleReviewBowl}
            className="rounded-lg bg-green-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-green-500"
          >
            {t('plate.reviewBowl')}
          </button>
        </div>
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-neutral-950/80 p-6 shadow-xl backdrop-blur-xl">
            <h3 className="text-lg font-semibold text-white">{t('plate.confirmTitle')}</h3>
            <p className="mt-1 text-sm text-gray-400">{menu.name}</p>

            {/* Selected items summary */}
            {sel.length > 0 && (
              <ul className="mt-4 space-y-2">
                {sel.map((item) => (
                  <li key={item._id} className="flex items-center justify-between text-sm">
                    <span className="text-white/80">{item.name}</span>
                    <span className="text-gray-400">{formatPrice(item.pricePerPortion)}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Pricing reference */}
            <div className="mt-4 rounded-lg border border-white/5 bg-neutral-950/50 px-4 py-3 backdrop-blur-sm">
              <PricingBreakdown items={pricingItems} guestCount={guestCount} categories={categoryOrder} />
            </div>

            {/* Client name (optional) */}
            <div className="mt-4">
              <label className="mb-1 block text-sm text-gray-400">{t('plate.yourName')}</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder={t('plate.namePlaceholder')}
                className="w-full rounded-lg bg-white/10 px-4 py-2 text-sm text-white outline-none ring-1 ring-white/20 placeholder:text-gray-600 focus:ring-2 focus:ring-white/40"
              />
            </div>

            {/* Notes (optional) */}
            <div className="mt-3">
              <label className="mb-1 block text-sm text-gray-400">{t('plate.notesOptional')}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('plate.notesPlaceholder')}
                rows={2}
                className="w-full resize-none rounded-lg bg-white/10 px-4 py-2 text-sm text-white outline-none ring-1 ring-white/20 placeholder:text-gray-600 focus:ring-2 focus:ring-white/40"
              />
            </div>

            {/* Error */}
            {submitError && (
              <div className="mt-3 rounded-md bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {submitError}
              </div>
            )}

            {/* Actions */}
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowConfirm(false); setSubmitError(null); }}
                disabled={submitting}
                className="rounded-lg px-4 py-2 text-sm text-gray-400 transition hover:text-white disabled:opacity-50"
              >
                {t('plate.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSubmitPlate}
                disabled={submitting}
                className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-green-500 disabled:opacity-50"
              >
                {submitting ? t('plate.sending') : t('plate.sendToChef')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
