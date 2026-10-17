"use client";

import { useId, useState } from "react";
import { dicebearUrl, randomSeeds } from "@/lib/avatars";
import { useI18n } from "@/components/providers/LocaleContext";
import type { MessageKey } from "@/lib/i18n/translations";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/AuthContext";
import { Button } from "@/components/ui/Button";

export function EmailSignIn({
  titleId,
  onBack,
  onSignedIn,
}: {
  titleId: string;
  onBack: () => void;
  onSignedIn: (hasDisplayName: boolean) => void;
}) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signIn" | "signUp" | "finish">(() => user?.user_metadata?.pickle_account_pending ? "finish" : "signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ key: MessageKey; tone: "error" | "info" } | null>(null);
  const emailId = useId();
  const passwordId = useId();
  const nameId = useId();

  function emailRedirectTo() {
    const path = window.location.pathname;
    return `${window.location.origin}${/^\/p\/[^/]+\/?$/.test(path) ? path : "/"}`;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "signUp" && !name.trim()) {
      setMessage({ key: "displayNameRequired", tone: "error" });
      return;
    }
    setBusy(true);
    setMessage(null);

    if (mode === "finish") {
      try {
        const { data: current, error: currentError } = await getSupabase().auth.getUser();
        if (currentError || !current.user?.email_confirmed_at || current.user.is_anonymous) {
          setMessage({ key: "upgradeCheckEmail", tone: "info" });
          return;
        }
        const { error } = await getSupabase().auth.updateUser({ password, data: { pickle_account_pending: false } });
        if (error) throw error;
        onSignedIn(Boolean(current.user.user_metadata?.display_name));
      } catch { setMessage({ key: "upgradeFailed", tone: "error" }); }
      finally { setBusy(false); }
      return;
    }

    if (mode === "signUp" && user?.is_anonymous) {
      try {
        const { error } = await getSupabase().auth.updateUser({
          email: email.trim(),
          data: { display_name: name.trim(), avatar_url: user.user_metadata?.avatar_url ?? dicebearUrl(randomSeeds(1)[0]), pickle_account_pending: true },
        }, { emailRedirectTo: emailRedirectTo() });
        if (error) throw error;
        setMode("finish"); setPassword("");
        setMessage({ key: "upgradeCheckEmail", tone: "info" });
      } catch { setMessage({ key: "upgradeFailed", tone: "error" }); }
      finally { setBusy(false); }
      return;
    }

    if (mode === "signIn") {
      const { data, error } = await getSupabase().auth.signInWithPassword({ email: email.trim(), password });
      setBusy(false);
      if (error) {
        setMessage({ key: error.code === "invalid_credentials" ? "authInvalid" : "authGeneric", tone: "error" });
        return;
      }
      onSignedIn(Boolean(data.user?.user_metadata?.display_name));
      return;
    }

    const { data, error } = await getSupabase().auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: emailRedirectTo(), data: { display_name: name.trim(), avatar_url: dicebearUrl(randomSeeds(1)[0]) } },
    });
    setBusy(false);
    if (error) {
      setMessage({ key: "authGeneric", tone: "error" });
      return;
    }
    if (!data.session) {
      setMode("signIn");
      setMessage({ key: "authCheckEmail", tone: "info" });
      return;
    }
    onSignedIn(true);
  }

  return (
    <form onSubmit={submit}>
      <h2 id={titleId} className="text-xl font-semibold">
        {mode === "finish" ? t("finishAccount") : mode === "signIn" ? t("emailTitle") : t("emailSignUpTitle")}
      </h2>
      {user?.is_anonymous && mode === "signIn" && <p className="mt-3 text-sm text-ink-muted">{t("switchWarning")}</p>}
      {mode === "finish" && <p className="mt-3 text-sm text-ink-muted">{t("finishAccountHint")}</p>}

      {mode === "signUp" && (
        <>
          <label htmlFor={nameId} className="mt-5 block text-sm font-medium">
            {t("displayName")}
          </label>
          <input id={nameId} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoComplete="nickname" required className="field mt-1" />
        </>
      )}

      {mode !== "finish" && <><label htmlFor={emailId} className="mt-5 block text-sm font-medium">
        {t("email")}
      </label>
      <input id={emailId} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required className="field mt-1" /></>}

      <label htmlFor={passwordId} className="mt-4 block text-sm font-medium">
        {t("password")}
      </label>
      <input
        id={passwordId}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete={mode === "signIn" ? "current-password" : "new-password"}
        minLength={6}
        required
        className="field mt-1"
      />

      {message && (
        <p role={message.tone === "error" ? "alert" : "status"} className={`mt-4 text-sm font-medium ${message.tone === "error" ? "text-danger" : "text-primary"}`}>
          {t(message.key)}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-2">
        <Button type="submit" disabled={busy}>
          {busy ? t("saving") : mode === "finish" ? t("finishAccount") : mode === "signIn" ? t("signIn") : t("signUp")}
        </Button>
        <Button variant="text" onClick={onBack}>
          {t("back")}
        </Button>
      </div>

      <p className="mt-4 border-t border-surface-variant pt-4 text-center text-sm text-ink-muted">
        {mode === "signIn" ? (
          <>
            {t("noAccount")}{" "}
            <button type="button" className="link" onClick={() => (setMode("signUp"), setMessage(null))}>
              {t("createOne")}
            </button>
          </>
        ) : (
          <button type="button" className="link" onClick={() => (setMode("signIn"), setMessage(null))}>
            {t("haveAccountSignIn")}
          </button>
        )}
      </p>
    </form>
  );
}
