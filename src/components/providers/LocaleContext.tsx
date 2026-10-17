"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { translations, type Locale, type MessageKey, type PluralKey } from "@/lib/i18n/translations";

const STORAGE_KEY = "pickle.locale";
const listeners = new Set<() => void>();
let current: Locale | null = null;

function detect(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "el") return saved;
  } catch {}
  return navigator.language?.toLowerCase().startsWith("el") ? "el" : "en";
}

const store = {
  get: (): Locale => (current ??= detect()),
  getServer: (): Locale => "en",
  set(next: Locale) {
    current = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

type Vars = Record<string, string | number>;

function interpolate(template: string, vars?: Vars) {
  return vars ? template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`)) : template;
}

interface LocaleValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: MessageKey, vars?: Vars) => string;
  tp: (key: PluralKey, n: number, vars?: Vars) => string;
}

const LocaleContext = createContext<LocaleValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(store.subscribe, store.get, store.getServer);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback<LocaleValue["t"]>(
    (key, vars) => interpolate(translations[locale][key], vars),
    [locale],
  );
  const tp = useCallback<LocaleValue["tp"]>(
    (key, n, vars) => {
      const forms = translations[locale][key];
      const rule = new Intl.PluralRules(locale).select(n) === "one" ? "one" : "other";
      return interpolate(forms[rule], { n, ...vars });
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale: store.set, t, tp }), [locale, t, tp]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useI18n must be used inside LocaleProvider");
  return ctx;
}
