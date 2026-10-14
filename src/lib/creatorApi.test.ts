import { beforeEach, describe, expect, it, vi } from "vitest";
import { emptyDraft } from "./creatorLogic";
import { closePoll, createPoll, creatorErrorKey, fetchCreatorPoll, moderateOption, UnauthorizedPollError } from "./creatorApi";
import { PollNotFoundError } from "./pollApi";
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(), maybeSingle: vi.fn() }));
vi.mock("./supabase", () => ({ getSupabase: () => ({ rpc: mocks.rpc, from: mocks.from }) }));
const id = "00000000-0000-4000-8000-000000000001";
beforeEach(() => {
  vi.resetAllMocks();
  const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: mocks.maybeSingle };
  mocks.from.mockReturnValue(chain);
});
describe("creator API boundaries", () => {
  it("maps recoverable backend, session and moderation errors", () => {
    expect(creatorErrorKey({ code: "PGRST202" })).toBe("creatorBackendMissing");
    expect(creatorErrorKey({ message: "Authentication required" })).toBe("sessionUnavailable");
    expect(creatorErrorKey({ code: "42501" })).toBe("unauthorizedManagement");
    expect(creatorErrorKey({ message: "Poll is not open" })).toBe("errPollClosed");
    expect(creatorErrorKey({ message: "Suggestion unavailable" })).toBe("suggestionUnavailable");
    expect(creatorErrorKey(new Error("offline"))).toBe("creatorFailure");
  });
  it("submits a cleaned payload without a browser-supplied creator id", async () => {
    mocks.rpc.mockResolvedValue({ data: id, error: null });
    const draft = { ...emptyDraft(), question: " Dinner? ", options: [" Pizza ", "pizza", "Soup", ""], expectedVoters: "12", deadline: 3600, requestId: id };
    expect(await createPoll(draft)).toBe(id);
    expect(mocks.rpc).toHaveBeenCalledWith("create_poll", {
      p_question: "Dinner?", p_options: ["Pizza", "Soup"], p_allow_suggestions: false, p_require_approval: true,
      p_show_results_before_voting: false, p_allow_vote_change: true, p_deadline_seconds: 3600, p_expected_voters: 12, p_request_id: id,
    });
  });
  it("does not submit invalid forms", async () => {
    await expect(createPoll(emptyDraft())).rejects.toThrow("questionRequired");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("surfaces database errors and ambiguous creation responses", async () => {
    const error = { code: "42501", message: "Authentication required" };
    mocks.rpc.mockResolvedValueOnce({ error });
    const draft = { ...emptyDraft(), question: "Q", options: ["A", "B"], requestId: id };
    await expect(createPoll(draft)).rejects.toEqual(error);
    mocks.rpc.mockResolvedValueOnce({ data: null, error: null });
    await expect(createPoll(draft)).rejects.toThrow("Invalid creation response");
  });
  it("separates missing polls from non-owner management", async () => {
    await expect(fetchCreatorPoll("bad", "owner")).rejects.toBeInstanceOf(PollNotFoundError);
    expect(mocks.from).not.toHaveBeenCalled();
    mocks.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    await expect(fetchCreatorPoll(id, "owner")).rejects.toBeInstanceOf(PollNotFoundError);
    mocks.maybeSingle.mockResolvedValueOnce({ data: { id, creator_id: "other" }, error: null });
    await expect(fetchCreatorPoll(id, "owner")).rejects.toBeInstanceOf(UnauthorizedPollError);
  });
  it("finalizes elapsed polls then reads the final result", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({ data: { id, creator_id: "owner", status: "OPEN", closed_at: "2020-01-01T00:00:00Z" }, error: null });
    mocks.rpc.mockResolvedValue({ error: null });
    const final = { id, creator_id: "owner", status: "CLOSED" };
    mocks.maybeSingle.mockResolvedValueOnce({ data: final, error: null });
    expect(await fetchCreatorPoll(id, "owner")).toEqual(final);
    expect(mocks.rpc).toHaveBeenCalledWith("expire_poll", { p_poll_id: id });
  });
  it("keeps moderation and Android closing signatures", async () => {
    mocks.rpc.mockResolvedValue({ error: null });
    await moderateOption(id, "option", false); await closePoll(id);
    expect(mocks.rpc).toHaveBeenCalledWith("moderate_option", { p_poll_id: id, p_option_id: "option", p_approve: false });
    expect(mocks.rpc).toHaveBeenCalledWith("close_poll", { p_poll_id: id });
  });
});
