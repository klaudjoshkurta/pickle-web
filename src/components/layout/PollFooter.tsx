"use client";

import { useI18n } from "@/components/providers/LocaleContext";
import { LOCALES } from "@/lib/i18n/translations";

export function PollFooter() {
  const { locale, setLocale, t } = useI18n();
  return (
    <footer className="mx-auto mt-auto flex w-full max-w-180 flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-ink-muted">
      <span>Pickle</span>
      <div role="group" aria-label={t("languageLabel")}>
        {LOCALES.map((language) => (
          <button key={language} type="button" onClick={() => setLocale(language)} aria-pressed={locale === language}
            className="min-h-11 min-w-11 rounded-full px-3 font-bold aria-pressed:bg-primary-soft aria-pressed:text-primary focus-visible:outline-2 focus-visible:outline-primary">
            {language.toUpperCase()}
          </button>
        ))}
      </div>
    </footer>
  );
}
