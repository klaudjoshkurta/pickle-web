"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { useI18n } from "@/lib/i18n/LocaleContext";
import { Wordmark } from "./Logo";
import { buttonClass } from "./ui/Button";
import { UserIcon } from "./icons";

export function Header({ landing = false, creator = false, closed = false, onAccount }: { landing?: boolean; creator?: boolean; closed?: boolean; onAccount?: () => void }) {
  const { t } = useI18n();
  const { profile, openProfile } = useAuth();
  return (
    <header className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-4 sm:px-6 sm:py-5 lg:px-[max(2.5rem,8.5vw)]">
      <div className="contents sm:flex sm:items-center sm:gap-10">
      <Link href="/" aria-label="Pickle" className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-cream">
        <Wordmark />
      </Link>
      {creator && <nav aria-label={t("dashboard")} className="order-last flex basis-full items-center gap-1 sm:order-none sm:basis-auto sm:gap-2">
        <Link href="/dashboard" aria-current={!closed ? "page" : undefined} className={buttonClass("text", `px-4 ${!closed ? "bg-surface-variant text-ink" : ""}`)}>{t("dashboard")}</Link>
        <Link href="/dashboard?status=CLOSED" aria-current={closed ? "page" : undefined} className={buttonClass("text", `px-4 ${closed ? "bg-surface-variant text-ink" : ""}`)}>{t("closedFilter")}</Link>
      </nav>}
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        {!creator && <Link href="/dashboard" className={buttonClass("text", "px-2 text-sm")}>{t("dashboard")}</Link>}
        {creator && <Link href="/create" className={buttonClass("outline")}><span aria-hidden className="text-xl leading-none">+</span>{t("newPoll")}</Link>}
        {!landing && (profile.avatarUrl || onAccount) && (
          <button type="button" onClick={onAccount ?? openProfile} aria-label={onAccount ? t("accountAction") : t("editProfile")} title={profile.displayName ?? undefined} className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-ink bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-cream">
            {/* eslint-disable-next-line @next/next/no-img-element -- remote SVG avatar */}
            {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" width={44} height={44} className="h-full w-full" /> : <UserIcon size={22} />}
          </button>
        )}
      </div>
    </header>
  );
}
