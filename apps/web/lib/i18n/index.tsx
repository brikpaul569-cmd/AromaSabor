'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

type Locale = 'es' | 'en';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function loadMessages(locale: Locale): Record<string, string> {
  try {
    // Dynamic import won't work here — use require-style with try/catch
    // ESM dynamic import is async, but for our use case sync is better
    const messages = locale === 'es'
      ? require('./locales/es.json')
      : require('./locales/en.json');
    return messages as Record<string, string>;
  } catch {
    return {};
  }
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? `{${key}}`));
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('es');
  const [messages, setMessages] = useState<Record<string, string>>({});

  // Load initial locale from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('locale');
    const initial: Locale = stored === 'en' ? 'en' : 'es';
    setLocaleState(initial);
    setMessages(loadMessages(initial));
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setMessages(loadMessages(newLocale));
    try {
      localStorage.setItem('locale', newLocale);
    } catch {}
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const template = messages[key];
      if (template === undefined) return key;
      return interpolate(template, params);
    },
    [messages],
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Fallback outside provider — return identity t()
    return {
      locale: 'es',
      setLocale: () => {},
      t: (key: string, params?: Record<string, string | number>) => {
        if (!params) return key;
        return key.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
      },
    };
  }
  return ctx;
}
