"use client";
import Link from "next/link";
import { useAuth } from "@/features/auth/AuthContext";
import { useI18n } from "@/lib/i18n/LocaleContext";
import { PLAY_STORE_URL } from "@/lib/config";
import { Wordmark } from "@/components/Logo";
import { buttonClass } from "@/components/ui/Button";

export function Header({ landing = false }: { landing?: boolean }) {
  const { t } = useI18n();
  const { profile, openProfile } = useAuth();
  return (
    <header className="flex w-full flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4 sm:px-6 sm:py-5 lg:px-10">
      <Link href="/" aria-label="Pickle" className="flex min-h-11 shrink-0 items-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-cream">
        <Wordmark className="h-8" />
      </Link>
      <div className="ml-auto flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <nav aria-label={t("mainNavigation")} className="order-last flex w-full items-center justify-end gap-1 sm:order-none sm:w-auto sm:gap-2 [&_a]:text-base">
          <Link href="/about" className={buttonClass("text")}>{t("navAbout")}</Link>
          <Link href="/blog" className={buttonClass("text")}>{t("navBlog")}</Link>
          <Link href="/changelog" className={buttonClass("text")}>{t("navChangelog")}</Link>
        </nav>
        <a href={PLAY_STORE_URL} aria-label={t("footerCta")} className={buttonClass("primary", "px-4")}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 shrink-0"><path d="M4 3.5a1 1 0 0 1 1.5-.86l14.4 8.5a1 1 0 0 1 0 1.72L5.5 21.36A1 1 0 0 1 4 20.5z" /></svg>
          Google Play
        </a>
        {!landing && profile.avatarUrl && (
          <button type="button" onClick={openProfile} aria-label={t("editProfile")} title={profile.displayName ?? undefined} className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-ink bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-cream">
            {/* eslint-disable-next-line @next/next/no-img-element -- remote SVG avatar */}
            <img src={profile.avatarUrl} alt="" width={44} height={44} className="h-full w-full" />
          </button>
        )}
      </div>
    </header>
  );
}
