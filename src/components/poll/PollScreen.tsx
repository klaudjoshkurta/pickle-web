"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useI18n } from "@/lib/i18n/LocaleContext";
import type { MessageKey } from "@/lib/i18n/translations";
import { castBallot, suggestOption } from "@/lib/pollApi";
import { canShowResults, mapVoteError, percentOf, standing, totalVotes, visibleOptions } from "@/lib/pollLogic";
import type { PollBundle } from "@/lib/types";
import { usePoll } from "@/lib/usePoll";
import { LockIcon } from "../icons";
import { Button, buttonClass } from "../ui/Button";
import { useToast } from "../ui/Toast";
import { LeaderCard, TieCard } from "./LeaderCard";
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
  if (state.kind === "notFound") return <NotFoundState />;
  if (state.kind === "error") return <ErrorState onRetry={retry} />;
  return <PollView data={state.data} refetch={refetch} />;
}

function PollView({ data, refetch }: { data: PollBundle; refetch: () => Promise<void> }) {
  const { t, tp } = useI18n();
  const { user, profile, requireProfile } = useAuth();
  const toast = useToast();
  const questionId = useId();
  const { poll, options, myVoteOptionIds } = data;
  const userId = user?.id ?? null;

  // null = "follow my saved vote"; set when the user taps a different option.
  const [picked, setPicked] = useState<string[] | null>(null);
  const [changing, setChanging] = useState(false);
  const [voting, setVoting] = useState(false);

  const isOpen = poll.status === "OPEN";
  const hasVoted = myVoteOptionIds.length > 0;
  const multiple = poll.voting_mode === "MULTIPLE";
  const submitting = useRef(false);
  const mode = isOpen && (!hasVoted || (changing && poll.allow_vote_change)) ? "vote" : "results";

  const visible = visibleOptions(options, userId);
  const approved = visible.filter((o) => o.status === "APPROVED");
  const pending = visible.filter((o) => o.status === "PENDING");
  const selectedIds = (picked ?? myVoteOptionIds).filter((id) => approved.some((o) => o.id === id));
  const sameBallot = selectedIds.length === myVoteOptionIds.length && selectedIds.every((id) => myVoteOptionIds.includes(id));
  function select(id: string) { setPicked(multiple ? selectedIds.includes(id) ? selectedIds.filter((value) => value !== id) : [...selectedIds,id] : [id]); }
  const showResults = canShowResults(poll, hasVoted);
  const selections = totalVotes(approved);
  const total = poll.voter_count ?? selections;
  const top = standing(poll, approved);

  async function vote() {
    if (!selectedIds.length || submitting.current) return;
    submitting.current = true;
    setVoting(true);
    try {
      if (!(await requireProfile())) return;
      await castBallot(poll.id, selectedIds);
      toast(t("voteThanks"));
      setChanging(false);
      setPicked(null);
      await refetch();
    } catch (err) {
      toast(t(mapVoteError((err as { message?: string })?.message)));
    } finally {
      submitting.current = false;
      setVoting(false);
    }
  }

  async function suggest(text: string): Promise<MessageKey | null> {
    if (!(await requireProfile()) || !user) return "errGeneric";
    try {
      await suggestOption(poll, text, user.id);
    } catch {
      return "errGeneric";
    }
    toast(t(poll.require_approval ? "suggestSentPending" : "suggestSentApproved"));
    await refetch();
    return null;
  }

  const toRow = (o: (typeof approved)[number]): ResultRowData => ({
    id: o.id,
    text: o.text,
    count: o.vote_count,
    percent: percentOf(o.vote_count, total),
    isMine: myVoteOptionIds.includes(o.id),
    suggestedByYou: userId != null && o.suggested_by === userId,
  });
  const byVotes = [...approved].sort((a, b) => b.vote_count - a.vote_count);
  const restRows = (top.kind === "leader" ? byVotes.filter((o) => o.id !== top.option.id) : byVotes).map(toRow);

  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-4">
        <StatusPills poll={poll} />
        <h1 id={questionId} className="headline-pop text-4xl leading-[1.08] wrap-break-word sm:text-5xl">
          {poll.question}
        </h1>
        <MetaLine
          text={
            !showResults
              ? t("resultsHidden")
              : hasVoted
                ? total > 1
                  ? tp("youAndOthers", total - 1)
                  : t("youVoted")
                : total > 0
                  ? tp(multiple ? "votersCount" : "votesSoFar", total)
                  : t("noVotesYet")
          }
          expected={showResults && poll.expected_voters ? t("votedOfExpected", { x: total, n: poll.expected_voters }) : null}
          avatarUrl={hasVoted ? profile.avatarUrl : null}
        />
      </header>

      {mode === "vote" ? (
        <section className="flex flex-col gap-4">
          <VoteList
            labelledBy={questionId}
            options={approved}
            selectedIds={selectedIds}
            multiple={multiple}
            myVoteIds={myVoteOptionIds}
            disabled={voting}
            showResults={showResults}
            total={total}
            userId={userId}
            onSelect={select}
          />
          <PendingList options={pending} />
          <div className="flex flex-col gap-2 sm:flex-row-reverse sm:items-center">
            <Button
              className="w-full sm:w-auto sm:min-w-48"
              onClick={vote}
              disabled={voting || !selectedIds.length || sameBallot}
              aria-describedby={!selectedIds.length ? `${questionId}-hint` : undefined}
            >
              {voting ? t("voting") : hasVoted ? t("changeVote") : t("vote")}
            </Button>
            {changing ? (
              <Button variant="text" onClick={() => (setChanging(false), setPicked(null))}>
                {t("keepVote")}
              </Button>
            ) : (
              !selectedIds.length && (
                <p id={`${questionId}-hint`} className="flex-1 text-sm text-ink-muted">
                  {t(multiple ? "selectOptions" : "selectAnOption")}
                </p>
              )
            )}
          </div>
        </section>
      ) : (
        <section className="flex flex-col gap-5">
          {top.kind === "leader" && (
            <LeaderCard
              text={top.option.text}
              count={top.option.vote_count}
              total={total}
              multiple={multiple}
              percent={percentOf(top.option.vote_count, total)}
              margin={top.margin}
              ribbon={top.final ? "winner" : "lead"}
              isMine={myVoteOptionIds.includes(top.option.id)}
              suggestedByYou={userId != null && top.option.suggested_by === userId}
              avatarUrl={profile.avatarUrl}
            />
          )}
          {top.kind === "tie" && <TieCard names={top.options.map((o) => o.text)} count={top.options[0].vote_count} />}
          <ResultRows rows={restRows} avatarUrl={profile.avatarUrl} barMaxCount={Math.max(0, ...approved.map((o) => o.vote_count))} />
          <ResultsFooter total={total} selections={multiple ? selections : undefined} standing={top} live={isOpen} />
          <PendingList options={pending} />
          {isOpen && hasVoted &&
            (poll.allow_vote_change ? (
              <Button variant="outline" className="self-start" onClick={() => setChanging(true)}>
                {t("changeMyVote")}
              </Button>
            ) : (
              <p className="flex items-center gap-2 self-start rounded-full bg-surface-variant px-4 py-2.5 text-sm font-semibold">
                <LockIcon size={16} /> {t("voteLocked")}
              </p>
            ))}
        </section>
      )}

      {isOpen && poll.allow_suggestions && (
        <SuggestCard
          existing={options.filter((o) => o.status !== "REJECTED")}
          requireApproval={poll.require_approval}
          avatarUrl={profile.avatarUrl}
          onSubmit={suggest}
        />
      )}

      <ShareBar pollId={poll.id} question={poll.question} closed={!isOpen} />
    </article>
  );
}

