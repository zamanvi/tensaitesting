'use client';
import translations, { type Locale, type Translations } from '@/lib/i18n';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface LanguageContextValue {
  lang: Locale;
  toggle: () => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  toggle: () => {},
  t: translations.en,
});

const CYCLE: Locale[] = ['en', 'bn', 'ja'];

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Locale>('en');

  useEffect(() => {
    const saved = localStorage.getItem('tensai_lang') as Locale | null;
    if (saved && CYCLE.includes(saved)) setLang(saved);
  }, []);

  const toggle = useCallback(() => {
    setLang((prev) => {
      const idx = CYCLE.indexOf(prev);
      const next = CYCLE[(idx + 1) % CYCLE.length];
      localStorage.setItem('tensai_lang', next);
      return next;
    });
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, toggle, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
