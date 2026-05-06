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

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Locale>('en');

  useEffect(() => {
    const saved = localStorage.getItem('tensai_lang') as Locale | null;
    if (saved === 'en' || saved === 'ja') setLang(saved);
  }, []);

  const toggle = useCallback(() => {
    setLang((prev) => {
      const next: Locale = prev === 'en' ? 'ja' : 'en';
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