function MetaLine({ text, expected, avatarUrl }: { text: string; expected: string | null; avatarUrl: string | null }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-ink-muted" aria-live="polite">
      {avatarUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- remote SVG avatar
        <img src={avatarUrl} alt="" width={32} height={32} className="h-8 w-8 rounded-full border-2 border-ink bg-surface-variant" />
      )}
      <span className="font-semibold text-ink">{text}</span>
      {expected && (
        <>
          <span aria-hidden>·</span>
          <span>{expected}</span>
        </>
      )}
    </p>
  );
}

function NotFoundState() {
  const { t } = useI18n();
  return (
    <div className="card p-8 text-center">
      <p className="font-display text-6xl font-bold text-tomato" aria-hidden>
        ?
      </p>
      <h1 className="headline-pop mt-2 text-3xl">{t("notFoundTitle")}</h1>
      <p className="mt-2 text-ink-muted">{t("notFoundBody")}</p>
      <Link href="/" className={buttonClass("primary", "mt-6")}>
        {t("goHome")}
      </Link>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <div role="alert" className="card p-8 text-center">
      <h1 className="headline-pop text-3xl">{t("errorTitle")}</h1>
      <p className="mt-2 text-ink-muted">{t("errorBody")}</p>
      <Button className="mt-6" onClick={onRetry}>
        {t("retry")}
      </Button>
    </div>
  );
}
