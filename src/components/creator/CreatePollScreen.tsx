"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { createPoll, creatorErrorKey } from "@/lib/creatorApi";
import { DEADLINES, DRAFT_KEY, emptyDraft, restoreDraft, validateDraft, type PollDraft } from "@/lib/creatorLogic";
import { useI18n } from "@/lib/i18n/LocaleContext";
import type { MessageKey } from "@/lib/i18n/translations";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "../ui/Button";

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
      router.push(`/manage/${pollId}`);
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
  return <form onSubmit={submit} noValidate className="flex flex-col gap-6" aria-busy={busy}>
    <h1 className="headline-pop text-4xl">{t("createPoll")}</h1>
    <fieldset disabled={frozen} className="card flex flex-col gap-4 p-5 sm:p-7">
      <label htmlFor="question" className="font-semibold">{t("question")}</label>
      <input id="question" className="field" value={draft.question} onChange={(e) => update({ question: e.target.value })} required aria-invalid={error === "questionRequired"} aria-describedby={error === "questionRequired" ? "create-error" : undefined} />
      <h2 className="font-semibold">{t("options")}</h2>
      {draft.options.map((value, i) => <div key={i} className="flex items-end gap-2">
        <div className="flex-1"><label htmlFor={`option-${i}`} className="mb-1 block text-sm">{t("optionLabel", { n: i + 1 })}</label>
          <input id={`option-${i}`} className="field" value={value} onChange={(e) => update({ options: draft.options.map((s, n) => n === i ? e.target.value : s) })} aria-invalid={error === "optionsRequired"} aria-describedby={error === "optionsRequired" ? "create-error" : undefined} /></div>
        <Button variant="text" disabled={draft.options.length <= 2} aria-label={t("removeOption", { n: i + 1 })} onClick={() => update({ options: draft.options.filter((_, n) => n !== i) })}>×</Button>
      </div>)}
      <Button variant="outline" disabled={draft.options.length >= 10} onClick={() => update({ options: [...draft.options, ""] })}>{t("addOption")}</Button>
    </fieldset>
    <fieldset disabled={frozen} className="card flex flex-col gap-4 p-5 sm:p-7">
      <legend className="px-2 font-semibold">{t("settings")}</legend>
      {([ ["allowSuggestions", "allowSuggestions"], ["requireApproval", "requireApproval"], ["showResults", "showEarlyResults"], ["allowVoteChange", "allowVoteChange"] ] as const).map(([key, label]) => <label key={key} className="flex min-h-11 items-center gap-3">
        <input type="checkbox" className="h-5 w-5 accent-primary" checked={draft[key]} disabled={key === "requireApproval" && !draft.allowSuggestions} onChange={(e) => update({ [key]: e.target.checked })} />{t(label)}
      </label>)}
      <label htmlFor="deadline" className="font-semibold">{t("deadline")}</label>
      <select id="deadline" className="field" value={draft.deadline} onChange={(e) => update({ deadline: Number(e.target.value) })}>{DEADLINES.map((n, i) => <option key={n} value={n}>{t(deadlineKeys[i])}</option>)}</select>
      <label htmlFor="expected" className="font-semibold">{t("expectedVoters")}</label>
      <input id="expected" inputMode="numeric" className="field" value={draft.expectedVoters} onChange={(e) => update({ expectedVoters: e.target.value })} aria-invalid={error === "expectedInvalid"} aria-describedby={error === "expectedInvalid" ? "create-error" : undefined} />
    </fieldset>
    <p role="status" className="text-sm text-ink-muted">{t(storageFailed ? "draftUnavailable" : "draftHint")}</p>
    {error && <p id="create-error" role="alert" className="text-danger">{t(error)}</p>}
    {!busy && draft.requestId && <p role="status" className="text-sm text-ink-muted">{t("uncertainCreation")}</p>}
    <Button type="submit" disabled={busy}>{t(busy ? "creating" : draft.requestId ? "retry" : "createPoll")}</Button>
  </form>;
}
