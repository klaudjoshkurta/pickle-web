import { getSupabase } from "./supabase";
import { deadlinePassed, isUuid } from "./pollLogic";
import type { Poll, PollBundle, PollOption } from "./types";

export class PollNotFoundError extends Error {
  constructor() {
    super("Poll not found");
    this.name = "PollNotFoundError";
  }
}

export async function fetchPollBundle(pollId: string): Promise<PollBundle> {
  if (!isUuid(pollId)) throw new PollNotFoundError();

  const [pollRes, optionsRes, voteRes, ballotRes] = await Promise.all([
    getSupabase().from("polls").select("*").eq("id", pollId).maybeSingle<Poll>(),
    getSupabase().from("poll_options").select("*").eq("poll_id", pollId).order("position").order("created_at").order("id").returns<PollOption[]>(),
    getSupabase().from("votes").select("option_id").eq("poll_id", pollId).maybeSingle<{ option_id: string }>(),
    getSupabase().from("poll_ballots").select("option_ids").eq("poll_id", pollId).maybeSingle<{ option_ids: string[] }>(),
  ]);

  if (pollRes.error?.code === "22P02") throw new PollNotFoundError();
  if (pollRes.error) throw pollRes.error;
  if (!pollRes.data) throw new PollNotFoundError();
  if (deadlinePassed(pollRes.data)) {
    const { error } = await getSupabase().rpc("expire_poll", { p_poll_id: pollId });
    // Existing public voting continues to work before the additive migration is applied.
    if (error && error.code !== "PGRST202") throw error;
    if (!error) {
      const fresh = await getSupabase().from("polls").select("*").eq("id", pollId).maybeSingle<Poll>();
      if (fresh.error) throw fresh.error;
      if (!fresh.data) throw new PollNotFoundError();
      pollRes.data = fresh.data;
    }
  }
  if (optionsRes.error) throw optionsRes.error;
  if (voteRes.error) throw voteRes.error;
  if (ballotRes.error) throw ballotRes.error;

  return {
    poll: pollRes.data,
    options: optionsRes.data ?? [],
    myVoteOptionIds: pollRes.data.voting_mode === "MULTIPLE" ? ballotRes.data?.option_ids ?? [] : voteRes.data ? [voteRes.data.option_id] : [],
  };
}

export async function castBallot(pollId: string, optionIds: string[]) {
  const { error } = await getSupabase().rpc("cast_ballot", { p_poll_id: pollId, p_option_ids: optionIds });
  if (error) throw error;
}

export async function suggestOption(poll: Poll, text: string, userId: string) {
  const { error } = await getSupabase().from("poll_options").insert({
    poll_id: poll.id,
    text,
    suggested_by: userId,
    status: poll.require_approval ? "PENDING" : "APPROVED",
  });
  if (error) throw error;
}
