"use client";

import { useId, useState } from "react";
import { useI18n } from "@/lib/i18n/LocaleContext";
import type { MessageKey } from "@/lib/i18n/translations";
import { isDuplicateOption, normalizeOptionText } from "@/lib/pollLogic";
import type { PollOption } from "@/lib/types";
import { Button } from "../ui/Button";

export function SuggestForm({
  existing,
  onSubmit,
}: {
  existing: PollOption[];
  /** Returns an error key, or null on success. */
  onSubmit: (text: string) => Promise<MessageKey | null>;
}) {
  const { t } = useI18n();
  const [text, setText] = useState("");
  const [error, setError] = useState<MessageKey | null>(null);
  const [busy, setBusy] = useState(false);
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
    <form onSubmit={submit} noValidate className="mt-6">
      <label htmlFor={inputId} className="block text-sm font-medium">
        {t("suggestLabel")}
      </label>
      <div className="mt-1 flex gap-2">
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
        <Button type="submit" variant="tonal" disabled={busy} className="shrink-0 px-5">
          {t("suggestSubmit")}
        </Button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-sm font-medium text-danger">
          {t(error)}
        </p>
      )}
    </form>
  );
}
