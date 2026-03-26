import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import translations, { Locale } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = '@gujaraticonnect_locale';

type I18nContextType = {
  locale: Locale;
  t: (key: string, fallback?: string) => string;
  setLocale: (locale: Locale) => Promise<void>;
  isGujarati: boolean;
};

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  t: (key) => key,
  setLocale: async () => {},
  isGujarati: false,
});

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    // Load saved preference
    AsyncStorage.getItem(STORAGE_KEY).then((saved: string | null) => {
      if (saved === 'en' || saved === 'gu') {
        setLocaleState(saved);
      }
    });
  }, []);

  const t = (key: string, fallback?: string): string => {
    return translations[locale][key] ?? translations['en'][key] ?? fallback ?? key;
  };

  const setLocale = async (newLocale: Locale) => {
    setLocaleState(newLocale);
    await AsyncStorage.setItem(STORAGE_KEY, newLocale);

    // Persist to Supabase profile if logged in (best-effort, fire and forget)
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await (supabase.from('profiles') as any)
          .update({ preferred_language: newLocale })
          .eq('id', session.user.id);
      }
    } catch (_) {}
  };

  return (
    <I18nContext.Provider value={{ locale, t, setLocale, isGujarati: locale === 'gu' }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
