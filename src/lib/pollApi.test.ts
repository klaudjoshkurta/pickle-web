import { beforeEach, describe, expect, it, vi } from "vitest";
import { castBallot, fetchPollBundle, suggestOption } from "./pollApi";
const {from, rpc, responses, calls} = vi.hoisted(() => ({from: vi.fn(), rpc: vi.fn(), responses: {} as Record<string, {data: unknown; error: unknown}>, calls: [] as unknown[][]}));
vi.mock("./supabase", () => ({getSupabase: () => ({from, rpc})}));
const id = "00000000-0000-0000-0000-000000000001";
beforeEach(() => {
  vi.clearAllMocks(); calls.length = 0;
  responses.polls = {data: {id, status: "OPEN", closed_at: null}, error: null};
  responses.poll_options = {data: [{id: "b", position: 2, created_at: "2026-01-01"}, {id: "a", position: 1, created_at: "2026-01-01"}], error: null};
  responses.votes = {data: {option_id: "legacy"}, error: null};
  responses.poll_ballots = {data: {option_ids: ["a", "b"]}, error: null};
  from.mockImplementation((table: string) => {
    const chain = {select: vi.fn(), eq: vi.fn(), order: vi.fn(), maybeSingle: vi.fn(), returns: vi.fn(), insert: vi.fn()};
    chain.select.mockReturnValue(chain); chain.order.mockReturnValue(chain);
    chain.eq.mockImplementation((...args) => {calls.push([table, ...args]); return chain;});
    chain.maybeSingle.mockResolvedValue(responses[table]); chain.returns.mockResolvedValue(responses[table]); chain.insert.mockResolvedValue({error: null});
    return chain;
  });
  rpc.mockResolvedValue({error: null});
});
describe("shared ballot API", () => {
  it("reads complete ballots with explicit account filtering and stable ordering", async () => {
    const result = await fetchPollBundle(id, "user-b");
    expect(result.myVoteOptionIds).toEqual(["a","b"]);
    expect(result.options.map(o=>o.id)).toEqual(["a","b"]);
    expect(calls).toContainEqual(["poll_ballots","voter_id","user-b"]);
    expect(calls).toContainEqual(["votes","voter_id","user-b"]);
  });
  it("falls back to legacy votes only when no complete ballot exists", async () => {
    responses.poll_ballots.data = null;
    expect((await fetchPollBundle(id,"a")).myVoteOptionIds).toEqual(["legacy"]);
  });
  it("does not hide a ballot read failure behind the legacy fallback", async () => {
    responses.poll_ballots.error = new Error("offline");
    await expect(fetchPollBundle(id,"a")).rejects.toThrow("offline");
  });
  it("replaces a whole ballot in one RPC and surfaces backend errors", async () => {
    await castBallot(id,["a","b"]);
    expect(rpc).toHaveBeenCalledWith("cast_ballot",{p_poll_id:id,p_option_ids:["a","b"]});
    rpc.mockResolvedValue({error:new Error("Vote change not allowed")});
    await expect(castBallot(id,["c"])).rejects.toThrow("Vote change not allowed");
  });
  it("preserves creator suggestion approval semantics",async()=>{
    await suggestOption({id,creator_id:"creator",require_approval:true} as never,"Salads","creator");
    expect(from.mock.results.at(-1)?.value.insert).toHaveBeenCalledWith({poll_id:id,text:"Salads",suggested_by:null,status:"APPROVED"});
  });
});
