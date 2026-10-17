"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { useI18n } from "@/components/providers/LocaleContext";
import { PLAY_STORE_URL } from "@/lib/config";
import { Wordmark } from "@/components/Logo";
import { buttonClass } from "@/components/ui/Button";

export function Header({ landing = false }: { landing?: boolean }) {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const headerRef = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const { profile, openProfile } = useAuth();

  useEffect(() => {
    if (!menuOpen) return;
    function dismissOutside(event: Event) {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("focusin", dismissOutside);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("focusin", dismissOutside);
    };
  }, [menuOpen]);
  return (
    <header ref={headerRef} onKeyDown={(event) => {
      if (event.key === "Escape" && menuOpen) {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    }} className="relative z-30 flex w-full flex-wrap items-center gap-x-3 gap-y-2 px-4 py-4 sm:px-6 sm:py-5 lg:px-10">
      <Link href="/" aria-label="Pickle" className="flex min-h-11 shrink-0 items-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-cream">
        <Wordmark className="h-7 w-auto sm:h-8" />
      </Link>
      <nav id={menuId} aria-label={t("mainNavigation")} onClick={() => setMenuOpen(false)} className={`${menuOpen ? "flex" : "hidden"} absolute top-full right-4 left-4 z-40 min-w-0 flex-col items-stretch gap-1 rounded-2xl border border-ink/10 bg-white p-3 text-ink shadow-xl sm:right-6 sm:left-auto sm:w-80 lg:static lg:ml-auto lg:flex lg:w-auto lg:flex-row lg:items-center lg:justify-end lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none [&_a]:px-3 [&_a]:text-base`}>
        <Link href="/about" className={buttonClass("text")}>{t("navAbout")}</Link>
        <Link href="/blog" className={buttonClass("text")}>{t("navBlog")}</Link>
        <Link href="/changelog" className={buttonClass("text")}>{t("navChangelog")}</Link>
        <a href={PLAY_STORE_URL} className={buttonClass("primary", "mt-2 lg:hidden")}>{t("getTheApp")}</a>
      </nav>
      <div className="ml-auto flex shrink-0 items-center justify-end gap-2 lg:ml-0 lg:gap-3">
        <a href={PLAY_STORE_URL} aria-label={t("footerCta")} className={buttonClass("primary", "hidden px-4 lg:inline-flex")}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 shrink-0"><path d="M4 3.5a1 1 0 0 1 1.5-.86l14.4 8.5a1 1 0 0 1 0 1.72L5.5 21.36A1 1 0 0 1 4 20.5z" /></svg>
          Google Play
        </a>
        {!landing && profile.avatarUrl && (
          <button type="button" onClick={openProfile} aria-label={t("editProfile")} title={profile.displayName ?? undefined} className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-ink bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-cream">
            {/* eslint-disable-next-line @next/next/no-img-element -- remote SVG avatar */}
            <img src={profile.avatarUrl} alt="" width={44} height={44} className="h-full w-full" />
          </button>
        )}
        <button ref={menuButton} type="button" aria-label={t(menuOpen ? "closeMenu" : "openMenu")} aria-expanded={menuOpen} aria-controls={menuId} onClick={() => setMenuOpen((open) => !open)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-ink text-ink hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-cream lg:hidden">
          <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d={menuOpen ? "M6 6l12 12M6 18L18 6" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>
    </header>
  );
}
