'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

type Category = 'entrada' | 'plato_fuerte' | 'guarnicion' | 'postre';

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  category: Category;
  price: number;
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
  return '$' + price.toLocaleString('es-MX', { minimumFractionDigits: 2 });
}

export default function PublicMenuPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get<Menu>('/menus/slug/' + slug)
      .then(setMenu)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

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

  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    items: menu.items.filter((i) => i.category === cat.value),
  }));

  const total = menu.items.reduce((sum, i) => sum + i.price, 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <header className="text-center">
          <h1 className="text-4xl font-bold">{menu.name}</h1>
          {menu.description && <p className="mt-2 text-gray-400">{menu.description}</p>}
          <p className="mt-1 text-sm text-gray-500">by {menu.createdBy?.name || 'Chef'}</p>
        </header>

        <div className="mt-12 space-y-10">
          {grouped.map((group) => (
            <section key={group.value}>
              <h2 className="text-xl font-semibold text-white/80">{group.label}</h2>
              {group.items.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500">No items in this category</p>
              ) : (
                <ul className="mt-4 divide-y divide-white/10">
                  {group.items.map((item) => (
                    <li key={item._id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        {item.description && (
                          <p className="text-sm text-gray-400">{item.description}</p>
                        )}
                      </div>
                      <span className="shrink-0 ml-4 text-sm font-medium">
                        {formatPrice(item.price)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-right">
          <p className="text-lg font-semibold">Total: {formatPrice(total)}</p>
          <p className="text-xs text-gray-500">+ 16% IVA</p>
        </div>
      </div>
    </div>
  );
}
