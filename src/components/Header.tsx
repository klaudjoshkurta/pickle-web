"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { useI18n } from "@/lib/i18n/LocaleContext";
import { Wordmark } from "./Logo";
import { buttonClass } from "./ui/Button";

export function Header({ landing = false }: { landing?: boolean }) {
  const { t } = useI18n();
  const { profile, openProfile } = useAuth();
  return (
    <header className="flex w-full items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5 lg:px-10">
      <Link href="/" aria-label="Pickle" className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-cream">
        <Wordmark />
      </Link>
      <div className="flex items-center gap-2 sm:gap-3">
        <Link href="/dashboard" className={buttonClass("text", "px-2 text-sm")}>{t("dashboard")}</Link>
        {!landing && profile.avatarUrl && (
          <button type="button" onClick={openProfile} aria-label={t("editProfile")} title={profile.displayName ?? undefined} className="h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-ink bg-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-cream">
            {/* eslint-disable-next-line @next/next/no-img-element -- remote SVG avatar */}
            <img src={profile.avatarUrl} alt="" width={44} height={44} className="h-full w-full" />
          </button>
        )}
      </div>
    </header>
  );
}
