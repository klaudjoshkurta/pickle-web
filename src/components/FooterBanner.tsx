"use client";

import { PLAY_STORE_URL } from "@/lib/config";
import { useI18n } from "@/lib/i18n/LocaleContext";
import { buttonClass } from "./ui/Button";

export function FooterBanner() {
  const { t } = useI18n();
  return (
    <footer className="mx-auto w-full max-w-120 px-4 pt-6 pb-8">
      <div className="flex flex-col items-center gap-3 rounded-3xl bg-primary px-5 py-5 text-center text-on-primary shadow-soft">
        <p className="font-medium">{t("footerText")}</p>
        <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className={buttonClass("tonal", "min-h-11 bg-white hover:bg-cream")}>
          {t("footerCta")}
        </a>
      </div>
    </footer>
  );
}
