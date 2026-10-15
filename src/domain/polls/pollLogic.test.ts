import { describe, expect, it } from "vitest";
import {
  isPollOpen, voterCount, orderOptions, sameBallot, restoreBallot,
  canShowResults,
  deadlinePassed,
  isDuplicateOption,
  isUuid,
  mapVoteError,
  percentOf,
  segments,
  standing,
  totalVotes,
  visibleOptions,
} from "./pollLogic";
import type { Poll, PollOption } from "./types";

const poll = (over: Partial<Poll> = {}): Poll => ({
  id: "00000000-0000-0000-0000-000000000001",
  question: "Where to eat?",
  creator_id: "creator",
  allow_suggestions: true,
  require_approval: true,
  show_results_before_voting: false,
  allow_vote_change: true,
  status: "OPEN",
  created_at: "2026-01-01T00:00:00Z",
  closed_at: null,
  winner_option_id: null,
  expected_voters: null,
  ...over,
});

let n = 0;
const opt = (over: Partial<PollOption> = {}): PollOption => ({
  id: `o${++n}`,
  poll_id: "p",
  text: `Option ${n}`,
  status: "APPROVED",
  vote_count: 0,
  suggested_by: null,
  created_at: "2026-01-01T00:00:00Z",
  ...over,
});

describe("visibleOptions", () => {
  it("shows approved plus only my own pending", () => {
    const a = opt();
    const mine = opt({ status: "PENDING", suggested_by: "me" });
    const theirs = opt({ status: "PENDING", suggested_by: "other" });
    const rejected = opt({ status: "REJECTED", suggested_by: "me" });
    expect(visibleOptions([a, mine, theirs, rejected], "me")).toEqual([a, mine]);
    expect(visibleOptions([a, mine], null)).toEqual([a]);
  });
});

describe("totals and percentages", () => {
  it("counts only approved votes and handles zero", () => {
    expect(totalVotes([opt({ vote_count: 2 }), opt({ vote_count: 1 }), opt({ status: "PENDING", vote_count: 5 })])).toBe(3);
    expect(percentOf(1, 3)).toBe(33);
    expect(percentOf(0, 0)).toBe(0);
  });
});

describe("canShowResults", () => {
  it("hides until voted unless allowed or closed", () => {
    expect(canShowResults(poll(), false)).toBe(false);
    expect(canShowResults(poll(), true)).toBe(true);
    expect(canShowResults(poll({ show_results_before_voting: true }), false)).toBe(true);
    expect(canShowResults(poll({ status: "CLOSED" }), false)).toBe(true);
  });
});

describe("isDuplicateOption", () => {
  it("is case- and whitespace-insensitive", () => {
    const options = [opt({ text: "Pizza Place" })];
    expect(isDuplicateOption("  pizza   place ", options)).toBe(true);
    expect(isDuplicateOption("Sushi", options)).toBe(false);
  });
});

describe("mapVoteError", () => {
  it("maps RPC exceptions to friendly keys", () => {
    expect(mapVoteError("Poll is not open")).toBe("errPollClosed");
    expect(mapVoteError("Option not found or not approved")).toBe("errOptionUnavailable");
    expect(mapVoteError("Vote change not allowed")).toBe("errVoteLocked");
    expect(mapVoteError("network down")).toBe("errGeneric");
    expect(mapVoteError(undefined)).toBe("errGeneric");
  });
});

describe("isUuid", () => {
  it("validates ids", () => {
    expect(isUuid("00000000-0000-0000-0000-000000000001")).toBe(true);
    expect(isUuid("not-a-uuid")).toBe(false);
  });
});

describe("standing", () => {
  it("finds a unique leader and margin", () => {
    const a = opt({ vote_count: 5 }), b = opt({ vote_count: 3 }), c = opt({ vote_count: 0 });
    expect(standing(poll(), [a, b, c])).toEqual({ kind: "leader", option: a, margin: 2, final: false });
  });
  it("detects ties and empty polls", () => {
    const a = opt({ vote_count: 2 }), b = opt({ vote_count: 2 });
    expect(standing(poll(), [a, b])).toEqual({ kind: "tie", options: [a, b], final: false });
    expect(standing(poll(), [opt(), opt()])).toEqual({ kind: "empty" });
  });
  it("keeps equal counts tied even with a legacy winner field", () => {
    const a = opt({ vote_count: 2 }), b = opt({ vote_count: 2 });
    expect(standing(poll({ status: "CLOSED", winner_option_id: b.id }), [a, b])).toEqual({
      kind: "tie", options: [a, b], final: true,
    });
  });
});

describe("segments", () => {
  it("uses one segment per vote up to the cap", () => {
    expect(segments(5, 11)).toEqual({ filled: 5, size: 11 });
    expect(segments(50, 100)).toEqual({ filled: 6, size: 12 });
    expect(segments(0, 0)).toEqual({ filled: 0, size: 10 });
  });
});

describe("deadline semantics", () => {
  const cutoff = "2026-10-14T12:00:00Z";
  it("expires at the exact scheduled instant, without treating future closed_at as closure", () => {
    expect(deadlinePassed({ status: "OPEN", closed_at: cutoff }, Date.parse(cutoff) - 1)).toBe(false);
    expect(deadlinePassed({ status: "OPEN", closed_at: cutoff }, Date.parse(cutoff))).toBe(true);
    expect(deadlinePassed({ status: "OPEN", closed_at: cutoff }, Date.parse(cutoff) + 1)).toBe(true);
    expect(deadlinePassed({ status: "CLOSED", closed_at: cutoff }, Date.parse(cutoff))).toBe(false);
    expect(deadlinePassed({ status: "OPEN", closed_at: null })).toBe(false);
  });
});

describe("Android ballot parity", () => {
  it("restores complete ballots ahead of legacy single votes", () => {
    expect(restoreBallot({ option_ids: ["a", "b"] }, { option_id: "c" })).toEqual(["a", "b"]);
    expect(restoreBallot(null, { option_id: "c" })).toEqual(["c"]);
    expect(restoreBallot(null, null)).toEqual([]);
  });
  it("compares ballots without depending on selection order", () => {
    expect(sameBallot(["a", "b"], ["b", "a"])).toBe(true);
    expect(sameBallot(["a"], ["a", "b"])).toBe(false);
  });
  it("uses voters as denominator and counts selections separately", () => {
    const options = [opt({vote_count: 3}), opt({vote_count: 2})];
    expect(voterCount(poll({voter_count: 3}), options)).toBe(3);
    expect(totalVotes(options)).toBe(5);
    expect(percentOf(2, 3)).toBe(66);
    expect(percentOf(29, 100)).toBe(29);
    expect(voterCount(poll(), options)).toBe(5);
    expect(voterCount(poll({voter_count: 0}), options)).toBe(0);
  });
  it("orders by position, timestamp, then ID", () => {
    const a = opt({id: "a", position: 2}); const b = opt({id: "b", position: 1});
    const c = opt({id: "c", position: 1, created_at: "2025-01-01T00:00:00Z"});
    const d = opt({id: "d", position: 1});
    expect(orderOptions([a,d,b,c]).map(o=>o.id)).toEqual(["c","b","d","a"]);
  });
  it("closes voting and reveals results at an elapsed deadline", () => {
    const expired = poll({closed_at: "2020-01-01T00:00:00Z"});
    expect(isPollOpen(expired)).toBe(false);
    expect(canShowResults(expired, false)).toBe(true);
    expect(isPollOpen(poll({closed_at: "2099-01-01T00:00:00Z"}))).toBe(true);
    expect(isPollOpen(poll())).toBe(true);
  });
});
