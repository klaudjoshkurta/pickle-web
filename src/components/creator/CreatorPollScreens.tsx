"use client";
import Link from "next/link";
import { useId, useState } from "react";
import { useI18n } from "@/lib/i18n/LocaleContext";
import { useCreatorPolls } from "@/lib/useCreatorPolls";
import { closePoll, creatorErrorKey, moderateOption, type CreatorPoll } from "@/lib/creatorApi";
import type { MessageKey } from "@/lib/i18n/translations";
import { deadlinePassed } from "@/lib/creatorLogic";
import { percentOf, standing, totalVotes } from "@/lib/pollLogic";
import { pollShareUrl } from "@/lib/config";
import { Button, buttonClass } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { useToast } from "../ui/Toast";
import { LeaderCard, TieCard } from "../poll/LeaderCard";
import { ResultRows } from "../poll/ResultRows";
import { ResultsFooter } from "../poll/ResultsFooter";
import { StatusPills } from "../poll/StatusPills";
import { CopyIcon, SparkIcon } from "../icons";

function Sharing({ poll, endAction }: { poll: CreatorPoll; endAction?: React.ReactNode }) {
  const { t } = useI18n();
  const toast = useToast();
  const url = pollShareUrl(poll.id);
  async function copy() {
    try { await navigator.clipboard.writeText(url); toast(t("linkCopied")); } catch { toast(t("copyFailed")); }
  }
  async function share() {
    try { await navigator.share({ title: poll.question, url }); }
    catch (err) { if (!(err instanceof DOMException && err.name === "AbortError")) await copy(); }
  }
  return <div className="flex flex-col gap-3 rounded-[2rem] bg-surface-variant p-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 sm:pl-6">
    <p className="min-w-0 flex-1 text-xs leading-relaxed text-ink-muted">{t(poll.status === "OPEN" ? "shareLead" : "shareLeadClosed")} <a href={url} className="block break-all font-bold text-ink sm:inline">{url.replace(/^https?:\/\//, "")}</a></p>
    {endAction}
    <Button variant="dark" onClick={copy}><CopyIcon size={16} />{t("copyLink")}</Button>
    {typeof navigator !== "undefined" && typeof navigator.share === "function" && <Button variant="outline" onClick={share}>{t("share")}</Button>}
  </div>;
}
function PollDates({ poll }: { poll: CreatorPoll }) {
  const { t, locale } = useI18n();
  return <div className="flex flex-wrap gap-2 text-sm text-ink-muted">
    <span className={`pill ${poll.status === "OPEN" ? "bg-primary-soft text-primary-hover" : "bg-ink text-cream"}`}>{t(poll.status === "OPEN" ? "statusOpen" : "statusClosed")}</span>
    <time dateTime={poll.created_at}>{t("createdOn", { date: new Date(poll.created_at).toLocaleString(locale) })}</time>
    {poll.closed_at && <time dateTime={poll.closed_at}>{t(poll.status === "OPEN" ? "closesOn" : "endedOn", { date: new Date(poll.closed_at).toLocaleString(locale) })}</time>}
  </div>;
}
function LoadState({ error, refresh }: { error: string | null; refresh: () => void }) {
  const { t } = useI18n();
  return <div className="card p-6" role={error ? "alert" : "status"}>
    <p>{t(error === "missing" ? "notFoundTitle" : error === "unauthorized" ? "unauthorizedManagement" : error ? "creatorFailure" : "loading")}</p>
    {error === "error" && <Button onClick={refresh} className="mt-4">{t("retry")}</Button>}
  </div>;
}
function StaleNotice({ refresh }: { refresh: () => void }) {
  const { t } = useI18n();
  return <div role="alert" className="rounded-card border-2 border-danger p-4"><p>{t("staleResults")}</p><Button variant="text" onClick={refresh}>{t("retry")}</Button></div>;
}
export function DashboardScreen({ initialFilter = "OPEN" }: { initialFilter?: "OPEN" | "CLOSED" }) {
  const { t } = useI18n();
  const { data, error, refresh } = useCreatorPolls();
  const [filter, setFilter] = useState<"OPEN" | "CLOSED">(initialFilter);
  if (!data) return <LoadState error={error} refresh={refresh} />;
  const polls = data.filter((p) => p.status === filter);
  return <section className="flex flex-col gap-6">
    <h1 className="headline-pop text-4xl">{t("dashboard")}</h1>
    {error && <StaleNotice refresh={refresh} />}
    <div role="group" aria-label={t("dashboard")} className="flex gap-2">{(["OPEN", "CLOSED"] as const).map((s) => <Button key={s} variant={filter === s ? "primary" : "outline"} aria-pressed={filter === s} onClick={() => setFilter(s)}>{t(s === "OPEN" ? "openFilter" : "closedFilter")}</Button>)}</div>
    {!polls.length && <div className="card p-8"><p>{t(filter === "OPEN" ? "emptyOpen" : "emptyClosed")}</p><Link href="/create" className={buttonClass("primary", "mt-4")}>{t("createPoll")}</Link></div>}
    <div className="grid gap-6">{polls.map((poll) => <article key={poll.id} className="card flex flex-col gap-4 p-6 sm:p-7">
      <h2 className="font-display text-2xl font-bold wrap-break-word"><Link href={`/manage/${poll.id}`} className="rounded focus-visible:ring-2 focus-visible:ring-primary">{poll.question}</Link></h2>
      <PollDates poll={poll} />
      <p>{t("voteTotal", { n: totalVotes(poll.poll_options) })}</p>
      <Link href={`/manage/${poll.id}`} className={buttonClass("outline")}>{t("managePoll")}</Link>
      <Sharing poll={poll} />
    </article>)}</div>
  </section>;
}
export function ManagePollScreen({ pollId }: { pollId: string }) {
  const { data, error, refresh } = useCreatorPolls(pollId);
  if (!data) return <LoadState error={error} refresh={refresh} />;
  return <ManageView poll={data[0]} refresh={refresh} stale={!!error} />;
}
function ManageView({ poll, refresh, stale }: { poll: CreatorPoll; refresh: () => void; stale: boolean }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState<string | null>(null);
  const [failure, setFailure] = useState<MessageKey | null>(null);
  const [confirm, setConfirm] = useState(false);
  const title = useId();
  const approved = poll.poll_options.filter((o) => o.status === "APPROVED");
  const pending = poll.poll_options.filter((o) => o.status === "PENDING").sort((a, b) => a.created_at.localeCompare(b.created_at));
  const total = totalVotes(approved);
  const top = standing(poll, approved);
  const open = poll.status === "OPEN" && !deadlinePassed(poll);
  async function mutate(key: string, action: () => Promise<void>) {
    if (busy) return;
    setBusy(key); setFailure(null);
    try { await action(); setConfirm(false); } catch (err) { setFailure(creatorErrorKey(err)); }
    finally { refresh(); setBusy(null); }
  }
  return <article className="flex flex-col gap-7 sm:gap-8">
    <header className="flex flex-col gap-5">
    <StatusPills poll={poll} showCreated={false} />
    <h1 className="headline-pop text-4xl leading-[1.12] wrap-break-word sm:text-5xl">{poll.question}</h1>
    <p aria-live="polite" className="font-semibold">{t("voteTotal", { n: total })}{poll.expected_voters && <span className="ml-2 text-sm font-normal text-ink-muted">{t("turnout", { n: total, expected: poll.expected_voters, percent: Math.min(100, percentOf(total, poll.expected_voters)) })}</span>}</p>
    </header>
    {stale && <StaleNotice refresh={refresh} />}
    {top.kind === "leader" && <LeaderCard text={top.option.text} count={top.option.vote_count} total={total} percent={percentOf(top.option.vote_count, total)} margin={top.margin} ribbon={top.final ? "winner" : "lead"} />}
    {top.kind === "tie" && <TieCard names={top.options.map((o) => o.text)} count={top.options[0].vote_count} />}
    {top.kind === "empty" && <p className="card p-6" role="status">{t(poll.status === "CLOSED" ? "noFinalVotes" : "noLiveVotes")}</p>}
    <ResultRows barMaxCount={Math.max(0, ...approved.map((o) => o.vote_count))} rows={[...approved].filter((o) => top.kind !== "leader" || o.id !== top.option.id).sort((a, b) => b.vote_count - a.vote_count).map((o) => ({ id: o.id, text: o.text, count: o.vote_count, percent: percentOf(o.vote_count, total), isMine: false, isSuggested: o.suggested_by !== null }))} />
    <ResultsFooter total={total} standing={top} live={open} />
    {open && pending.length > 0 && <section className="suggestion-callout card relative flex flex-col gap-4 p-5 sm:p-6" aria-labelledby="suggestion-title">
      <h2 id="suggestion-title" className="sr-only">{t("pendingSuggestions")}</h2>
      {pending.map((o, i) => <div key={o.id} className={`flex flex-col gap-4 border-surface-variant sm:flex-row sm:items-center ${i > 0 ? "border-t pt-5" : ""}`}>
        <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-mustard"><SparkIcon size={22} /></span>
        <div className="min-w-0 flex-1"><p className="font-display text-lg font-semibold wrap-break-word">{t("suggestedIdea", { idea: o.text })}</p><p className="mt-1 text-sm leading-relaxed text-ink-muted">{t("approveIdeaHint")}</p></div>
        <div className="flex shrink-0 flex-wrap gap-2">
        <Button disabled={!!busy} onClick={() => void mutate(o.id, () => moderateOption(poll.id, o.id, true))}>{t("addIt")}</Button>
        <Button variant="text" disabled={!!busy} onClick={() => void mutate(o.id, () => moderateOption(poll.id, o.id, false))}>{t("notThisTime")}</Button>
      </div></div>)}
    </section>}
    {failure && <p role="alert" className="text-danger">{t(failure)}</p>}
    <div className="flex flex-col gap-3">
      <Sharing poll={poll} endAction={open ? <Button variant="outline" disabled={!!busy} onClick={() => setConfirm(true)}>{t("endPoll")}</Button> : undefined} />
      {open && <p className="px-6 text-xs leading-relaxed text-ink-muted">{t("endExplanation")}</p>}
    </div>
    <Dialog open={confirm} onClose={() => { if (!busy) setConfirm(false); }} labelledBy={title}>
      <h2 id={title} className="font-display text-2xl font-bold">{t("endConfirm")}</h2><p className="mt-3">{t("endExplanation")}</p>
      {failure && <p role="alert" className="mt-3 text-danger">{t(failure)}</p>}
      <div className="mt-5 flex flex-col gap-2"><Button disabled={!!busy} onClick={() => void mutate("close", () => closePoll(poll.id))}>{t(busy ? "saving" : "endPoll")}</Button><Button variant="outline" disabled={!!busy} onClick={() => setConfirm(false)}>{t("keepOpen")}</Button></div>
    </Dialog>
  </article>;
}
