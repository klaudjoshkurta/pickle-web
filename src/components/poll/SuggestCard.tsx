"use client";

import { useId, useState } from "react";
import { useI18n } from "@/lib/i18n/LocaleContext";
import type { MessageKey } from "@/lib/i18n/translations";
import { isDuplicateOption, normalizeOptionText } from "@/lib/pollLogic";
import type { PollOption } from "@/lib/types";
import { PlusIcon } from "../icons";
import { Button } from "../ui/Button";

/** Speech-bubble card (notch on top) for suggesting a new option. */
export function SuggestCard({
  existing,
  requireApproval,
  avatarUrl,
  onSubmit,
}: {
  existing: PollOption[];
  requireApproval: boolean;
  avatarUrl: string | null;
  /** Returns an error key, or null on success. */
  onSubmit: (text: string) => Promise<MessageKey | null>;
}) {
  const { t } = useI18n();
  const [text, setText] = useState("");
  const [error, setError] = useState<MessageKey | null>(null);
  const [busy, setBusy] = useState(false);
  const titleId = useId();
  const inputId = useId();
  const errorId = useId();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = normalizeOptionText(text);
    if (!value) return setError("suggestEmpty");
    if (isDuplicateOption(value, existing)) return setError("suggestDuplicate");
    setBusy(true);
    setError(null);
    const err = await onSubmit(value);
    setBusy(false);
    if (err) setError(err);
    else setText("");
  }

  return (
    <section aria-labelledby={titleId} className="relative pt-2">
      <span aria-hidden className="absolute top-0.5 left-10 z-10 h-4 w-4 rotate-45 border-t-2 border-l-2 border-ink bg-paper" />
      <form onSubmit={submit} noValidate className="card flex gap-4 p-5 sm:p-6">
        <span aria-hidden className="hidden h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-ink bg-mustard sm:block">
          {avatarUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- remote SVG avatar
            <img src={avatarUrl} alt="" width={48} height={48} className="h-full w-full" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="font-display text-lg font-bold">
            {t("suggestTitle")}
          </h2>
          <p className="text-sm text-ink-muted">{t(requireApproval ? "suggestBodyApproval" : "suggestBodyDirect")}</p>
          <label htmlFor={inputId} className="sr-only">
            {t("suggestLabel")}
          </label>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              id={inputId}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (error) setError(null);
              }}
              placeholder={t("suggestPlaceholder")}
              maxLength={120}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
              className="field min-w-0 flex-1"
            />
            <Button type="submit" disabled={busy} className="shrink-0">
              <PlusIcon size={18} /> {t("suggestSubmit")}
            </Button>
          </div>
          {error && (
            <p id={errorId} role="alert" className="mt-2 text-sm font-semibold text-danger">
              {t(error)}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}

export function PendingList({ options }: { options: PollOption[] }) {
  const { t } = useI18n();
  if (options.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2">
      {options.map((o) => (
        <li key={o.id} className="flex min-h-14 items-center gap-3 rounded-card border-2 border-dashed border-ink/30 px-5 py-3">
          <span className="min-w-0 flex-1 font-semibold wrap-break-word text-ink-muted">{o.text}</span>
          <span className="pill shrink-0 bg-surface-variant py-1 text-xs text-ink">{t("waitingApproval")}</span>
        </li>
      ))}
    </ul>
  );
}
