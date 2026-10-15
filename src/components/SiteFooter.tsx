"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/LocaleContext";
import { LOCALES } from "@/lib/i18n/translations";
import { PLAY_STORE_URL } from "@/lib/config";
import { Wordmark } from "./Logo";
import { buttonClass } from "./ui/Button";

const footerLinkClass = "inline-flex min-h-11 items-center rounded text-base text-ink-muted transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-paper";

export function SiteFooter() {
  const { locale, setLocale, t } = useI18n();
  const pathname = usePathname();
  if (pathname.startsWith("/p/")) return <footer className="mx-auto mt-auto flex w-full max-w-180 flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-ink-muted"><span>Pickle</span><div role="group" aria-label={t("languageLabel")}>{LOCALES.map((l) => <button key={l} onClick={() => setLocale(l)} aria-pressed={locale === l} className="min-h-11 min-w-11 rounded-full px-3 font-bold aria-pressed:bg-primary-soft aria-pressed:text-primary focus-visible:outline-2 focus-visible:outline-primary">{l.toUpperCase()}</button>)}</div></footer>;
  return (
    <footer className="mt-auto w-full bg-surface">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_auto] md:gap-16">
          <div className="flex flex-col items-start">
            <Link href="/" aria-label="Pickle" className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-paper">
              <Wordmark className="h-8" />
            </Link>
            <p className="mt-4 max-w-xs text-base leading-relaxed text-ink-muted">{t("footerDescription")}</p>
            <a href={PLAY_STORE_URL} className={buttonClass("outline", "mt-5")}>
              {t("footerCta")}
              <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className="grid grid-cols-2 gap-6 sm:gap-16">
            <nav aria-labelledby="footer-explore">
              <h2 id="footer-explore" className="mb-2 text-sm font-bold tracking-wide text-ink">{t("footerExplore")}</h2>
              <ul>
                <li><Link href="/about" className={footerLinkClass}>{t("navAbout")}</Link></li>
                <li><Link href="/blog" className={footerLinkClass}>{t("navBlog")}</Link></li>
                <li><Link href="/changelog" className={footerLinkClass}>{t("navChangelog")}</Link></li>
              </ul>
            </nav>
            <nav aria-labelledby="footer-legal">
              <h2 id="footer-legal" className="mb-2 text-sm font-bold tracking-wide text-ink">{t("footerLegal")}</h2>
              <ul>
                <li><Link href="/terms" className={footerLinkClass}>{t("navTerms")}</Link></li>
                <li><Link href="/privacy" className={footerLinkClass}>{t("navPrivacy")}</Link></li>
                <li><Link href="/cookies" className={footerLinkClass}>{t("navCookies")}</Link></li>
              </ul>
            </nav>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-start justify-between gap-5 border-t border-ink/15 pt-6 sm:flex-row sm:items-center">
          <p className="text-sm text-ink-muted">{t("footerMadeWith")}</p>
          <div role="group" aria-label={t("languageLabel")} className="flex shrink-0 rounded-full bg-surface-variant p-1 text-sm font-semibold">
            {LOCALES.map((language) => (
              <button key={language} type="button" lang={language} aria-pressed={locale === language} onClick={() => setLocale(language)}
                className={`min-h-11 min-w-11 rounded-full px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${locale === language ? "bg-paper text-ink" : "text-ink-muted hover:text-ink"}`}>
                {language.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
