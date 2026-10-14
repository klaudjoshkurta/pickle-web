import { describe, expect, it } from "vitest";
import {
  canShowResults,
  closedOutcome,
  isDuplicateOption,
  isUuid,
  mapVoteError,
  percentOf,
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

describe("closedOutcome", () => {
  it("reports winner, tie, or nothing", () => {
    const options = [opt({ vote_count: 1 }), opt({ vote_count: 1 })];
    expect(closedOutcome(poll(), options)).toEqual({ kind: "none" });
    expect(closedOutcome(poll({ status: "CLOSED", winner_option_id: "x" }), options)).toEqual({ kind: "winner", optionId: "x" });
    expect(closedOutcome(poll({ status: "CLOSED" }), options)).toEqual({ kind: "tie" });
    expect(closedOutcome(poll({ status: "CLOSED" }), [opt()])).toEqual({ kind: "none" });
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
