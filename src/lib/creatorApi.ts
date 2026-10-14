import { getSupabase } from "./supabase";
import { cleanOptions, deadlinePassed, validateDraft, type PollDraft } from "./creatorLogic";
import { isUuid } from "./pollLogic";
import { PollNotFoundError } from "./pollApi";
import type { Poll, PollOption } from "./types";
import type { MessageKey } from "./i18n/translations";

export interface CreatorPoll extends Poll { poll_options: PollOption[] }
export class UnauthorizedPollError extends Error {}
export function creatorErrorKey(error: unknown): MessageKey {
  const { code, message = "" } = (error ?? {}) as { code?: string; message?: string };
  if (code === "PGRST202") return "creatorBackendMissing";
  if (code === "PGRST301" || message.includes("Authentication required")) return "sessionUnavailable";
  if (message.includes("Poll is not open")) return "errPollClosed";
  if (message.includes("Suggestion unavailable")) return "suggestionUnavailable";
  if (code === "42501" || message.includes("Not authorized")) return "unauthorizedManagement";
  return "creatorFailure";
}
export async function expirePoll(pollId: string, signal?: AbortSignal) {
  const request = getSupabase().rpc("expire_poll", { p_poll_id: pollId });
  const { error } = await (signal ? request.abortSignal(signal) : request);
  if (error) throw error;
}
export async function fetchCreatorPolls(userId: string, signal?: AbortSignal): Promise<CreatorPoll[]> {
  const query = () => {
    const request = getSupabase().from("polls").select("*, poll_options(*)").eq("creator_id", userId).order("created_at", { ascending: false }).returns<CreatorPoll[]>();
    return signal ? request.abortSignal(signal) : request;
  };
  let result = await query();
  if (result.error) throw result.error;
  const elapsed = (result.data ?? []).filter((p) => deadlinePassed(p));
  if (elapsed.length) {
    await Promise.all(elapsed.map((p) => expirePoll(p.id, signal)));
    result = await query();
    if (result.error) throw result.error;
  }
  return result.data ?? [];
}
export async function fetchCreatorPoll(pollId: string, userId: string, signal?: AbortSignal): Promise<CreatorPoll> {
  if (!isUuid(pollId)) throw new PollNotFoundError();
  const query = () => {
    const request = getSupabase().from("polls").select("*, poll_options(*)").eq("id", pollId);
    return (signal ? request.abortSignal(signal) : request).maybeSingle<CreatorPoll>();
  };
  let result = await query();
  if (result.error) throw result.error;
  if (!result.data) throw new PollNotFoundError();
  if (result.data.creator_id !== userId) throw new UnauthorizedPollError();
  if (deadlinePassed(result.data)) {
    await expirePoll(pollId, signal);
    result = await query();
    if (result.error) throw result.error;
    if (!result.data) throw new PollNotFoundError();
    if (result.data.creator_id !== userId) throw new UnauthorizedPollError();
  }
  return result.data;
}
export async function createPoll(draft: PollDraft): Promise<string> {
  const invalid = validateDraft(draft);
  if (invalid) throw new Error(invalid);
  const { data, error } = await getSupabase().rpc("create_poll", {
    p_question: draft.question.trim(), p_options: cleanOptions(draft.options),
    p_allow_suggestions: draft.allowSuggestions, p_require_approval: draft.requireApproval,
    p_show_results_before_voting: draft.showResults, p_allow_vote_change: draft.allowVoteChange,
    p_deadline_seconds: draft.deadline || null,
    p_expected_voters: draft.expectedVoters.trim() ? Number(draft.expectedVoters) : null,
    p_request_id: draft.requestId,
  });
  if (error) throw error;
  if (typeof data !== "string" || !isUuid(data)) throw new Error("Invalid creation response");
  return data;
}
export async function moderateOption(pollId: string, optionId: string, approve: boolean) {
  const { error } = await getSupabase().rpc("moderate_option", { p_poll_id: pollId, p_option_id: optionId, p_approve: approve });
  if (error) throw error;
}
export async function closePoll(pollId: string) {
  const { error } = await getSupabase().rpc("close_poll", { p_poll_id: pollId });
  if (error) throw error;
}
