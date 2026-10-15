/* eslint-disable @next/next/no-img-element -- remote SVG profile avatars */
"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { useCreatorCopy } from "@/lib/creator/copy";
import { useI18n } from "@/lib/i18n/LocaleContext";
import { CheckIcon } from "../icons";
export function PollHeader() {
  const {profile, openProfile} = useAuth();
  const {t} = useI18n();
  const c = useCreatorCopy();
  return <header className="mx-auto flex w-full flex-wrap max-w-180 items-center justify-between gap-4 px-4 py-5 sm:px-6">
    <Link href="/" aria-label="Pickle" className="flex items-center gap-2 rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
      <span className="flex h-7 w-7 items-center justify-center rounded-full border-[1.5px] border-ink bg-tomato text-on-primary"><CheckIcon size={18}/></span>
      <span className="text-2xl font-extrabold tracking-tight">pickle</span>
    </Link>
    <div className="flex items-center gap-3"><Link href="/app" className="link text-sm">{c("myPolls")}</Link><button type="button" aria-label={t("editProfile")} onClick={openProfile} className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-[1.5px] border-ink bg-primary-soft font-bold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
      {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" width={44} height={44}/> : <span>{profile.displayName?.slice(0,1).toUpperCase() || "?"}</span>}
    </button></div>
  </header>;
}
