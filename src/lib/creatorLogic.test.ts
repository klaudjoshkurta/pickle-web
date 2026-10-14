import { describe, expect, it } from "vitest";
import { cleanOptions, DEADLINES, deadlinePassed, emptyDraft, expectedVoterCount, isValidPollInput, restoreDraft, sanitizeExpectedVoters, validateDraft } from "./creatorLogic";
describe("creator validation and recovery", () => {
  const valid = () => ({ ...emptyDraft(), question: "Dinner?", options: ["Pizza", "Soup"] });
  it("uses the product defaults", () => {
    expect(emptyDraft()).toMatchObject({ options: ["", ""], allowSuggestions: false, requireApproval: true, showResults: false, allowVoteChange: true, deadline: 0 });
    expect(DEADLINES).toEqual([0, 3600, 86400, 259200, 604800]);
  });
  it("trims, drops blank entries and deduplicates case insensitively in original order", () => {
    expect(cleanOptions([" Pizza ", "", "pizza", "SOUP", " soup ", "  "])).toEqual(["Pizza", "SOUP"]);
    expect(validateDraft({ ...valid(), options: ["Pizza", "pizza", " "] })).toBe("optionsRequired");
    expect(validateDraft({ ...valid(), question: " \n " })).toBe("questionRequired");
    expect(validateDraft({ ...valid(), options: Array.from({ length: 11 }, (_, i) => String(i)) })).toBe("optionsRequired");
    expect(validateDraft(valid())).toBeNull();
  });
  it.each(["-1", "1.5", "1e3", "abc", "10000", "2147483648"])("rejects expected count %s", (expectedVoters) => {
    expect(validateDraft({ ...valid(), expectedVoters })).toBe("expectedInvalid");
  });
  it.each(["", "  ", "0", "1", "9999"])("accepts optional expected count %s", (expectedVoters) => {
    expect(validateDraft({ ...valid(), expectedVoters })).toBeNull();
  });
  it("matches Android's numeric input and unknown turnout", () => {
    expect(sanitizeExpectedVoters("1a2b345")).toBe("1234");
    expect(sanitizeExpectedVoters("" )).toBe("");
    expect(expectedVoterCount("0")).toBeNull();
    expect(expectedVoterCount("0000")).toBeNull();
    expect(expectedVoterCount("" )).toBeNull();
    expect(expectedVoterCount("0012")).toBe(12);
    expect(expectedVoterCount("9999")).toBe(9999);
  });
  it("enables creation only with a question and two distinct options", () => {
    expect(isValidPollInput(emptyDraft())).toBe(false);
    expect(isValidPollInput({ question: "Q", options: ["A", " a "] })).toBe(false);
    expect(isValidPollInput({ question: "Q", options: [" A ", " B ", ""] })).toBe(true);
  });
  it("recovers a valid draft and request key, excluding unknown fields", () => {
    const draft = { ...valid(), requestId: "00000000-0000-4000-8000-000000000001" };
    expect(restoreDraft(JSON.stringify({ ...draft, secret: "discard" }))).toEqual(draft);
  });
  it.each([null, "{", "{}", '{"options":[1,2]}'])("handles missing/corrupt drafts", (raw) => {
    expect(restoreDraft(raw)).toEqual(emptyDraft());
  });
  it("rejects invalid saved settings and keys", () => {
    expect(restoreDraft(JSON.stringify({ ...valid(), deadline: 2 }))).toEqual(emptyDraft());
    expect(restoreDraft(JSON.stringify({ ...valid(), requestId: "bad" }))).toEqual(emptyDraft());
  });
});
describe("deadline semantics", () => {
  const cutoff = "2026-10-14T12:00:00Z";
  it("expires at the exact scheduled instant, without treating future closed_at as closure", () => {
    expect(deadlinePassed({ status: "OPEN", closed_at: cutoff }, Date.parse(cutoff) - 1)).toBe(false);
    expect(deadlinePassed({ status: "OPEN", closed_at: cutoff }, Date.parse(cutoff))).toBe(true);
    expect(deadlinePassed({ status: "CLOSED", closed_at: cutoff }, Date.parse(cutoff))).toBe(false);
    expect(deadlinePassed({ status: "OPEN", closed_at: null })).toBe(false);
  });
});
