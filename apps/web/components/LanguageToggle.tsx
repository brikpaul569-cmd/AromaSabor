'use client';

import { useTranslation } from '@/lib/i18n';

export default function LanguageToggle() {
  const { locale, setLocale } = useTranslation();

  return (
    <button
      onClick={() => setLocale(locale === 'es' ? 'en' : 'es')}
      className="rounded-md bg-white/10 px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:bg-white/20"
      title={locale === 'es' ? 'Switch to English' : 'Cambiar a español'}
    >
      {locale === 'es' ? 'EN' : 'ES'}
    </button>
  );
}
