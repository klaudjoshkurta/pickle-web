"use client";

import { PLAY_STORE_URL } from "@/lib/config";
import { useI18n } from "@/lib/i18n/LocaleContext";
import { Logo } from "./Logo";
import { buttonClass } from "./ui/Button";

export function Landing() {
  const { t } = useI18n();
  return (
    <section className="card mt-4 flex flex-col items-center text-center">
      <Logo size={72} />
      <h1 className="mt-5 text-3xl font-semibold leading-tight">{t("landingTitle")}</h1>
      <p className="mt-3 text-ink-muted">{t("landingBody")}</p>
      <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", "mt-6 w-full")}>
        {t("landingCta")}
      </a>
      <p className="mt-4 text-sm text-ink-muted">{t("landingHint")}</p>
    </section>
  );
}
