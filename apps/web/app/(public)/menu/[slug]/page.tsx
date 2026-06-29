'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { Check } from 'lucide-react';
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
  const [activeStep, setActiveStep] = useState(0);

  const router = useRouter();

  const [activePlateItem, setActivePlateItem] = useState<PopoverItem | null>(null);
  const [replaceCategoryId, setReplaceCategoryId] = useState<string | null>(null);
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

  const pricingRef = useRef<HTMLDivElement>(null);

  const handleReviewBowl = useCallback(() => {
    setShowConfirm(true);
  }, []);

  const handleSubmitPlate = useCallback(async () => {
    console.log('[submit] handleSubmitPlate called', { selections, menu, selectionsEmpty: Object.keys(selections).length === 0 });

    // Build selected items from store + menu data
    const flatItems: PlateItem[] = [];
    if (menu) {
      for (const [catId, items] of Object.entries(selections)) {
        const cat = menu.categories.find((c) => c._id === catId);
        console.log('[submit] category lookup', { catId, found: !!cat });
        for (const item of items) {
          flatItems.push({ ...item, categoryId: catId, categoryLabel: cat?.label });
        }
      }
    }
    console.log('[submit] flatItems', { length: flatItems.length, items: flatItems });

    if (flatItems.length === 0) {
      setSubmitError('No items selected. Please select at least one item before submitting.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const submitItems = flatItems.map((i) => ({ _id: i._id, categoryId: i.categoryId }));
      console.log('[submit] sending request', { slug, submitItems, guestCount });
      const result = await api.post<{ token: string; url: string }>(
        `/menus/${slug}/submit-plate`,
        { items: submitItems, guestCount, clientName: clientName || undefined, notes: notes || undefined },
      );
      console.log('[submit] success', result);
      router.push(result.url);
    } catch (err: any) {
      console.error('[submit] error', err);
      setSubmitError(err.message || 'Failed to submit your plate. Please try again.');
      setSubmitting(false);
    }
  }, [menu, selections, slug, guestCount, clientName, notes, router]);

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

  const orderedCategories = menu.categories;
  const currentCategory = orderedCategories[activeStep]!;
  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === orderedCategories.length - 1;

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

            <div className="mt-6" ref={pricingRef}>
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

          {/* Step-by-step category selection */}
          <div className="space-y-6">
            {/* Step indicator */}
            <div className="flex items-center gap-0 overflow-x-auto pb-2">
              {menu.categories.map((cat, i) => {
                const isCompleted = getSelectionCount(cat._id) > 0;
                const isCurrent = activeStep === i;
                const isFuture = i > activeStep;

                return (
                  <div key={cat._id} className="flex items-center flex-1 min-w-0">
                    <div className="flex flex-col items-center gap-1">
                      <button
                        type="button"
                        disabled={isFuture}
                        onClick={() => setActiveStep(i)}
                        className={`flex flex-col items-center gap-1 transition ${
                          isFuture ? 'cursor-default' : 'cursor-pointer'
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                            isCompleted
                              ? 'bg-green-500 text-white'
                              : isCurrent
                                ? 'bg-white text-gray-900 ring-2 ring-white'
                                : 'border border-white/20 bg-transparent text-gray-500'
                          }`}
                        >
                          {isCompleted ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            i + 1
                          )}
                        </div>
                        <span
                          className={`text-[10px] leading-tight text-center max-w-[72px] truncate ${
                            isFuture ? 'text-gray-500' : 'text-white/80'
                          }`}
                        >
                          {cat.label}
                        </span>
                      </button>
                    </div>
                    {i < menu.categories.length - 1 && (
                      <div
                        className={`flex-1 h-px mx-1 ${
                          i < activeStep
                            ? 'bg-green-500/50'
                            : 'bg-white/10'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Current category items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-medium text-white">
                  {currentCategory.label}
                </h3>
                <span className="text-xs text-green-400">
                  {getSelectionCount(currentCategory._id)}/{currentCategory.maxItems} selected
                </span>
              </div>

              <ul className="space-y-2">
                {currentCategory.items.filter((i) => i.isAvailable).length === 0 ? (
                  <p className="py-2 text-sm text-gray-500">{t('plate.noItems')}</p>
                ) : (
                  currentCategory.items
                    .filter((i) => i.isAvailable)
                    .map((item) => {
                      const selected = isSelected(currentCategory._id, item._id);
                      const selCount = getSelectionCount(currentCategory._id);
                      const remaining = currentCategory.maxItems - selCount;
                      const atMax = !selected && remaining <= 0;

                      return (
                        <li key={item._id}>
                          <button
                            onClick={() => handleItemSelect(currentCategory, item)}
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
                                <p className="truncate text-xs text-gray-500">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-3 ml-4 shrink-0">
                              {item.portionGrams && (
                                <span className="text-xs text-gray-500">
                                  {item.portionGrams}
                                  {item.unit}
                                </span>
                              )}
                              <span className="text-sm font-medium">
                                {formatPrice(item.pricePerPortion)}
                              </span>
                              <span
                                className={`text-xs ${
                                  selected ? 'text-green-400' : 'text-white/60'
                                }`}
                              >
                                {selected ? '✓' : '+'}
                              </span>
                            </div>
                          </button>
                        </li>
                      );
                    })
                )}
              </ul>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                disabled={isFirstStep}
                onClick={() => setActiveStep((s) => s - 1)}
                className="rounded-lg px-4 py-2 text-sm font-medium transition bg-white/10 text-white/80 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Back
              </button>

              {isLastStep ? (
                <button
                  type="button"
                  onClick={handleReviewBowl}
                  className="rounded-lg px-4 py-2 text-sm font-medium transition bg-green-600 text-white hover:bg-green-500"
                >
                  Review your bowl
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveStep((s) => s + 1)}
                  className="rounded-lg px-4 py-2 text-sm font-medium transition bg-white/10 text-white/80 hover:bg-white/20"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-gray-900 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white">Confirm your bowl</h3>
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
            <div className="mt-4 rounded-lg bg-white/5 px-4 py-3">
              <PricingBreakdown items={pricingItems} guestCount={guestCount} categories={categoryOrder} />
            </div>

            {/* Client name (optional) */}
            <div className="mt-4">
              <label className="mb-1 block text-sm text-gray-400">Your name (optional)</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Enter your name"
                className="w-full rounded-lg bg-white/10 px-4 py-2 text-sm text-white outline-none ring-1 ring-white/20 placeholder:text-gray-600 focus:ring-2 focus:ring-white/40"
              />
            </div>

            {/* Notes (optional) */}
            <div className="mt-3">
              <label className="mb-1 block text-sm text-gray-400">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requests?"
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
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitPlate}
                disabled={submitting}
                className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-green-500 disabled:opacity-50"
              >
                {submitting ? 'Sending...' : 'Send to chef'}
              </button>
            </div>
          </div>
        </div>
      )}

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
