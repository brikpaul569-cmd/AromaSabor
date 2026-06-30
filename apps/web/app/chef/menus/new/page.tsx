'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiClientError } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

export default function NewMenuPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const menu = await api.post<{ _id: string }>('/menus', { name, description: description || undefined });
      router.push(`/chef/menus/${menu._id}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg p-8">
      <h1 className="mb-6 text-3xl font-bold">{t('menus.newTitle')}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="text-sm text-gray-400">{t('menus.nameLabel')}</label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg bg-white/10 px-4 py-2 text-sm outline-none ring-1 ring-white/20 focus:ring-white/40"
          />
        </div>

        <div>
          <label htmlFor="description" className="text-sm text-gray-400">{t('menus.descriptionLabel')}</label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-lg bg-white/10 px-4 py-2 text-sm outline-none ring-1 ring-white/20 focus:ring-white/40"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-white/20 px-6 py-2 text-sm font-medium transition hover:bg-white/30 disabled:opacity-50"
          >
            {loading ? t('menus.creating') : t('menus.create')}
          </button>
          <button
            type="button"
            onClick={() => router.push('/chef/menus')}
            className="rounded-lg bg-white/5 px-6 py-2 text-sm transition hover:bg-white/10"
          >
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}
