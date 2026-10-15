"use client";

import { useId, useState } from "react";
import { useI18n } from "@/lib/i18n/LocaleContext";
import type { MessageKey } from "@/lib/i18n/translations";
import { isDuplicateOption, normalizeOptionText } from "@/lib/pollLogic";
import type { PollOption } from "@/lib/types";
import { PlusIcon } from "../icons";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";

/** Inline entry point with a phone sheet / desktop dialog for suggestions. */
export function SuggestCard({
  existing,
  requireApproval,
  avatarUrl,
  onSubmit,
  disabled = false,
}: {
  disabled?: boolean;
  existing: PollOption[];
  requireApproval: boolean;
  avatarUrl: string | null;
  /** Returns an error key, or null on success. */
  onSubmit: (text: string) => Promise<MessageKey | null>;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
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
    else { setText(""); setOpen(false); }
  }

  return (
    <section className="relative pt-2">
      <Button variant="outline" className="w-full border-dashed text-primary" disabled={disabled} onClick={() => setOpen(true)}><PlusIcon size={18} />{t("suggestTitle")}</Button>
      <Dialog open={open} onClose={() => { if (!busy) setOpen(false); }} labelledBy={titleId}>

      <form onSubmit={submit} noValidate className="flex gap-4">
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
      </Dialog>
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
