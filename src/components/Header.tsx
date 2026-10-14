"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { PLAY_STORE_URL } from "@/lib/config";
import { useI18n } from "@/lib/i18n/LocaleContext";
import { LOCALES } from "@/lib/i18n/translations";
import { Wordmark } from "./Logo";
import { buttonClass } from "./ui/Button";

/** `landing` shows the app CTA; poll pages show the voter avatar instead. */
export function Header({ landing = false }: { landing?: boolean }) {
  const { locale, setLocale, t } = useI18n();
  const { profile, openProfile } = useAuth();

  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
      <Link href="/" aria-label="Pickle" className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-cream">
        <Wordmark />
      </Link>

      <div className="flex items-center gap-2 sm:gap-3">
        <Link href="/dashboard" className={buttonClass("text", "px-2 text-sm")}>{t("dashboard")}</Link>
        <div role="group" aria-label={t("languageLabel")} className="flex rounded-full bg-surface-variant p-1 text-sm font-semibold">
          {LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              lang={l}
              aria-pressed={locale === l}
              onClick={() => setLocale(l)}
              className={`min-h-9 min-w-11 rounded-full px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                locale === l ? `bg-paper text-ink ${landing ? "" : "shadow-[0_0_0_2px_var(--color-ink)]"}` : "text-ink-muted hover:text-ink"
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        {landing && (
          <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className={buttonClass("text", "min-h-11 px-5 text-sm max-sm:hidden")}>
            {t("getTheApp")}
          </a>
        )}

        {!landing && profile.avatarUrl && (
          <button
            type="button"
            onClick={openProfile}
            aria-label={t("editProfile")}
            title={profile.displayName ?? undefined}
            className="h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-ink bg-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- remote SVG avatar */}
            <img src={profile.avatarUrl} alt="" width={44} height={44} className="h-full w-full" />
          </button>
        )}
      </div>
    </header>
  );
}
