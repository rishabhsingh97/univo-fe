import { createContext, useContext, type ReactNode } from 'react';
import en, { type Dictionary } from '../locales/en';

// Only 'en' is populated for now - add a new locale by dropping a locales/<code>.ts file
// (same shape as en.ts) and registering it here.
const DICTIONARIES: Record<string, Dictionary> = { en };
const DEFAULT_LOCALE = 'en';

interface LocaleContextValue {
  locale: string;
  t: (path: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

function resolve(dict: Dictionary, path: string): string | undefined {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, dict) as string | undefined;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  // Hardcoded to English for now - swap for a user/tenant preference (localStorage, profile
  // setting, Accept-Language, etc.) once a second locale actually exists.
  const locale = DEFAULT_LOCALE;
  const dict = DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];

  const t = (path: string): string => resolve(dict, path) ?? path;

  return <LocaleContext.Provider value={{ locale, t }}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within a LocaleProvider');
  return ctx;
}
