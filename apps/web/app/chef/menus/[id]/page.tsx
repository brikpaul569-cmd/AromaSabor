'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, ApiClientError } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

interface MenuCategoryItem {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
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
  items: MenuCategoryItem[];
}

interface Menu {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  categories: MenuCategory[];
  isActive: boolean;
}

function formatPrice(price: number): string {
  return '$' + price.toLocaleString('es-CO', { minimumFractionDigits: 2 });
}

export default function MenuEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const id = params.id as string;

  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [publishing, setPublishing] = useState(false);

  // Category form
  const [catId, setCatId] = useState('');
  const [catLabel, setCatLabel] = useState('');
  const [catMaxItems, setCatMaxItems] = useState('1');
  const [addingCat, setAddingCat] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [showCatForm, setShowCatForm] = useState(false);

  // Item form
  const [itemCategoryId, setItemCategoryId] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemPortionGrams, setItemPortionGrams] = useState('');
  const [itemUnit, setItemUnit] = useState('gr');
  const [itemAvailable, setItemAvailable] = useState(true);
  const [addingItem, setAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemCatId, setEditingItemCatId] = useState<string | null>(null);
  const [showItemForm, setShowItemForm] = useState(false);

  const fetchMenu = useCallback(async () => {
    try {
      const data = await api.get<Menu>('/menus/' + id);
      setMenu(data);
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        router.push('/login');
      } else {
        setError(t('menus.editor.failedLoad'));
      }
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  function resetCatForm() {
    setCatId(''); setCatLabel(''); setCatMaxItems('1');
    setEditingCatId(null); setShowCatForm(false);
  }

  function resetItemForm() {
    setItemCategoryId(''); setItemName(''); setItemDescription('');
    setItemPrice(''); setItemPortionGrams(''); setItemUnit('gr');
    setItemAvailable(true); setEditingItemId(null); setEditingItemCatId(null);
    setShowItemForm(false);
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    setAddingCat(true);
    try {
      const updated = await api.post<Menu>(`/menus/${id}/categories`, {
        id: catId.trim().toLowerCase().replace(/\s+/g, '-'),
        label: catLabel.trim(),
        maxItems: parseInt(catMaxItems) || 1,
      });
      setMenu(updated);
      resetCatForm();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t('menus.editor.failedAddCategory'));
    } finally {
      setAddingCat(false);
    }
  }

  async function handleUpdateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCatId) return;
    setAddingCat(true);
    try {
      const updated = await api.patch<Menu>(`/menus/${id}/categories/${editingCatId}`, {
        id: catId.trim().toLowerCase().replace(/\s+/g, '-'),
        label: catLabel.trim(),
        maxItems: parseInt(catMaxItems) || 1,
      });
      setMenu(updated);
      resetCatForm();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t('menus.editor.failedUpdateCategory'));
    } finally {
      setAddingCat(false);
    }
  }

  async function handleDeleteCategory(categoryId: string) {
    try {
      const updated = await api.delete<Menu>(`/menus/${id}/categories/${categoryId}`);
      setMenu(updated);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t('menus.editor.failedDeleteCategory'));
    }
  }

  function startEditCategory(cat: MenuCategory) {
    setCatId(cat.id);
    setCatLabel(cat.label);
    setCatMaxItems(cat.maxItems.toString());
    setEditingCatId(cat._id);
    setShowCatForm(true);
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    setAddingItem(true);
    try {
      const updated = await api.post<Menu>(`/menus/${id}/categories/${itemCategoryId}/items`, {
        name: itemName,
        description: itemDescription || undefined,
        pricePerPortion: parseFloat(itemPrice),
        portionGrams: itemPortionGrams ? parseInt(itemPortionGrams) : undefined,
        unit: itemUnit,
        isAvailable: itemAvailable,
      });
      setMenu(updated);
      resetItemForm();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t('menus.editor.failedAddItem'));
    } finally {
      setAddingItem(false);
    }
  }

  async function handleUpdateItem(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItemId || !editingItemCatId) return;
    setAddingItem(true);
    try {
      const updated = await api.patch<Menu>(`/menus/${id}/categories/${editingItemCatId}/items/${editingItemId}`, {
        name: itemName,
        description: itemDescription || undefined,
        pricePerPortion: parseFloat(itemPrice),
        portionGrams: itemPortionGrams ? parseInt(itemPortionGrams) : undefined,
        unit: itemUnit,
        isAvailable: itemAvailable,
      });
      setMenu(updated);
      resetItemForm();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t('menus.editor.failedUpdateItem'));
    } finally {
      setAddingItem(false);
    }
  }

  async function handleDeleteItem(categoryId: string, itemId: string) {
    try {
      const updated = await api.delete<Menu>(`/menus/${id}/categories/${categoryId}/items/${itemId}`);
      setMenu(updated);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t('menus.editor.failedDeleteItem'));
    }
  }

  function startEditItem(catId: string, item: MenuCategoryItem) {
    setItemCategoryId(catId);
    setItemName(item.name);
    setItemDescription(item.description || '');
    setItemPrice(item.pricePerPortion.toString());
    setItemPortionGrams(item.portionGrams?.toString() || '');
    setItemUnit(item.unit || 'gr');
    setItemAvailable(item.isAvailable);
    setEditingItemId(item._id);
    setEditingItemCatId(catId);
    setShowItemForm(true);
  }

  if (loading) return <div className="p-8"><p className="text-gray-500">{t('common.loading')}</p></div>;
  if (!menu) return <div className="p-8"><p className="text-red-400">{error || t('public.menu.notFound')}</p></div>;

  return (
    <div className="p-8">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/chef/menus')} className="text-sm text-gray-400 hover:text-white">&larr; {t('common.back')}</button>
      </div>

      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{menu.name}</h1>
          {menu.description && <p className="mt-1 text-gray-400">{menu.description}</p>}
          <p className="mt-1 text-xs text-gray-500">{menu.categories.reduce((s, c) => s + c.items.length, 0)} {t('menus.editor.items')} &middot; /{menu.slug}</p>
          {menu.isActive && (
            <p className="mt-1 text-xs text-green-400">
              {t('menus.editor.publicUrl')}: {typeof window !== 'undefined' ? window.location.origin : ''}/menu/{menu.slug}
            </p>
          )}
        </div>
        <button
          onClick={async () => {
            setPublishing(true);
            try {
              const updated = await api.patch<Menu>(`/menus/${id}/publish`, { isActive: !menu.isActive });
              setMenu(updated);
            } catch (err) {
              setError(err instanceof ApiClientError ? err.message : t('menus.editor.failedPublish'));
            } finally {
              setPublishing(false);
            }
          }}
          disabled={publishing}
          className={`shrink-0 rounded-lg px-5 py-2 text-sm font-medium transition disabled:opacity-50 ${
            menu.isActive
              ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
              : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
          }`}
        >
          {publishing ? '...' : menu.isActive ? t('menus.editor.unpublish') : t('menus.editor.publish')}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {/* Category form */}
      {showCatForm && (
        <form onSubmit={editingCatId ? handleUpdateCategory : handleAddCategory} className="mt-6 rounded-xl bg-white/10 p-6">
          <h2 className="text-lg font-semibold">{editingCatId ? t('menus.editor.editCategory') : t('menus.editor.addCategory')}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-sm text-gray-400">{t('menus.editor.slug')}</label>
              <input type="text" required value={catId} onChange={(e) => setCatId(e.target.value)}
                placeholder={t('menus.editor.slugPlaceholder')}
                className="mt-1 w-full rounded-lg bg-white/10 px-4 py-2 text-sm outline-none ring-1 ring-white/20 focus:ring-white/40" />
            </div>
            <div>
              <label className="text-sm text-gray-400">{t('menus.editor.categoryLabel')}</label>
              <input type="text" required value={catLabel} onChange={(e) => setCatLabel(e.target.value)}
                placeholder={t('menus.editor.categoryPlaceholder')}
                className="mt-1 w-full rounded-lg bg-white/10 px-4 py-2 text-sm outline-none ring-1 ring-white/20 focus:ring-white/40" />
            </div>
            <div>
              <label className="text-sm text-gray-400">{t('menus.editor.maxItems')}</label>
              <input type="number" required min="1" value={catMaxItems} onChange={(e) => setCatMaxItems(e.target.value)}
                className="mt-1 w-full rounded-lg bg-white/10 px-4 py-2 text-sm outline-none ring-1 ring-white/20 focus:ring-white/40" />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button type="submit" disabled={addingCat}
              className="rounded-lg bg-white/20 px-6 py-2 text-sm font-medium transition hover:bg-white/30 disabled:opacity-50">
              {addingCat ? t('menus.editor.saving') : editingCatId ? t('common.save') : t('menus.editor.addCategory')}
            </button>
            <button type="button" onClick={resetCatForm}
              className="rounded-lg bg-white/5 px-6 py-2 text-sm transition hover:bg-white/10">{t('common.cancel')}</button>
          </div>
        </form>
      )}

      {/* Categories */}
      <div className="mt-8 space-y-8">
        {menu.categories.length === 0 && !showCatForm && (
          <div className="rounded-xl bg-white/5 p-8 text-center">
            <p className="text-gray-500">{t('menus.editor.noCategories')}</p>
            <button onClick={() => setShowCatForm(true)} className="mt-3 text-sm text-blue-400 hover:text-blue-300">
              + {t('menus.editor.addCategory')}
            </button>
          </div>
        )}
        {!showCatForm && menu.categories.length > 0 && (
          <button onClick={() => setShowCatForm(true)}
            className="mb-4 rounded-lg bg-white/10 px-4 py-2 text-sm transition hover:bg-white/20">
            + {t('menus.editor.addCategory')}
          </button>
        )}

        {menu.categories.map((cat) => (
          <div key={cat._id} className="rounded-xl bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{cat.label}</h3>
                <p className="text-xs text-gray-500">{t('menus.editor.slug')}: {cat.id} &middot; {t('menus.editor.maxItems')} {cat.maxItems} &middot; {cat.items.length} {t('menus.editor.items')}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEditCategory(cat)} className="text-xs text-gray-400 hover:text-white">{t('menus.editor.edit')}</button>
                <button onClick={() => handleDeleteCategory(cat._id)} className="text-xs text-red-400 hover:text-red-300">{t('menus.editor.delete')}</button>
              </div>
            </div>

            {/* Items */}
            <div className="mt-4 space-y-2">
              {cat.items.length === 0 && (
                <p className="text-sm text-gray-500">{t('menus.editor.noItems')}</p>
              )}
              {cat.items.map((item) => (
                <div key={item._id} className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    {item.description && <p className="truncate text-xs text-gray-500">{item.description}</p>}
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    {!item.isAvailable && <span className="text-xs text-red-400">{t('menus.editor.unavailable')}</span>}
                    {item.portionGrams && <span className="text-xs text-gray-500">{item.portionGrams}{item.unit || 'gr'}</span>}
                    <span className="text-sm font-medium">{formatPrice(item.pricePerPortion)}</span>
                    <button onClick={() => startEditItem(cat._id, item)} className="text-xs text-gray-400 hover:text-white">{t('menus.editor.edit')}</button>
                    <button onClick={() => handleDeleteItem(cat._id, item._id)} className="text-xs text-red-400 hover:text-red-300">{t('menus.editor.delete')}</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add item button */}
            <button
              onClick={() => {
                setItemCategoryId(cat._id);
                setShowItemForm(true);
              }}
              className="mt-3 text-sm text-blue-400 hover:text-blue-300"
            >
              + {t('menus.editor.addItem')}
            </button>
          </div>
        ))}
      </div>

      {/* Item form modal */}
      {showItemForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={editingItemId ? handleUpdateItem : handleAddItem} className="w-full max-w-lg rounded-xl bg-gray-800 p-6 shadow-2xl ring-1 ring-white/20">
            <h2 className="text-lg font-semibold">{editingItemId ? t('menus.editor.edit') + ' ' + t('menus.editor.itemName') : t('menus.editor.addItem')}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-sm text-gray-400">{t('menus.editor.itemName')}</label>
                <input type="text" required value={itemName} onChange={(e) => setItemName(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-white/10 px-4 py-2 text-sm outline-none ring-1 ring-white/20 focus:ring-white/40" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm text-gray-400">{t('menus.editor.itemDescription')}</label>
                <input type="text" value={itemDescription} onChange={(e) => setItemDescription(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-white/10 px-4 py-2 text-sm outline-none ring-1 ring-white/20 focus:ring-white/40" />
              </div>
              <div>
                <label className="text-sm text-gray-400">{t('menus.editor.itemPrice')}</label>
                <input type="number" required min="0" step="0.01" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-white/10 px-4 py-2 text-sm outline-none ring-1 ring-white/20 focus:ring-white/40" />
              </div>
              <div>
                <label className="text-sm text-gray-400">{t('menus.editor.itemWeight')}</label>
                <input type="number" min="0" value={itemPortionGrams} onChange={(e) => setItemPortionGrams(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-white/10 px-4 py-2 text-sm outline-none ring-1 ring-white/20 focus:ring-white/40" />
              </div>
              <div>
                <label className="text-sm text-gray-400">{t('menus.editor.unit')}</label>
                <select value={itemUnit} onChange={(e) => setItemUnit(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-white/10 px-4 py-2 text-sm outline-none ring-1 ring-white/20 focus:ring-white/40">
                  <option value="gr" className="bg-gray-900">gr</option>
                  <option value="ml" className="bg-gray-900">ml</option>
                  <option value="und" className="bg-gray-900">und</option>
                </select>
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm text-gray-400">
                  <input type="checkbox" checked={itemAvailable} onChange={(e) => setItemAvailable(e.target.checked)}
                    className="rounded bg-white/10" />
                  {t('menus.editor.available')}
                </label>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button type="submit" disabled={addingItem}
                className="rounded-lg bg-white/20 px-6 py-2 text-sm font-medium transition hover:bg-white/30 disabled:opacity-50">
                {addingItem ? t('menus.editor.saving') : editingItemId ? t('common.save') : t('menus.editor.addItem')}
              </button>
              <button type="button" onClick={resetItemForm}
                className="rounded-lg bg-white/5 px-6 py-2 text-sm transition hover:bg-white/10">{t('common.cancel')}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
