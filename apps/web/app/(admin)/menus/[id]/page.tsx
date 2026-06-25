'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, ApiClientError } from '@/lib/api';

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
  _id: string;
  name: string;
  slug: string;
  description?: string;
  items: MenuItem[];
  isActive: boolean;
}

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'plato_fuerte', label: 'Plato Fuerte' },
  { value: 'guarnicion', label: 'Guarnición' },
  { value: 'postre', label: 'Postre' },
];

function formatPrice(price: number): string {
  return '$' + price.toLocaleString('es-MX', { minimumFractionDigits: 2 });
}

export default function MenuEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemCategory, setItemCategory] = useState<Category>('entrada');
  const [itemPrice, setItemPrice] = useState('');
  const [itemWeight, setItemWeight] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const fetchMenu = useCallback(async () => {
    try {
      const data = await api.get<Menu>('/menus/' + id);
      setMenu(data);
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        router.push('/login');
      } else {
        setError('Failed to load menu');
      }
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    try {
      const updated = await api.post<Menu>(`/menus/${id}/items`, {
        name: itemName,
        description: itemDescription,
        category: itemCategory,
        price: parseFloat(itemPrice),
        weight: itemWeight ? parseInt(itemWeight) : undefined,
      });
      setMenu(updated);
      setItemName('');
      setItemDescription('');
      setItemCategory('entrada');
      setItemPrice('');
      setItemWeight('');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to add item');
    } finally {
      setAdding(false);
    }
  }

  async function handleDeleteItem(itemId: string) {
    try {
      const updated = await api.delete<Menu>(`/menus/${id}/items/${itemId}`);
      setMenu(updated);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to delete item');
    }
  }

  function startEdit(item: MenuItem) {
    setEditingItemId(item._id);
    setItemName(item.name);
    setItemDescription(item.description);
    setItemCategory(item.category);
    setItemPrice(item.price.toString());
    setItemWeight(item.weight?.toString() || '');
  }

  async function handleUpdateItem(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItemId) return;
    setAdding(true);
    try {
      const updated = await api.patch<Menu>(`/menus/${id}/items/${editingItemId}`, {
        name: itemName,
        description: itemDescription,
        category: itemCategory,
        price: parseFloat(itemPrice),
        weight: itemWeight ? parseInt(itemWeight) : undefined,
      });
      setMenu(updated);
      cancelEdit();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to update item');
    } finally {
      setAdding(false);
    }
  }

  function cancelEdit() {
    setEditingItemId(null);
    setItemName('');
    setItemDescription('');
    setItemCategory('entrada');
    setItemPrice('');
    setItemWeight('');
  }

  if (loading) return <div className="p-8"><p className="text-gray-500">Loading...</p></div>;
  if (!menu) return <div className="p-8"><p className="text-red-400">{error || 'Menu not found'}</p></div>;

  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    items: menu.items.filter((i) => i.category === cat.value),
  }));

  return (
    <div className="p-8">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/menus')} className="text-sm text-gray-400 hover:text-white">&larr; Back</button>
      </div>

      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{menu.name}</h1>
          {menu.description && <p className="mt-1 text-gray-400">{menu.description}</p>}
          <p className="mt-1 text-xs text-gray-500">{menu.items.length} items &middot; /{menu.slug}</p>
          {menu.isActive && (
            <p className="mt-1 text-xs text-green-400">
              Public: {typeof window !== 'undefined' ? window.location.origin : ''}/menu/{menu.slug}
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
              setError(err instanceof ApiClientError ? err.message : 'Failed to update publish status');
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
          {publishing ? '...' : menu.isActive ? 'Unpublish' : 'Publish'}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {/* Item form */}
      <form onSubmit={editingItemId ? handleUpdateItem : handleAddItem} className="mt-8 rounded-xl bg-white/10 p-6">
        <h2 className="text-lg font-semibold">{editingItemId ? 'Edit Item' : 'Add Item'}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-gray-400">Name</label>
            <input
              type="text"
              required
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="mt-1 w-full rounded-lg bg-white/10 px-4 py-2 text-sm outline-none ring-1 ring-white/20 focus:ring-white/40"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400">Category</label>
            <select
              value={itemCategory}
              onChange={(e) => setItemCategory(e.target.value as Category)}
              className="mt-1 w-full rounded-lg bg-white/10 px-4 py-2 text-sm outline-none ring-1 ring-white/20 focus:ring-white/40"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value} className="bg-gray-900">{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-400">Description</label>
            <input
              type="text"
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              className="mt-1 w-full rounded-lg bg-white/10 px-4 py-2 text-sm outline-none ring-1 ring-white/20 focus:ring-white/40"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400">Price ($)</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              className="mt-1 w-full rounded-lg bg-white/10 px-4 py-2 text-sm outline-none ring-1 ring-white/20 focus:ring-white/40"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400">Weight (g, optional)</label>
            <input
              type="number"
              min="0"
              value={itemWeight}
              onChange={(e) => setItemWeight(e.target.value)}
              className="mt-1 w-full rounded-lg bg-white/10 px-4 py-2 text-sm outline-none ring-1 ring-white/20 focus:ring-white/40"
            />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            type="submit"
            disabled={adding}
            className="rounded-lg bg-white/20 px-6 py-2 text-sm font-medium transition hover:bg-white/30 disabled:opacity-50"
          >
            {adding ? 'Saving...' : editingItemId ? 'Update Item' : 'Add Item'}
          </button>
          {editingItemId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-lg bg-white/5 px-6 py-2 text-sm transition hover:bg-white/10"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Items grouped by category */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {grouped.map((group) => (
          <div key={group.value}>
            <h3 className="text-lg font-semibold text-white/80">{group.label}</h3>
            {group.items.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">No items</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {group.items.map((item) => (
                  <li key={item._id} className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-gray-500 truncate">{item.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      {item.weight && <span className="text-xs text-gray-500">{item.weight}g</span>}
                      <span className="text-sm font-medium">{formatPrice(item.price)}</span>
                      <button onClick={() => startEdit(item)} className="text-xs text-gray-400 hover:text-white">Edit</button>
                      <button onClick={() => handleDeleteItem(item._id)} className="text-xs text-red-400 hover:text-red-300">Del</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
