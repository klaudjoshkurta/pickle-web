"use client";
import { useEffect, useId, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useI18n } from "@/lib/i18n/LocaleContext";
import { Header } from "../Header";
import { EmailSignIn } from "../auth/EmailSignIn";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";

export function CreatorShell({ children, closed = false }: { children: React.ReactNode; closed?: boolean }) {
  const auth = useAuth();
  const { t } = useI18n();
  const [account, setAccount] = useState(false);
  const title = useId();
  const { ensureSession } = auth;
  useEffect(ensureSession, [ensureSession]);
  return <>
    <Header creator closed={closed} onAccount={() => setAccount(true)} />
    <main className="mx-auto flex w-full max-w-192 flex-1 flex-col gap-6 px-4 pt-8 pb-12 sm:px-6 sm:pt-10">
      {auth.user?.is_anonymous && <aside className="rounded-2xl border border-surface-variant bg-surface-variant/60 px-4 py-3"><p className="text-sm text-ink-muted">{t("guestWarning")}</p><Button variant="text" className="mt-1 -ml-3" onClick={() => setAccount(true)}>{t("accountAction")}</Button></aside>}
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
