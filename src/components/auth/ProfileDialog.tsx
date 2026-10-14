"use client";

import { useId, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { dicebearUrl, randomSeeds } from "@/lib/avatars";
import { useI18n } from "@/lib/i18n/LocaleContext";
import { getSupabase } from "@/lib/supabase";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { EmailSignIn } from "./EmailSignIn";

export function ProfileDialog({ open, onDone }: { open: boolean; onDone: (ok: boolean) => void }) {
  const titleId = useId();
  return (
    <Dialog open={open} onClose={() => onDone(false)} labelledBy={titleId}>
      {/* Dialog only mounts children while open, so each opening starts at the profile step. */}
      <ProfileDialogBody titleId={titleId} onDone={onDone} />
    </Dialog>
  );
}

function ProfileDialogBody({ titleId, onDone }: { titleId: string; onDone: (ok: boolean) => void }) {
  const [step, setStep] = useState<"profile" | "email">("profile");
  return step === "profile" ? (
    <ProfileStep titleId={titleId} onDone={onDone} onEmail={() => setStep("email")} />
  ) : (
    <EmailSignIn
      titleId={titleId}
      onBack={() => setStep("profile")}
      onSignedIn={(hasName) => (hasName ? onDone(true) : setStep("profile"))}
    />
  );
}

function ProfileStep({
  titleId,
  onDone,
  onEmail,
}: {
  titleId: string;
  onDone: (ok: boolean) => void;
  onEmail: () => void;
}) {
  const { t } = useI18n();
  const { profile } = useAuth();
  const [name, setName] = useState(profile.displayName ?? "");
  const [seeds, setSeeds] = useState(() => randomSeeds(6));
  const [avatar, setAvatar] = useState(() => profile.avatarUrl ?? dicebearUrl(seeds[0]));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const nameId = useId();
  const errorId = useId();
  const avatarLabelId = useId();
  const avatarRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const urls = seeds.map(dicebearUrl);
  const selectedIndex = urls.indexOf(avatar);

  function shuffle() {
    const next = randomSeeds(6);
    setSeeds(next);
    setAvatar(dicebearUrl(next[0]));
  }

  function onAvatarKey(e: React.KeyboardEvent, i: number) {
    const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (i + delta + urls.length) % urls.length;
    setAvatar(urls[next]);
    avatarRefs.current[next]?.focus();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const displayName = name.trim();
    if (!displayName) {
      setError(t("displayNameRequired"));
      return;
    }
    setSaving(true);
    setError(null);
    const { error } = await getSupabase().auth.updateUser({ data: { display_name: displayName, avatar_url: avatar } });
    setSaving(false);
    if (error) {
      setError(t("errGeneric"));
      return;
    }
    onDone(true);
  }

  return (
    <form onSubmit={submit} noValidate>
      <h2 id={titleId} className="text-xl font-semibold">
        {t("profileTitle")}
      </h2>
      <p className="mt-1 text-sm text-ink-muted">{t("profileBody")}</p>

      <label htmlFor={nameId} className="mt-5 block text-sm font-medium">
        {t("displayName")}
      </label>
      <input
        id={nameId}
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={40}
        autoComplete="nickname"
        required
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className="field mt-1"
      />

      <div className="mt-5 flex items-center justify-between">
        <span id={avatarLabelId} className="text-sm font-medium">
          {t("avatarLabel")}
        </span>
        <Button variant="text" onClick={shuffle} aria-label={t("shuffleLabel")} className="min-h-10">
          <ShuffleIcon /> {t("shuffle")}
        </Button>
      </div>
      <div role="radiogroup" aria-labelledby={avatarLabelId} className="mt-2 grid grid-cols-6 gap-2">
        {urls.map((url, i) => {
          const checked = url === avatar;
          const focusable = checked || (selectedIndex === -1 && i === 0);
          return (
            <button
              key={url}
              ref={(el) => {
                avatarRefs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={t("avatarOption", { n: i + 1 })}
              tabIndex={focusable ? 0 : -1}
              onClick={() => setAvatar(url)}
              onKeyDown={(e) => onAvatarKey(e, i)}
              className={`aspect-square rounded-2xl bg-surface-variant p-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                checked ? "ring-2 ring-primary" : ""
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- remote SVG avatars */}
              <img src={url} alt="" width={48} height={48} className="h-full w-full" />
            </button>
          );
        })}
      </div>

      {error && (
        <p id={errorId} role="alert" className="mt-4 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? t("saving") : t("continue")}
        </Button>
        <Button variant="text" onClick={() => onDone(false)}>
          {t("cancel")}
        </Button>
      </div>

      <p className="mt-4 border-t border-surface-variant pt-4 text-center text-sm text-ink-muted">
        {t("haveAccount")}{" "}
        <button type="button" onClick={onEmail} className="link">
          {t("signInWithEmail")}
        </button>
      </p>
    </form>
  );
}

function ShuffleIcon() {
  return (
    <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
    </svg>
  );
}
