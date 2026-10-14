"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { createPoll, creatorErrorKey } from "@/lib/creatorApi";
import { cleanOptions, DEADLINES, DRAFT_KEY, emptyDraft, isValidPollInput, restoreDraft, sanitizeExpectedVoters, validateDraft, type PollDraft } from "@/lib/creatorLogic";
import { useI18n } from "@/lib/i18n/LocaleContext";
import type { MessageKey } from "@/lib/i18n/translations";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button, buttonClass } from "../ui/Button";

const subscribe = () => () => {};
export function CreatePollScreen() {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const { t } = useI18n();
  return mounted ? <CreateForm /> : <p role="status">{t("loading")}</p>;
}
function CreateForm() {
  const { t } = useI18n();
  const router = useRouter();
  const { user } = useAuth();
  const storageKey = `${DRAFT_KEY}:${user!.id}`;
  const [initial] = useState(() => {
    try { return { draft: restoreDraft(localStorage.getItem(storageKey)), storageFailed: false }; }
    catch { return { draft: emptyDraft(), storageFailed: true }; }
  });
  const [draft, setDraft] = useState<PollDraft>(initial.draft);
  const [storageFailed, setStorageFailed] = useState(initial.storageFailed);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);
  const locked = useRef(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);
  function save(next: PollDraft) {
    setDraft(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { setStorageFailed(true); }
  }
  function update(patch: Partial<PollDraft>) {
    // An ambiguous network failure must be retried with the same payload/key.
    if (locked.current || draft.requestId) return;
    save({ ...draft, ...patch, requestId: "" });
    setError(null);
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (locked.current) return;
    const invalid = validateDraft(draft);
    if (invalid) { setError(invalid); document.getElementById(invalid === "questionRequired" ? "question" : invalid === "expectedInvalid" ? "expected" : "option-0")?.focus(); return; }
    locked.current = true; setBusy(true); setError(null);
    const payload = { ...draft, requestId: draft.requestId || crypto.randomUUID() };
    save(payload);
    try {
      const pollId = await createPoll(payload);
      if (!alive.current) return;
      try { localStorage.removeItem(storageKey); } catch { /* Creation already succeeded. */ }
      router.replace(`/manage/${pollId}`);
    } catch (err) {
      if (!alive.current) return;
      // A structured database rejection means the transaction did not commit.
      if ((err as { code?: string }).code) save({ ...payload, requestId: "" });
      setError(creatorErrorKey(err));
      locked.current = false; setBusy(false);
    }
  }
  const deadlineKeys: MessageKey[] = ["deadlineNone", "deadlineHour", "deadlineDay", "deadlineThreeDays", "deadlineWeek"];
  const frozen = busy || !!draft.requestId;
  const filledOptions = cleanOptions(draft.options).length;
  const switches = [
    ["allowSuggestions", "votersSuggest", "suggestionsDescription"],
    ["requireApproval", "approveFirst", "approvalDescription"],
    ["showResults", "showEarlyResults", "earlyResultsDescription"],
    ["allowVoteChange", "allowVoteChange", "voteChangeDescription"],
  ] as const;
  return (
    <form onSubmit={submit} noValidate className="mx-auto flex w-full max-w-2xl flex-col gap-6" aria-busy={busy}>
      <div className="flex items-center justify-between gap-4">
        <h1 className="headline-pop text-4xl">{t("newPoll")}</h1>
        <Link href="/dashboard" className={buttonClass("text")}>{t("cancel")}</Link>
      </div>
      <fieldset disabled={frozen} className="flex flex-col gap-4">
        <label htmlFor="question" className="font-semibold">{t("question")}</label>
        <textarea id="question" className="field min-h-24 rounded-2xl py-3" rows={2} placeholder={t("questionPlaceholder")} value={draft.question} onChange={(e) => update({ question: e.target.value })} required aria-invalid={error === "questionRequired"} aria-describedby={error === "questionRequired" ? "create-error" : undefined} />
        <div className="mt-2 flex items-center justify-between">
          <h2 className="font-semibold">{t("options")}</h2>
          <span className="text-sm text-ink-muted" aria-live="polite">{t("filledOptions", { n: filledOptions, max: 10 })}</span>
        </div>
        {draft.options.map((value, i) => (
          <div key={i} className="flex items-center gap-2">
            <label htmlFor={`option-${i}`} className="sr-only">{t("optionLabel", { n: i + 1 })}</label>
            <input id={`option-${i}`} className="field min-w-0 flex-1" placeholder={t("optionLabel", { n: i + 1 })} value={value} onChange={(e) => update({ options: draft.options.map((s, n) => n === i ? e.target.value : s) })} aria-invalid={error === "optionsRequired"} aria-describedby="options-hint" />
            {draft.options.length > 2 && <Button variant="text" aria-label={t("removeOption", { n: i + 1 })} onClick={() => update({ options: draft.options.filter((_, n) => n !== i) })}>×</Button>}
          </div>
        ))}
        <Button variant="outline" className="border-dashed text-primary" disabled={draft.options.length >= 10} onClick={() => update({ options: [...draft.options, ""] })}>+ {t("addOption")}</Button>
        <p id="options-hint" className="text-sm text-ink-muted">{t("optionsHint")}</p>
      </fieldset>
      <fieldset disabled={frozen}>
        <legend className="mb-3 font-semibold">{t("whenVotingCloses")}</legend>
        <div className="flex flex-wrap gap-2">
          {DEADLINES.map((n, i) => (
            <label key={n} className="cursor-pointer">
              <input type="radio" name="deadline" value={n} checked={draft.deadline === n} onChange={() => update({ deadline: n })} className="peer sr-only" />
              <span className="inline-flex min-h-11 items-center rounded-full border-2 border-ink bg-paper px-4 text-sm font-semibold peer-checked:bg-primary peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-50">{t(deadlineKeys[i])}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset disabled={frozen}>
        <legend className="mb-3 font-semibold">{t("howPeopleVote")}</legend>
        <div className="card divide-y divide-surface-variant overflow-hidden">
          {switches.filter(([key]) => key !== "requireApproval" || draft.allowSuggestions).map(([key, label, description]) => (
            <label key={key} className="flex min-h-20 cursor-pointer items-center justify-between gap-4 p-4">
              <span><span className="block font-semibold">{t(label)}</span><span id={`${key}-description`} className="mt-1 block text-sm text-ink-muted">{t(description)}</span></span>
              <input type="checkbox" role="switch" className="h-6 w-6 shrink-0 accent-primary" aria-describedby={`${key}-description`} checked={draft[key]} onChange={(e) => update({ [key]: e.target.checked })} />
            </label>
          ))}
          <div className="flex items-center justify-between gap-4 p-4">
            <div><label htmlFor="expected" className="font-semibold">{t("expectedVoters")}</label><p id="expected-hint" className="mt-1 text-sm text-ink-muted">{t("expectedDescription")}</p></div>
            <input id="expected" inputMode="numeric" maxLength={4} placeholder="–" className="field w-24 shrink-0 rounded-xl px-3 text-center" value={draft.expectedVoters} onChange={(e) => update({ expectedVoters: sanitizeExpectedVoters(e.target.value) })} aria-invalid={error === "expectedInvalid"} aria-describedby={error === "expectedInvalid" ? "create-error expected-hint" : "expected-hint"} />
          </div>
        </div>
      </fieldset>
      <p role="status" className="text-sm text-ink-muted">{t(storageFailed ? "draftUnavailable" : "draftHint")}</p>
      {error && <p id="create-error" role="alert" className="text-danger">{t(error)}</p>}
      {!busy && draft.requestId && <p role="status" className="text-sm text-ink-muted">{t("uncertainCreation")}</p>}
      <div className="sticky bottom-0 z-10 border-t border-surface-variant bg-cream py-3">
        <Button type="submit" className="w-full" disabled={busy || !isValidPollInput(draft)}>{t(busy ? "creating" : draft.requestId ? "retry" : "createGetLink")}</Button>
      </div>
    </form>
  );
}
