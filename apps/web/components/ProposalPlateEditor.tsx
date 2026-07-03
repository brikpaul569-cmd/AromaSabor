'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import PricingBreakdown from '@/components/PricingBreakdown';
import type { PricingItem } from '@/components/PricingBreakdown';
import { formatPrice } from '@aromasabor/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface ProposalItem {
  _id: string;
  name: string;
  description?: string;
  categoryId: string;
  categoryLabel: string;
  pricePerPortion: number;
  portionGrams?: number;
  unit: string;
  quantity: number;
}

interface MenuItem {
  _id: string;
  name: string;
  description?: string;
  portionGrams?: number;
  pricePerPortion: number;
  unit: string;
  isAvailable: boolean;
}

interface MenuCategory {
  _id: string;
  id: string;
  label: string;
  maxItems: number;
  items: MenuItem[];
}

interface MenuData {
  name: string;
  description?: string;
  categories: MenuCategory[];
}

interface SelectedItem {
  _id: string;
  name: string;
  description?: string;
  pricePerPortion: number;
  portionGrams?: number;
  unit: string;
  categoryId: string;
}

export interface ProposalPlateEditorProps {
  menuId: string;
  initialItems: ProposalItem[];
  guestCount: number;
  onSave: (items: ProposalItem[], guestCount: number, reason: string) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const fallbackColors = [
  'bg-red-800/50',
  'bg-yellow-700/50',
  'bg-green-800/50',
  'bg-amber-800/60',
  'bg-blue-800/50',
  'bg-purple-800/50',
  'bg-pink-800/50',
  'bg-indigo-800/50',
];

function categoryColor(cat: MenuCategory, index: number) {
  const named: Record<string, string> = {
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
  return named[cat.id] ?? fallbackColors[index % fallbackColors.length];
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function ProposalPlateEditor({
  menuId,
  initialItems,
  guestCount: initialGuestCount,
  onSave,
  onCancel,
  isSaving,
}: ProposalPlateEditorProps) {
  const { t } = useTranslation();

  /* Menu fetch state */
  const [menu, setMenu] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  /* Editor state */
  const [selections, setSelections] = useState<Record<string, SelectedItem[]>>({});
  const [guestCount, setGuestCountState] = useState(initialGuestCount);
  const [reason, setReason] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  /* ---- Fetch menu on mount ---- */
  useEffect(() => {
    api
      .get<MenuData>('/menus/' + menuId)
      .then((data) => {
        setMenu(data);

        // Build initial selections from initialItems, matching by _id
        const initial: Record<string, SelectedItem[]> = {};
        for (const cat of data.categories) {
          initial[cat._id] = [];
        }
        for (const item of initialItems) {
          const cat = data.categories.find((c) => c._id === item.categoryId);
          if (cat && cat.items.some((i) => i._id === item._id)) {
            initial[item.categoryId]!.push({
              _id: item._id,
              name: item.name,
              description: item.description,
              pricePerPortion: item.pricePerPortion,
              portionGrams: item.portionGrams,
              unit: item.unit,
              categoryId: item.categoryId,
            });
          }
        }
        setSelections(initial);
      })
      .catch((err) => setLoadError(err.message || t('common.error')))
      .finally(() => setLoading(false));
  }, [menuId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- Selection helpers ---- */

  const isSelected = useCallback(
    (categoryId: string, itemId: string) =>
      (selections[categoryId] || []).some((s) => s._id === itemId),
    [selections],
  );

  const getSelectionCount = useCallback(
    (categoryId: string) => (selections[categoryId] || []).length,
    [selections],
  );

  const handleItemSelect = useCallback(
    (cat: MenuCategory, item: MenuItem) => {
      setSelections((prev) => {
        const current = prev[cat._id] || [];
        if (current.some((s) => s._id === item._id)) {
          // Deselect
          return { ...prev, [cat._id]: current.filter((s) => s._id !== item._id) };
        }
        if (current.length >= cat.maxItems) return prev;
        return {
          ...prev,
          [cat._id]: [
            ...current,
            {
              _id: item._id,
              name: item.name,
              description: item.description,
              pricePerPortion: item.pricePerPortion,
              portionGrams: item.portionGrams,
              unit: item.unit,
              categoryId: cat._id,
            },
          ],
        };
      });
    },
    [],
  );

  const handleGuestCount = useCallback((value: number) => {
    const sanitized = isNaN(value) || value < 1 ? 1 : Math.floor(value);
    setGuestCountState(sanitized);
  }, []);

  /* ---- Derived data ---- */

  const selectedItems = useMemo(() => {
    const result: SelectedItem[] = [];
    for (const items of Object.values(selections)) {
      for (const item of items) result.push(item);
    }
    return result;
  }, [selections]);

  const pricingItems: PricingItem[] = useMemo(
    () =>
      selectedItems.map((i) => ({
        _id: i._id,
        name: i.name,
        pricePerPortion: i.pricePerPortion,
        categoryLabel: menu?.categories.find((c) => c._id === i.categoryId)?.label,
      })),
    [selectedItems, menu],
  );

  const pricingCategories = useMemo(
    () => (menu ? menu.categories.map((c) => ({ id: c._id, label: c.label })) : []),
    [menu],
  );

  /* ---- Save ---- */

  const handleSave = useCallback(() => {
    const items: ProposalItem[] = selectedItems.map((i) => {
      const original = initialItems.find((oi) => oi._id === i._id);
      return {
        _id: i._id,
        name: i.name,
        description: i.description,
        categoryId: i.categoryId,
        categoryLabel: menu?.categories.find((c) => c._id === i.categoryId)?.label || '',
        pricePerPortion: i.pricePerPortion,
        portionGrams: i.portionGrams,
        unit: i.unit,
        quantity: original?.quantity || 1,
      };
    });
    onSave(items, guestCount, reason);
  }, [selectedItems, initialItems, menu, guestCount, reason, onSave]);

  /* ---- Render states ---- */

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-neutral-950/50 p-8 text-center backdrop-blur-md">
        <p className="text-gray-500">{t('proposals.edit.loadingMenu')}</p>
      </div>
    );
  }

  if (loadError || !menu) {
    return (
      <div className="rounded-xl border border-white/10 bg-neutral-950/50 p-8 text-center backdrop-blur-md">
        <p className="text-red-400">{loadError || t('common.error')}</p>
        <button
          onClick={onCancel}
          className="mt-4 text-sm text-gray-500 underline hover:text-white"
        >
          {t('proposals.edit.cancel')}
        </button>
      </div>
    );
  }

  /* ---- Main render ---- */

  return (
    <div className="rounded-xl border border-white/10 bg-neutral-950/50 p-6 backdrop-blur-md">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white/90">{t('proposals.edit.editing')}</h3>
        <span className="text-sm text-gray-500">{menu.name}</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* -- LEFT COLUMN: Category accordion -- */}
        <div className="space-y-4">
          {menu.categories.map((cat, idx) => {
            const isOpen = activeCategory === cat._id;
            const selCount = getSelectionCount(cat._id);
            const remaining = cat.maxItems - selCount;
            const color = categoryColor(cat, idx);

            return (
              <div key={cat._id}>
                {/* Accordion header */}
                <button
                  onClick={() => setActiveCategory(isOpen ? null : cat._id)}
                  className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-neutral-950/50 px-4 py-3 text-left backdrop-blur-sm transition hover:opacity-90"
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full ${color}`} />
                    <span className="font-medium text-white/80">{cat.label}</span>
                    {selCount > 0 && (
                      <span className="text-sm text-green-400">
                        ({selCount}/{cat.maxItems})
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  >
                    ▼
                  </span>
                </button>

                {/* Accordion body */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="body"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <ul className="mt-2 space-y-2">
                        {cat.items.filter((i) => i.isAvailable).length === 0 ? (
                          <p className="px-4 py-2 text-sm text-gray-500">
                            {t('plate.noItems')}
                          </p>
                        ) : (
                          cat.items
                            .filter((i) => i.isAvailable)
                            .map((item) => {
                              const selected = isSelected(cat._id, item._id);
                              const cantSelect = !selected && remaining <= 0;
                              return (
                                <li key={item._id}>
                                  <button
                                    onClick={() => handleItemSelect(cat, item)}
                                    disabled={cantSelect}
                                    className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-left transition ${
                                      selected
                                        ? 'bg-green-500/20 ring-1 ring-green-400/40'
                                        : cantSelect
                                          ? 'cursor-not-allowed bg-white/5 opacity-40'
                                          : 'bg-white/5 hover:bg-white/10'
                                    }`}
                                  >
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium text-white/80">
                                        {item.name}
                                      </p>
                                      {item.description && (
                                        <p className="truncate text-xs text-gray-500">
                                          {item.description}
                                        </p>
                                      )}
                                    </div>
                                    <div className="ml-4 flex shrink-0 items-center gap-3">
                                      {item.portionGrams && (
                                        <span className="text-xs text-gray-500">
                                          {item.portionGrams}
                                          {item.unit}
                                        </span>
                                      )}
                                      <span className="text-sm font-medium text-white/70">
                                        {formatPrice(item.pricePerPortion)}
                                      </span>
                                      <span className="text-xs">
                                        {selected ? '✓' : '+'}
                                      </span>
                                    </div>
                                  </button>
                                </li>
                              );
                            })
                        )}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* -- RIGHT COLUMN: Guest count + pricing + save -- */}
        <div className="space-y-6">
          {/* Guest count */}
          <div>
            <label className="mb-2 block text-sm text-gray-400">
              {t('proposals.edit.guestCount')}
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleGuestCount(guestCount - 1)}
                disabled={guestCount <= 1}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-lg text-white/70 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                value={guestCount}
                onChange={(e) => handleGuestCount(Number(e.target.value))}
                className="h-10 w-20 rounded-lg bg-white/10 px-3 text-center text-white outline-none ring-1 ring-white/20 focus:ring-2 focus:ring-white/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                onClick={() => handleGuestCount(guestCount + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-lg text-white/70 transition hover:bg-white/20"
              >
                +
              </button>
            </div>
          </div>

          {/* Pricing breakdown */}
          <PricingBreakdown
            items={pricingItems}
            guestCount={guestCount}
            categories={pricingCategories}
          />

          {/* Reason */}
          <div>
            <label className="mb-2 block text-sm text-gray-400">
              {t('proposals.edit.provideReason')}{' '}
              <span className="text-gray-600">({t('common.optional')})</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('proposals.edit.reasonPlaceholder')}
              rows={2}
              className="w-full resize-none rounded-lg bg-white/10 px-4 py-2 text-sm text-white outline-none ring-1 ring-white/20 placeholder:text-gray-600 focus:ring-2 focus:ring-white/40"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? t('proposals.edit.saving') : t('proposals.edit.save')}
            </button>
            <button
              onClick={onCancel}
              disabled={isSaving}
              className="rounded-lg px-4 py-2.5 text-sm text-gray-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('proposals.edit.cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
