'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiClientError } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

export default function ClientLoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/client/login', { email, password });
      router.push('/client/dashboard');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm rounded-xl bg-white/10 p-8 backdrop-blur-lg">
        <h1 className="mb-6 text-2xl font-bold">{t('client.login')}</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="text-sm text-gray-400">{t('client.email')}</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg bg-white/10 px-4 py-2 text-sm outline-none ring-1 ring-white/20 focus:ring-white/40"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm text-gray-400">{t('client.password')}</label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg bg-white/10 px-4 py-2 text-sm outline-none ring-1 ring-white/20 focus:ring-white/40"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white/20 px-4 py-2 text-sm font-medium transition hover:bg-white/30 disabled:opacity-50"
          >
            {loading ? t('auth.pleaseWait') : t('client.signIn')}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          {t('client.noAccount')}{' '}
          <Link href="/client/register" className="text-white underline">
            {t('auth.registerLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}
