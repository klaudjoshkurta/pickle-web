"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useI18n } from "@/lib/i18n/LocaleContext";
import type { MessageKey } from "@/lib/i18n/translations";
import { castVote, suggestOption } from "@/lib/pollApi";
import { canShowResults, closedOutcome, mapVoteError, totalVotes, visibleOptions } from "@/lib/pollLogic";
import type { PollBundle } from "@/lib/types";
import { usePoll } from "@/lib/usePoll";
import { Button, buttonClass } from "../ui/Button";
import { useToast } from "../ui/Toast";
import { ClosedBanner } from "./ClosedBanner";
import { OptionList } from "./OptionList";
import { PollSkeleton } from "./PollSkeleton";
import { ResultsSummary } from "./ResultsSummary";
import { ShareButton } from "./ShareButton";
import { SuggestForm } from "./SuggestForm";

export function PollScreen({ pollId }: { pollId: string }) {
  const { t } = useI18n();
  const auth = useAuth();
  const { state, refetch, retry } = usePoll(pollId, auth.ready, auth.user?.id ?? null);

  if (auth.error) return <ErrorState onRetry={auth.retry} />;
  if (!auth.ready || state.kind === "loading") return <PollSkeleton label={t("loading")} />;
  if (state.kind === "notFound") return <NotFoundState />;
  if (state.kind === "error") return <ErrorState onRetry={retry} />;
  return <PollView data={state.data} refetch={refetch} />;
}

function PollView({ data, refetch }: { data: PollBundle; refetch: () => Promise<void> }) {
  const { t } = useI18n();
  const { user, requireProfile } = useAuth();
  const toast = useToast();
  const questionId = useId();
  const { poll, options, myVoteOptionId } = data;

  // null = "follow my saved vote"; set when the user taps a different option.
  const [picked, setPicked] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);

  const isOpen = poll.status === "OPEN";
  const hasVoted = myVoteOptionId != null;
  const canChange = isOpen && (!hasVoted || poll.allow_vote_change);
  const visible = visibleOptions(options, user?.id ?? null);
  const approved = visible.filter((o) => o.status === "APPROVED");
  const pending = visible.filter((o) => o.status === "PENDING");
  const selectedId = picked && approved.some((o) => o.id === picked) ? picked : myVoteOptionId;
  const showResults = canShowResults(poll, hasVoted);
  const total = totalVotes(options);
  const outcome = closedOutcome(poll, options);

  async function vote() {
    if (!selectedId || voting) return;
    if (!(await requireProfile())) return;
    setVoting(true);
    try {
      await castVote(poll.id, selectedId);
      toast(t("voteThanks"));
    } catch (err) {
      toast(t(mapVoteError((err as { message?: string })?.message)));
    }
    await refetch();
    setPicked(null);
    setVoting(false);
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

  return (
    <article className="card">
      <div className="flex items-start gap-3">
        <h1 id={questionId} className="min-w-0 flex-1 break-words text-2xl font-semibold leading-tight">
          {poll.question}
        </h1>
        <ShareButton pollId={poll.id} question={poll.question} />
      </div>

      {!isOpen && (
        <div className="mt-4">
          <ClosedBanner closedAt={poll.closed_at} outcome={outcome} />
        </div>
      )}

      <div className="mt-6">
        <OptionList
          labelledBy={questionId}
          approved={approved}
          pending={pending}
          selectedId={selectedId}
          myVoteId={myVoteOptionId}
          winnerId={outcome.kind === "winner" ? outcome.optionId : null}
          readOnly={!canChange || voting}
          showResults={showResults}
          total={total}
          onSelect={setPicked}
        />
      </div>

      <div className="mt-5">
        {showResults ? (
          <ResultsSummary total={total} expected={poll.expected_voters} />
        ) : (
          <p className="text-sm text-ink-muted">{t("resultsHidden")}</p>
        )}
      </div>

      {isOpen && (
        <div className="mt-5">
          {canChange ? (
            <>
              {hasVoted && <p className="mb-3 text-sm text-ink-muted">{t("voteCanChange")}</p>}
              <Button
                className="w-full"
                onClick={vote}
                disabled={voting || !selectedId || selectedId === myVoteOptionId}
                aria-describedby={!selectedId ? `${questionId}-hint` : undefined}
              >
                {voting ? t("voting") : hasVoted ? t("changeVote") : t("vote")}
              </Button>
              {!selectedId && (
                <p id={`${questionId}-hint`} className="mt-2 text-center text-sm text-ink-muted">
                  {t("selectAnOption")}
                </p>
              )}
            </>
          ) : (
            <p className="flex items-center gap-2 rounded-2xl bg-surface-variant px-4 py-3 text-sm font-medium">
              <LockIcon /> {t("voteLocked")}
            </p>
          )}
        </div>
      )}

      {isOpen && poll.allow_suggestions && (
        <SuggestForm existing={options.filter((o) => o.status !== "REJECTED")} onSubmit={suggest} />
      )}
    </article>
  );
}

function NotFoundState() {
  const { t } = useI18n();
  return (
    <div className="card text-center">
      <p className="text-5xl" aria-hidden>
        🥒
      </p>
      <h1 className="mt-3 text-xl font-semibold">{t("notFoundTitle")}</h1>
      <p className="mt-1 text-ink-muted">{t("notFoundBody")}</p>
      <Link href="/" className={buttonClass("primary", "mt-6")}>
        {t("goHome")}
      </Link>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <div role="alert" className="card text-center">
      <h1 className="text-xl font-semibold">{t("errorTitle")}</h1>
      <p className="mt-1 text-ink-muted">{t("errorBody")}</p>
      <Button className="mt-6" onClick={onRetry}>
        {t("retry")}
      </Button>
    </div>
  );
}

function LockIcon() {
  return (
    <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
