"use client";

import { PLAY_STORE_URL } from "@/lib/config";
import { useI18n } from "@/lib/i18n/LocaleContext";
import { PlayIcon } from "./icons";
import { Logo } from "./Logo";

export function FooterBanner() {
  const { t } = useI18n();
  return (
    <aside className="flex flex-col items-center gap-4 rounded-card border-2 border-ink bg-ink px-6 py-6 text-center text-cream sm:flex-row sm:text-left">
      <Logo size={40} />
      <p className="flex-1 font-display text-lg font-semibold">{t("footerText")}</p>
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full border-2 border-cream bg-mustard px-5 font-semibold text-ink transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
      >
        <PlayIcon /> {t("footerCta")}
      </a>
    </aside>
  );
}
