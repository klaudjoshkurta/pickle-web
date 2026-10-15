"use client";
import { PLAY_STORE_URL } from "@/lib/config";
import { useI18n } from "@/lib/i18n/LocaleContext";
import { buttonClass } from "./ui/Button";

export function FooterBanner() {
  const { t } = useI18n();
  return (
    <aside className="flex flex-col items-center gap-4 rounded-card border-2 border-ink bg-paper px-6 py-6 text-center sm:flex-row sm:text-left">
      <p className="flex-1 font-display text-lg font-semibold">{t("footerText")}</p>
      <a href={PLAY_STORE_URL} className={buttonClass()}>{t("footerCta")}</a>
    </aside>
  );
}
