'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { api, ApiClientError } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import ClientSidebar from '@/components/ClientSidebar';

interface ClientUser {
  _id: string;
  email: string;
  name: string;
}

const AUTH_PAGES = ['/client/login', '/client/register'];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<ClientUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const isAuthPage = AUTH_PAGES.includes(pathname);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (isAuthPage) {
      setChecking(false);
      return;
    }

    api.get<ClientUser>('/auth/client/me')
      .then((u) => {
        setUser(u);
        setChecking(false);
      })
      .catch((err) => {
        if (err instanceof ApiClientError && err.statusCode === 401) {
          router.push('/client/login');
        } else {
          setChecking(false);
        }
      });
  }, [router, isAuthPage]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">{t('client.loading')}</p>
      </div>
    );
  }

  // Auth pages (login/register) — no sidebar
  if (isAuthPage || !user) {
    return <div className="min-h-screen">{children}</div>;
  }

  // Authenticated pages — with sidebar
  return (
    <div className="min-h-screen">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen((o) => !o)}
        className="fixed left-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-gray-400 shadow-lg md:hidden"
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <ClientSidebar user={user} />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && isMobile && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/50"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 z-40"
            >
              <ClientSidebar user={user} onNavigate={() => setSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className={`min-h-screen transition-all duration-200 ${isMobile ? '' : 'ml-60'}`}>
        {children}
      </main>
    </div>
  );
}
