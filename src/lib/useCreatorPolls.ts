"use client";
import { useEffect, useState } from "react";
import { fetchCreatorPoll, fetchCreatorPolls, UnauthorizedPollError, type CreatorPoll } from "./creatorApi";
import { PollNotFoundError } from "./pollApi";
import { getSupabase } from "./supabase";
import { useAuth } from "./auth/AuthContext";

type State = { owner: string | null; data: CreatorPoll[] | null; error: "missing" | "unauthorized" | "error" | null };
export function useCreatorPolls(pollId?: string) {
  const auth = useAuth();
  const owner = auth.ready ? auth.user?.id ?? null : null;
  const identity = owner ? `${owner}:${pollId ?? "dashboard"}` : null;
  const [state, setState] = useState<State>({ owner: null, data: null, error: null });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!owner) return;
    let alive = true;
    const controller = new AbortController();
    let seq = 0;
    let healthy = false;
    let deadlineTimer: ReturnType<typeof setTimeout> | undefined;
    let debounce: ReturnType<typeof setTimeout> | undefined;
    const refresh = async () => {
      const current = ++seq;
      try {
        const data = pollId ? [await fetchCreatorPoll(pollId, owner, controller.signal)] : await fetchCreatorPolls(owner, controller.signal);
        if (!alive || seq !== current) return;
        setState({ owner: identity, data, error: null });
        clearTimeout(deadlineTimer);
        const next = Math.min(...data.filter((p) => p.status === "OPEN" && p.closed_at).map((p) => Date.parse(p.closed_at!)));
        if (Number.isFinite(next)) deadlineTimer = setTimeout(() => void refresh(), Math.min(2147483647, Math.max(100, next - Date.now() + 100)));
      } catch (err) {
        if (!alive || seq !== current) return;
        const error = err instanceof PollNotFoundError ? "missing" : err instanceof UnauthorizedPollError ? "unauthorized" : "error";
        setState((old) => ({ owner: identity, data: error === "error" && old.owner === identity ? old.data : null, error }));
      }
    };
    void refresh();
    const change = () => {
      healthy = true;
      clearTimeout(debounce);
      debounce = setTimeout(() => void refresh(), 250);
    };
    const supabase = getSupabase();
    const channel = supabase.channel(`creator:${owner}:${pollId ?? "dashboard"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "polls", filter: pollId ? `id=eq.${pollId}` : `creator_id=eq.${owner}` }, change)
      .on("postgres_changes", { event: "*", schema: "public", table: "poll_options", ...(pollId ? { filter: `poll_id=eq.${pollId}` } : {}) }, change)
      .subscribe((status) => { if (status !== "SUBSCRIBED") healthy = false; });
    const interval = setInterval(() => { if (!healthy && document.visibilityState === "visible") void refresh(); }, 10000);
    const visible = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", visible);
    return () => {
      alive = false; seq++;
      controller.abort();
      clearTimeout(deadlineTimer); clearTimeout(debounce); clearInterval(interval);
      document.removeEventListener("visibilitychange", visible);
      void supabase.removeChannel(channel);
    };
  }, [owner, identity, pollId, revision]);
  return { data: state.owner === identity && identity ? state.data : null, error: state.owner === identity && identity ? state.error : null, refresh: () => setRevision((r) => r + 1) };
}
