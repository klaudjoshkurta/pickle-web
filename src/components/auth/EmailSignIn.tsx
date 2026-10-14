"use client";

import { useId, useState } from "react";
import { dicebearUrl, randomSeeds } from "@/lib/avatars";
import { useI18n } from "@/lib/i18n/LocaleContext";
import type { MessageKey } from "@/lib/i18n/translations";
import { getSupabase } from "@/lib/supabase";
import { Button } from "../ui/Button";

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
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ key: MessageKey; tone: "error" | "info" } | null>(null);
  const emailId = useId();
  const passwordId = useId();
  const nameId = useId();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "signUp" && !name.trim()) {
      setMessage({ key: "displayNameRequired", tone: "error" });
      return;
    }
    setBusy(true);
    setMessage(null);

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
      options: { data: { display_name: name.trim(), avatar_url: dicebearUrl(randomSeeds(1)[0]) } },
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
        {mode === "signIn" ? t("emailTitle") : t("emailSignUpTitle")}
      </h2>

      {mode === "signUp" && (
        <>
          <label htmlFor={nameId} className="mt-5 block text-sm font-medium">
            {t("displayName")}
          </label>
          <input id={nameId} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoComplete="nickname" required className="field mt-1" />
        </>
      )}

      <label htmlFor={emailId} className="mt-5 block text-sm font-medium">
        {t("email")}
      </label>
      <input id={emailId} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required className="field mt-1" />

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
          {busy ? t("saving") : mode === "signIn" ? t("signIn") : t("signUp")}
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
