"use client";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useI18n } from "@/lib/i18n/LocaleContext";
import { Header } from "../Header";
import { EmailSignIn } from "../auth/EmailSignIn";
import { Button, buttonClass } from "../ui/Button";
import { Dialog } from "../ui/Dialog";

export function CreatorShell({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const { t } = useI18n();
  const [account, setAccount] = useState(false);
  const title = useId();
  const { ensureSession } = auth;
  useEffect(ensureSession, [ensureSession]);
  return <>
    <Header />
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 pt-4 pb-12 sm:px-6 sm:pt-8">
      <nav aria-label={t("dashboard")} className="flex flex-wrap gap-2">
        <Link href="/dashboard" className={buttonClass("outline")}>{t("dashboard")}</Link>
        <Link href="/create" className={buttonClass()}>{t("createPoll")}</Link>
        <Button variant="text" onClick={() => setAccount(true)}>{t("accountAction")}</Button>
      </nav>
      {auth.user?.is_anonymous && <p className="rounded-card border-2 border-ink bg-mustard p-4 text-sm font-medium">{t("guestWarning")}</p>}
      {auth.error || !auth.ready ? <div className="card p-6" role={auth.error ? "alert" : "status"}>
        <p>{t(auth.error ? "sessionUnavailable" : "loading")}</p>
        {auth.error && <Button onClick={auth.retry} className="mt-4">{t("retry")}</Button>}
      </div> : <div key={auth.user?.id}>{children}</div>}
    </main>
    <Dialog open={account} onClose={() => setAccount(false)} labelledBy={title}>
      <EmailSignIn titleId={title} onBack={() => setAccount(false)} onSignedIn={() => setAccount(false)} />
    </Dialog>
  </>;
}
