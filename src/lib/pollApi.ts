import { supabase } from "./supabase";
import { isUuid } from "./pollLogic";
import type { Poll, PollBundle, PollOption } from "./types";

export class PollNotFoundError extends Error {
  constructor() {
    super("Poll not found");
    this.name = "PollNotFoundError";
  }
}

export async function fetchPollBundle(pollId: string): Promise<PollBundle> {
  if (!isUuid(pollId)) throw new PollNotFoundError();

  const [pollRes, optionsRes, voteRes] = await Promise.all([
    supabase.from("polls").select("*").eq("id", pollId).maybeSingle<Poll>(),
    supabase.from("poll_options").select("*").eq("poll_id", pollId).order("created_at").returns<PollOption[]>(),
    supabase.from("votes").select("option_id").eq("poll_id", pollId).maybeSingle<{ option_id: string }>(),
  ]);

  if (pollRes.error?.code === "22P02") throw new PollNotFoundError();
  if (pollRes.error) throw pollRes.error;
  if (!pollRes.data) throw new PollNotFoundError();
  if (optionsRes.error) throw optionsRes.error;
  if (voteRes.error) throw voteRes.error;

  return {
    poll: pollRes.data,
    options: optionsRes.data ?? [],
    myVoteOptionId: voteRes.data?.option_id ?? null,
  };
}

export async function castVote(pollId: string, optionId: string) {
  const { error } = await supabase.rpc("cast_vote", { p_poll_id: pollId, p_option_id: optionId });
  if (error) throw error;
}

export async function suggestOption(poll: Poll, text: string, userId: string) {
  const { error } = await supabase.from("poll_options").insert({
    poll_id: poll.id,
    text,
    suggested_by: userId,
    status: poll.require_approval ? "PENDING" : "APPROVED",
  });
  if (error) throw error;
}
