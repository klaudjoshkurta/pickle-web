import type { Poll, PollOption } from "./types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string) {
  return UUID_RE.test(value);
}

/** Approved options for everyone, plus the current user's own pending suggestions. */
export function visibleOptions(options: PollOption[], userId: string | null): PollOption[] {
  return options.filter(
    (o) => o.status === "APPROVED" || (o.status === "PENDING" && userId != null && o.suggested_by === userId),
  );
}

export function totalVotes(options: PollOption[]): number {
  return options.reduce((sum, o) => (o.status === "APPROVED" ? sum + o.vote_count : sum), 0);
}

export function percentOf(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

export function canShowResults(poll: Poll, hasVoted: boolean): boolean {
  return poll.status === "CLOSED" || hasVoted || poll.show_results_before_voting;
}

export function normalizeOptionText(text: string) {
  return text.trim().replace(/\s+/g, " ");
}

export function isDuplicateOption(text: string, options: PollOption[]): boolean {
  const needle = normalizeOptionText(text).toLocaleLowerCase();
  return options.some((o) => normalizeOptionText(o.text).toLocaleLowerCase() === needle);
}

export type Outcome = { kind: "winner"; optionId: string } | { kind: "tie" } | { kind: "none" };

export function closedOutcome(poll: Poll, options: PollOption[]): Outcome {
  if (poll.status !== "CLOSED") return { kind: "none" };
  if (poll.winner_option_id) return { kind: "winner", optionId: poll.winner_option_id };
  return totalVotes(options) > 0 ? { kind: "tie" } : { kind: "none" };
}

export type VoteErrorKey = "errPollClosed" | "errOptionUnavailable" | "errVoteLocked" | "errGeneric";

export function mapVoteError(message: string | undefined | null): VoteErrorKey {
  const m = message ?? "";
  if (m.includes("Poll is not open")) return "errPollClosed";
  if (m.includes("Option not found or not approved")) return "errOptionUnavailable";
  if (m.includes("Vote change not allowed")) return "errVoteLocked";
  return "errGeneric";
}
