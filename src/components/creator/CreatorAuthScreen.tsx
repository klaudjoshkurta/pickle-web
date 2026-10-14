"use client";
import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { useI18n } from "@/lib/i18n/LocaleContext";
import { EmailSignIn } from "../auth/EmailSignIn";
import { Button } from "../ui/Button";

export function CreatorAuthScreen() {
  const auth = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const titleId = useId();
  const [guestRequested, setGuestRequested] = useState(false);
  useEffect(() => {
    if (auth.ready && (guestRequested || (auth.user && !auth.user.is_anonymous && !auth.user.user_metadata?.pickle_account_pending))) router.replace("/create");
  }, [auth.ready, auth.user, guestRequested, router]);
  function continueAsGuest() {
    setGuestRequested(true);
    auth.ensureSession();
    if (auth.error) auth.retry();
  }
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <h1 className="headline-pop text-4xl">{t("createPoll")}</h1>
      <section className="card p-6">
        <EmailSignIn key={`${auth.user?.id ?? "signed-out"}:${!!auth.user?.user_metadata?.pickle_account_pending}`} titleId={titleId} onBack={() => router.push("/")} onSignedIn={() => router.replace("/create")} />
      </section>
      <section className="card flex flex-col gap-4 p-6">
        <p className="text-sm text-ink-muted">{t("guestWarning")}</p>
        {guestRequested && auth.error && <p role="alert" className="text-danger">{t("sessionUnavailable")}</p>}
        <Button variant="outline" disabled={guestRequested && !auth.ready && !auth.error} onClick={continueAsGuest}>
          {t(guestRequested && !auth.ready && !auth.error ? "loading" : "continueAsGuest")}
        </Button>
      </section>
    </main>
  );
}
