"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/LocaleContext";
import { LOCALES } from "@/lib/i18n/translations";
import { Logo } from "./Logo";

export function Header() {
  const { locale, setLocale, t } = useI18n();
  return (
    <header className="mx-auto flex w-full max-w-120 items-center justify-between px-4 pt-4 pb-2">
      <Link href="/" className="flex items-center gap-2 rounded-full text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        <Logo />
        {t("appName")}
      </Link>
      <div role="group" aria-label={t("languageLabel")} className="flex rounded-full bg-surface-variant p-1 text-sm font-semibold">
        {LOCALES.map((l) => (
          <button
            key={l}
            type="button"
            lang={l}
            aria-pressed={locale === l}
            onClick={() => setLocale(l)}
            className={`min-h-8 min-w-11 rounded-full px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              locale === l ? "bg-primary text-on-primary" : "text-ink hover:bg-surface-variant-hover"
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>
    </header>
  );
}
