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

export type VoteErrorKey = "errPollClosed" | "errOptionUnavailable" | "errVoteLocked" | "errGeneric";

export function mapVoteError(message: string | undefined | null): VoteErrorKey {
  const m = message ?? "";
  if (m.includes("Poll is not open")) return "errPollClosed";
  if (m.includes("Option not found or not approved")) return "errOptionUnavailable";
  if (m.includes("Vote change not allowed")) return "errVoteLocked";
  return "errGeneric";
}

export type Standing =
  | { kind: "empty" }
  /** One option has strictly the most votes (or was declared winner). */
  | { kind: "leader"; option: PollOption; margin: number; final: boolean }
  | { kind: "tie"; options: PollOption[]; final: boolean };

/** Who is on top: the declared winner for closed polls, otherwise the vote leader. */
export function standing(poll: Poll, approved: PollOption[]): Standing {
  const total = totalVotes(approved);
  const final = poll.status === "CLOSED";
  const sorted = [...approved].sort((a, b) => b.vote_count - a.vote_count);
  const winner = poll.winner_option_id ? approved.find((o) => o.id === poll.winner_option_id) : undefined;
  if (final && winner) {
    const runnerUp = sorted.find((o) => o.id !== winner.id)?.vote_count ?? 0;
    return { kind: "leader", option: winner, margin: winner.vote_count - runnerUp, final };
  }
  if (total === 0 || sorted.length === 0) return { kind: "empty" };
  const top = sorted[0].vote_count;
  const tied = sorted.filter((o) => o.vote_count === top);
  if (tied.length > 1) return { kind: "tie", options: tied, final };
  return { kind: "leader", option: sorted[0], margin: top - (sorted[1]?.vote_count ?? 0), final };
}

/** Segmented bar: one segment per vote, capped at 20 segments (then 5% each). */
export function segments(count: number, total: number, max = 20): { filled: number; size: number } {
  if (total <= 0) return { filled: 0, size: 10 };
  if (total <= max) return { filled: count, size: total };
  return { filled: Math.round((count / total) * max), size: max };
}
