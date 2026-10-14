"use client";
import { useI18n } from "@/lib/i18n/LocaleContext";
import { LOCALES } from "@/lib/i18n/translations";
import { Wordmark } from "./Logo";

export function SiteFooter() {
  const { locale, setLocale, t } = useI18n();
  return (
    <footer className="mt-auto flex w-full flex-col items-center justify-between gap-5 px-4 py-8 text-sm text-ink-muted sm:flex-row sm:flex-wrap sm:px-6 lg:px-10">
      <Wordmark />
      <p>{t("footerMadeWith")}</p>
      <div role="group" aria-label={t("languageLabel")} className="flex rounded-full bg-surface-variant p-1 font-semibold">
        {LOCALES.map((language) => (
          <button key={language} type="button" lang={language} aria-pressed={locale === language} onClick={() => setLocale(language)}
            className={`min-h-11 min-w-11 rounded-full px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${locale === language ? "bg-paper text-ink" : "text-ink-muted hover:text-ink"}`}>
            {language.toUpperCase()}
          </button>
        ))}
      </div>
    </footer>
  );
}
