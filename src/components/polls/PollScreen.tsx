/* eslint-disable @next/next/no-img-element -- remote SVG profile avatars */
"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { useI18n } from "@/components/providers/LocaleContext";
import type { MessageKey } from "@/lib/i18n/translations";
import { castBallot, suggestOption } from "@/features/polls/api/pollApi";
import { canShowResults, isPollOpen, mapVoteError, percentOf, sameBallot, standing, totalVotes, visibleOptions, voterCount } from "@/domain/polls/pollLogic";
import type { PollBundle } from "@/domain/polls/types";
import { usePoll } from "@/features/polls/hooks/usePoll";
import { Button, buttonClass } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { LeaderCard } from "./LeaderCard";
import { PollSkeleton } from "./PollSkeleton";
import { ResultRows, type ResultRowData } from "./ResultRows";
import { ResultsFooter } from "./ResultsFooter";
import { ShareBar } from "./ShareBar";
import { StatusPills } from "./StatusPills";
import { PendingList, SuggestCard } from "./SuggestCard";
import { VoteList } from "./VoteList";

export function PollScreen({ pollId }: { pollId: string }) {
  const { t } = useI18n();
  const auth = useAuth();
  const { state, refetch, retry } = usePoll(pollId, auth.ready, auth.user?.id ?? null);
  const { ensureSession } = auth;
  useEffect(ensureSession, [ensureSession]);
  if (auth.error) return <ErrorState onRetry={auth.retry} />;
  if (!auth.ready || state.kind === "loading") return <PollSkeleton label={t("loading")} />;
  if (state.kind === "notFound") return <Unavailable />;
  if (state.kind === "error") return <ErrorState onRetry={retry} />;
  if (state.data.options.filter((o) => o.status === "APPROVED").length < 2) return <Unavailable />;
  return <PollView key={pollId + ":" + auth.user?.id} data={state.data} refetch={refetch} />;
}
function PollView({ data, refetch }: { data: PollBundle; refetch: () => Promise<boolean> }) {
  const { t } = useI18n();
  const { user, profile, requireProfile } = useAuth();
  const toast = useToast();
  const questionId = useId();
  const actionsRef = useRef<HTMLDivElement>(null);
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const { poll, options } = data;
  const [picked, setPicked] = useState<string[] | null>(null);
  const [changing, setChanging] = useState(false);
  const [voting, setVoting] = useState(false);
  const [committed, setCommitted] = useState<string[] | null>(null);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const isOpen = isPollOpen(poll, now);
  const multiple = poll.voting_mode === "MULTIPLE";
  const saved = committed ?? data.myVoteOptionIds;
  const hasVoted = saved.length > 0;
  const isVoting = isOpen && (!hasVoted || (changing && poll.allow_vote_change));
  useEffect(() => {
    const bar = actionsRef.current;
    const root = bar?.closest<HTMLElement>(".poll-theme");
    if (!bar || !root) return;
    const measure = () => root.style.setProperty("--poll-actions-height", (bar.getBoundingClientRect().height + 24) + "px");
    const observer = new ResizeObserver(measure); observer.observe(bar); measure();
    return () => { observer.disconnect(); root.style.removeProperty("--poll-actions-height"); };
  }, [isVoting]);
  const visible = visibleOptions(options, user?.id ?? null);
  const approved = visible.filter((o) => o.status === "APPROVED");
  const pending = visible.filter((o) => o.status === "PENDING");
  const selected = (picked ?? saved).filter((id) => approved.some((o) => o.id === id));
  const showResults = canShowResults(poll, hasVoted);
  const total = voterCount(poll, approved);
  const top = standing(poll, approved);
  const leaders = top.kind === "leader" ? [top.option] : top.kind === "tie" ? top.options : [];
  const toRow = (o: (typeof approved)[number]): ResultRowData => ({
    id: o.id, text: o.text, count: o.vote_count, percent: percentOf(o.vote_count, total),
    isMine: saved.includes(o.id), suggestedByYou: user != null && o.suggested_by === user.id,
    isSuggested: o.suggested_by != null,
  });
  const rows = [...approved].sort((a, b) => b.vote_count - a.vote_count).filter((o) => !leaders.includes(o)).map(toRow);
  async function refresh() {
    const ok = await refetch();
    setRefreshFailed(!ok);
    if (ok) setCommitted(null);
    return ok;
  }
  async function vote() {
    if (!isOpen || voting || !selected.length || sameBallot(selected, saved) || refreshFailed) return;
    const ballot = [...selected];
    setVoting(true);
    try {
      if (!(await requireProfile()) || !active.current) return;
      await castBallot(poll.id, ballot);
      setCommitted(ballot); setChanging(false); setPicked(null);
      toast(t("voteThanks"));
      await refresh();
    } catch (err) { toast(t(mapVoteError((err as { message?: string })?.message))); }
    finally { setVoting(false); }
  }
  async function suggest(text: string): Promise<MessageKey | null> {
    if (!isOpen || refreshFailed || !(await requireProfile()) || !active.current || !user) return "errGeneric";
    try { await suggestOption(poll, text, user.id); } catch { return "errGeneric"; }
    toast(t(poll.require_approval ? "suggestSentPending" : "suggestSentApproved"));
    await refresh();
    return null;
  }
  const selectedText = approved.find((o) => o.id === selected[0])?.text ?? "";
  const action = !selected.length ? t("pickAnOption") : multiple ?
    t(hasVoted ? "updateSelections" : "submitSelections", { n: selected.length }) :
    t(hasVoted ? "changeToOption" : "voteForOption", { option: selectedText });
  return <article className={"flex flex-col gap-4 " + (isVoting ? "poll-has-actions" : "")}>
    {refreshFailed && <div role="status" className="card flex flex-wrap items-center gap-3 p-4"><p className="flex-1">{t("savedRefreshFailed")}</p><Button variant="outline" onClick={refresh}>{t("refresh")}</Button></div>}
    {hasVoted && isOpen && !isVoting && <div className="submitted-banner flex flex-wrap items-center gap-3 rounded-2xl border-[1.5px] border-ink bg-mustard p-3 text-on-mustard">
      {profile.avatarUrl && <img src={profile.avatarUrl} alt="" width={36} height={36} className="rounded-full border border-ink" />}
      <div className="min-w-0 flex-1"><p className="font-bold">{t("youreIn", { name: profile.displayName ?? "" })}</p><p className="text-sm wrap-break-word">{approved.filter((o) => saved.includes(o.id)).map((o) => o.text).join(", ")}</p></div>
      {poll.allow_vote_change && <Button variant="outline" disabled={refreshFailed} onClick={() => setChanging(true)}>{t("changeMyVote")}</Button>}
      {!poll.allow_vote_change && <p className="text-sm">{t("voteLocked")}</p>}
    </div>}
    <header className="flex flex-col gap-3"><StatusPills poll={poll} showCreated={false} /><h1 id={questionId} className="headline-pop text-[28px] leading-8 wrap-break-word">{poll.question}</h1></header>
    {isVoting && <section className="flex flex-col gap-3">
      <div className="flex flex-wrap justify-between gap-2 text-sm text-ink-muted"><span>{t(multiple ? "pickSeveral" : "pickOne")}</span>{!showResults && <span>{t("resultsHidden")}</span>}</div>
      <VoteList labelledBy={questionId} options={approved} selectedIds={selected} multiple={multiple} disabled={voting} onSelect={(id) => setPicked(multiple ? selected.includes(id) ? selected.filter((v) => v !== id) : [...selected, id] : [id])} />
      <div ref={actionsRef} className="poll-vote-actions flex flex-col gap-2">
        <Button className="w-full" onClick={vote} disabled={voting || refreshFailed || !selected.length || sameBallot(selected, saved)}>{voting ? t("voting") : action}</Button>
        {changing && <Button variant="text" disabled={voting} onClick={() => { setChanging(false); setPicked(null); }}>{t("keepVote")}</Button>}
      </div>
    </section>}
    {showResults && (!isVoting || total > 0) && <section className="flex flex-col gap-3">
      {total === 0 ? <div className="card p-6 text-center"><p className="font-bold">{t("noVotesTitle")}</p><p className="mt-2 text-sm text-ink-muted">{t(isOpen ? "noVotesYet" : "noVotesClosed")}</p></div> : <>
        {!isOpen && <p className="text-sm font-semibold text-ink-muted">{t(top.kind === "tie" ? "deadHeat" : "crewPicked")}</p>}
        {leaders.length > 0 && <LeaderCard text={leaders.map((o) => o.text).join(" · ")} count={leaders[0].vote_count} multiple={multiple} total={total} percent={percentOf(leaders[0].vote_count, total)} margin={top.kind === "leader" ? top.margin : 0} ribbon={top.kind === "tie" ? "tie" : isOpen ? "lead" : "winner"} isMine={leaders.some((o) => saved.includes(o.id))} />}
        <ResultRows rows={rows} avatarUrl={profile.avatarUrl} />
        <ResultsFooter total={total} selections={multiple ? totalVotes(approved) : undefined} standing={top} live={isOpen} />
      </>}
      {poll.expected_voters != null && poll.expected_voters > 0 && <div className="text-sm text-ink-muted"><p>{t("votedOfExpected", { x: total, n: poll.expected_voters })}</p><progress aria-label={t("turnout")} value={Math.min(total, poll.expected_voters)} max={poll.expected_voters} className="mt-2 h-2 w-full accent-primary" /></div>}
    </section>}
    <PendingList options={pending} />
    {isOpen && poll.allow_suggestions && <SuggestCard existing={options.filter((o) => o.status !== "REJECTED")} requireApproval={poll.require_approval} avatarUrl={profile.avatarUrl} onSubmit={suggest} disabled={refreshFailed} />}
    <ShareBar pollId={poll.id} question={poll.question} closed={!isOpen} />
  </article>;
}
function Unavailable() {
  const { t } = useI18n();
  return <div className="card p-8 text-center"><h1 className="headline-pop text-3xl">{t("notFoundTitle")}</h1><p className="mt-2 text-ink-muted">{t("notFoundBody")}</p><Link href="/" className={buttonClass("primary", "mt-6")}>{t("goHome")}</Link></div>;
}
function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();
  return <div role="alert" className="card p-8 text-center"><h1 className="headline-pop text-3xl">{t("errorTitle")}</h1><p className="mt-2 text-ink-muted">{t("errorBody")}</p><Button className="mt-6" onClick={onRetry}>{t("retry")}</Button></div>;
}
