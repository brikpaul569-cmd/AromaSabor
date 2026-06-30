'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import PricingBreakdown from '@/components/PricingBreakdown';

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

interface Menu {
  _id: string;
  name: string;
  description?: string;
  categories: MenuCategory[];
}

interface SelectedItem {
  _id: string;
  name: string;
  description: string;
  categoryId: string;
  categoryLabel: string;
  pricePerPortion: number;
  portionGrams?: number;
  unit: string;
  quantity: number;
}

function formatPrice(price: number): string {
  return '$' + price.toLocaleString('es-CO', { minimumFractionDigits: 2 });
}

function toDateInputValue(date: Date): string {
  return date.toISOString().split('T')[0] ?? '';
}

export default function NewProposalPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState('');
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItem>>(new Map());
  const [itemQuantities, setItemQuantities] = useState<Map<string, number>>(new Map());
  const [clientName, setClientName] = useState('');
  const [eventDate, setEventDate] = useState(toDateInputValue(new Date()));
  const [guestCount, setGuestCount] = useState(1);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Menu[]>('/menus').then(setMenus).catch(console.error);
  }, []);

  const currentMenu = menus.find((m) => m._id === selectedMenuId);

  const selectedArray = Array.from(selectedItems.values());

  function toggleItem(cat: MenuCategory, item: MenuItem) {
    setSelectedItems((prev) => {
      const next = new Map(prev);
      if (next.has(item._id)) {
        next.delete(item._id);
      } else {
        next.set(item._id, {
          _id: item._id,
          name: item.name,
          description: item.description || '',
          categoryId: cat._id,
          categoryLabel: cat.label,
          pricePerPortion: item.pricePerPortion,
          portionGrams: item.portionGrams,
          unit: item.unit || 'gr',
          quantity: itemQuantities.get(item._id) ?? 1,
        });
      }
      return next;
    });
  }

  function setQuantity(itemId: string, qty: number) {
    const sanitized = isNaN(qty) || qty < 1 ? 1 : Math.floor(qty);
    setItemQuantities((prev) => {
      const next = new Map(prev);
      next.set(itemId, sanitized);
      return next;
    });
    setSelectedItems((prev) => {
      const item = prev.get(itemId);
      if (!item) return prev;
      const next = new Map(prev);
      next.set(itemId, { ...item, quantity: sanitized });
      return next;
    });
  }

  async function handleSave() {
    setError('');
    if (!selectedMenuId) { setError(t('proposals.errors.selectMenu')); return; }
    if (selectedArray.length === 0) { setError(t('proposals.errors.selectItem')); return; }
    if (!clientName.trim()) { setError(t('proposals.errors.clientName')); return; }
    if (!eventDate) { setError(t('proposals.errors.eventDate')); return; }

    setSaving(true);
    try {
      const proposal = await api.post<{ _id: string }>('/proposals', {
        menuId: selectedMenuId,
        items: selectedArray.map((i) => ({
          name: i.name,
          description: i.description,
          categoryId: i.categoryId,
          categoryLabel: i.categoryLabel,
          pricePerPortion: i.pricePerPortion,
          portionGrams: i.portionGrams,
          unit: i.unit,
          quantity: i.quantity,
        })),
        clientName: clientName.trim(),
        eventDate,
        guestCount,
        notes: notes.trim() || undefined,
      });
      router.push(`/chef/proposals/${proposal._id}`);
    } catch (err: any) {
      setError(err.message || t('proposals.errors.createFailed'));
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-bold">{t('proposals.newTitle')}</h1>

      <div className="mt-8">
        <label className="mb-2 block text-sm text-gray-400">{t('proposals.detail.menu')}</label>
        <select
          value={selectedMenuId}
          onChange={(e) => {
            setSelectedMenuId(e.target.value);
            setSelectedItems(new Map());
            setItemQuantities(new Map());
          }}
          className="w-full rounded-lg bg-white/10 px-4 py-3 text-white outline-none ring-1 ring-white/20 focus:ring-2 focus:ring-white/40"
        >
          <option value="">{t('proposals.selectMenu')}</option>
          {menus.map((m) => (
            <option key={m._id} value={m._id}>{m.name}</option>
          ))}
        </select>
      </div>

      {currentMenu && (
        <div className="mt-8 space-y-6">
          <h2 className="text-lg font-semibold text-white/80">{t('proposals.selectItems')}</h2>
          {currentMenu.categories.map((cat) => {
            const available = cat.items.filter((i) => i.isAvailable);
            if (available.length === 0) return null;
            return (
              <div key={cat._id}>
                <h3 className="mb-2 text-sm font-medium text-gray-400">{cat.label}</h3>
                <div className="space-y-2">
                  {available.map((item) => {
                    const isSelected = selectedItems.has(item._id);
                    return (
                      <label
                        key={item._id}
                        className={`flex items-center gap-4 rounded-lg px-4 py-3 transition cursor-pointer ${
                          isSelected
                            ? 'bg-green-500/20 ring-1 ring-green-400/40'
                            : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleItem(cat, item)}
                          className="h-4 w-4 accent-green-500"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{item.name}</p>
                          {item.description && (
                            <p className="truncate text-xs text-gray-500">{item.description}</p>
                          )}
                        </div>
                        {item.portionGrams && (
                          <span className="text-xs text-gray-500">{item.portionGrams}{item.unit}</span>
                        )}
                        <span className="text-sm font-medium">{formatPrice(item.pricePerPortion)}</span>
                        {isSelected && (
                          <input
                            type="number"
                            min={1}
                            value={itemQuantities.get(item._id) ?? 1}
                            onChange={(e) => setQuantity(item._id, Number(e.target.value))}
                            onClick={(e) => e.stopPropagation()}
                            className="h-8 w-16 rounded bg-white/10 px-2 text-center text-xs text-white outline-none ring-1 ring-white/20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm text-gray-400">{t('proposals.clientName')}</label>
          <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)}
            placeholder="María Gómez"
            className="w-full rounded-lg bg-white/10 px-4 py-3 text-white outline-none ring-1 ring-white/20 focus:ring-2 focus:ring-white/40" />
        </div>
        <div>
          <label className="mb-2 block text-sm text-gray-400">{t('proposals.eventDate')}</label>
          <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)}
            className="w-full rounded-lg bg-white/10 px-4 py-3 text-white outline-none ring-1 ring-white/20 focus:ring-2 focus:ring-white/40" />
        </div>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm text-gray-400">{t('proposals.guestCount')}</label>
          <input type="number" min={1} value={guestCount}
            onChange={(e) => { const v = Number(e.target.value); setGuestCount(isNaN(v) || v < 1 ? 1 : v); }}
            className="w-full rounded-lg bg-white/10 px-4 py-3 text-white outline-none ring-1 ring-white/20 focus:ring-2 focus:ring-white/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
        </div>
        <div>
          <label className="mb-2 block text-sm text-gray-400">{t('proposals.notes')}</label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder={t('proposals.notesPlaceholder')}
            className="w-full rounded-lg bg-white/10 px-4 py-3 text-white outline-none ring-1 ring-white/20 focus:ring-2 focus:ring-white/40" />
        </div>
      </div>

      {selectedArray.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-white/80">{t('proposals.preview')}</h2>
          <div className="flex flex-wrap gap-8">
            <div className="flex-1 min-w-[280px]">
              <PricingBreakdown
                items={selectedArray}
                guestCount={guestCount}
                categories={currentMenu?.categories.map((c) => ({ id: c.id, label: c.label })) ?? []}
              />
            </div>
            <div className="flex-1 min-w-[200px] space-y-3">
              <h3 className="text-sm font-medium text-gray-400">{t('proposals.selectedItems')}</h3>
              {selectedArray.map((item) => (
                <div key={item._id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{item.name}</span>
                  <span className="text-gray-500">× {item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <div className="mt-8 flex items-center gap-4">
        <button onClick={handleSave} disabled={saving}
          className="rounded-lg bg-white/10 px-6 py-3 font-medium text-white transition hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed">
          {saving ? t('proposals.saving') : t('proposals.saveDraft')}
        </button>
        <button onClick={() => router.push('/chef/proposals')} className="text-sm text-gray-500 hover:text-white">{t('common.cancel')}</button>
      </div>
    </div>
  );
}
