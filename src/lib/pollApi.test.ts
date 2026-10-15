import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Poll } from "./types";

const mock = vi.hoisted(() => ({
  rows: {} as Record<string, { data: unknown; error: unknown }>,
  rpc: vi.fn(),
  orders: [] as string[],
}));
vi.mock("./supabase", () => ({ getSupabase: () => ({
  rpc: mock.rpc,
  from(table: string) {
    return {
      select() { return this; }, eq() { return this; },
      order(column: string) { mock.orders.push(column); return this; },
      maybeSingle() { return Promise.resolve(mock.rows[table]); },
      returns() { return Promise.resolve(mock.rows[table]); },
    };
  },
}) }));
import { castBallot, fetchPollBundle } from "./pollApi";

const id = "00000000-0000-0000-0000-000000000001";
const poll: Poll = { id, question: "Film?", creator_id: "owner", allow_suggestions: true,
  require_approval: true, show_results_before_voting: true, allow_vote_change: true,
  status: "OPEN", created_at: "2026-01-01T00:00:00Z", closed_at: null,
  winner_option_id: null, expected_voters: null, voting_mode: "SINGLE", voter_count: 1 };

beforeEach(() => {
  mock.rpc.mockReset().mockResolvedValue({ error: null }); mock.orders.length=0;
  mock.rows={ polls: {data:poll,error:null}, poll_options:{data:[],error:null},
    votes:{data:{option_id:"a"},error:null}, poll_ballots:{data:null,error:null} };
});
describe("ballot API", () => {
  it("restores legacy single-choice votes as a set and requests canonical order", async () => {
    const bundle=await fetchPollBundle(id);
    expect(bundle.myVoteOptionIds).toEqual(["a"]);
    expect(mock.orders).toEqual(["position","created_at","id"]);
  });
  it("restores the complete multi-choice ballot separately from legacy rows", async () => {
    mock.rows.polls.data={...poll,voting_mode:"MULTIPLE"};
    mock.rows.poll_ballots.data={option_ids:["b","c"]};
    expect((await fetchPollBundle(id)).myVoteOptionIds).toEqual(["b","c"]);
  });
  it("submits the entire replacement ballot through the atomic RPC", async () => {
    await castBallot(id,["a","c"]);
    expect(mock.rpc).toHaveBeenCalledExactlyOnceWith("cast_ballot",{p_poll_id:id,p_option_ids:["a","c"]});
  });
  it("surfaces ballot-read and write failures for screen retry handling", async () => {
    const error=new Error("offline"); mock.rows.poll_ballots.error=error;
    await expect(fetchPollBundle(id)).rejects.toBe(error);
    mock.rpc.mockResolvedValue({error});await expect(castBallot(id,["a"])).rejects.toBe(error);
  });
});
