'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiClientError } from '@/lib/api';

interface AdminUser {
  _id: string;
  email: string;
  name: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<AdminUser>('/auth/me')
      .then(setAdmin)
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleLogout() {
    await api.post('/auth/logout');
    router.push('/login');
  }

  if (loading) return <div className="p-8"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          {admin && <p className="mt-1 text-gray-400">Welcome, {admin.name}</p>}
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg bg-white/10 px-4 py-2 text-sm transition hover:bg-white/20"
        >
          Logout
        </button>
      </div>

      <div className="mt-12 rounded-xl bg-white/5 p-8 text-center">
        <p className="text-gray-500">Proposals will appear here</p>
      </div>
    </div>
  );
}
