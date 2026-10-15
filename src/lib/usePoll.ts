"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PollNotFoundError, fetchPollBundle } from "./pollApi";
import { getSupabase } from "./supabase";
import type { PollBundle } from "./types";

const POLL_INTERVAL_MS = 10_000;

export type PollState =
  | { kind: "loading" }
  | { kind: "notFound" }
  | { kind: "error" }
  | { kind: "ready"; data: PollBundle };

/**
 * Loads a poll and keeps it fresh. Realtime is preferred, but we keep polling every 10s
 * until a realtime event actually arrives (a channel can report SUBSCRIBED while the table
 * isn't in the publication) and whenever the channel drops.
 */
export function usePoll(pollId: string, enabled: boolean, userId: string | null) {
  const [state, setState] = useState<PollState>({ kind: "loading" });
  const loaded = useRef(false);
  const seq = useRef(0);
  const identity = `${pollId}:${userId ?? ""}`;
  const [loadedIdentity, setLoadedIdentity] = useState<string | null>(null);

  const refetch = useCallback((): Promise<boolean> => {
    if (!userId) return Promise.resolve(false);
    // Only the most recent request may write state, so a slow background poll can't
    // overwrite the fresher result fetched right after a vote.
    const mine = ++seq.current;
    return fetchPollBundle(pollId, userId).then(
      (data) => {
        if (mine !== seq.current) return false;
        loaded.current = true;
        setLoadedIdentity(identity);
        setState({ kind: "ready", data });
        return true;
      },
      (err) => {
        if (mine !== seq.current) return false;
        setLoadedIdentity(identity);
        if (err instanceof PollNotFoundError) setState({ kind: "notFound" });
        // Keep showing stale data on background failures; only surface errors before first load.
        else if (!loaded.current) setState({ kind: "error" });
        return false;
      },
    );
  }, [pollId, identity, userId]);

  const retry = useCallback(() => {
    setState({ kind: "loading" });
    void refetch();
  }, [refetch]);

  // Initial load, and reload when the signed-in user changes (their vote differs).
  useEffect(() => {
    if (!enabled) return;
    loaded.current = false;
    void refetch();
    const sequence = seq;
    return () => { sequence.current++; };
  }, [enabled, refetch, userId]);

  useEffect(() => {
    if (!enabled) return;

    let realtimeHealthy = false;
    let debounce: ReturnType<typeof setTimeout> | undefined;
    const onChange = () => {
      realtimeHealthy = true;
      clearTimeout(debounce);
      debounce = setTimeout(() => void refetch(), 250);
    };

    const supabase = getSupabase();
    const channel = supabase
      .channel(`poll:${pollId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "poll_options", filter: `poll_id=eq.${pollId}` }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "polls", filter: `id=eq.${pollId}` }, onChange)
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") realtimeHealthy = false;
      });

    const interval = setInterval(() => {
      if (!realtimeHealthy && document.visibilityState === "visible") void refetch();
    }, POLL_INTERVAL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") void refetch();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearTimeout(debounce);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      void supabase.removeChannel(channel);
    };
  }, [enabled, pollId, refetch]);

  useEffect(() => {
    if (!enabled || state.kind !== "ready" || state.data.poll.status !== "OPEN" || !state.data.poll.closed_at) return;
    const remaining = Date.parse(state.data.poll.closed_at) - Date.now();
    if (remaining <= 0) return;
    const timer = setTimeout(() => void refetch(), Math.min(2147483647, remaining + 100));
    return () => clearTimeout(timer);
  }, [enabled, state, refetch]);

  return { state: loadedIdentity !== identity ? { kind: "loading" } as PollState : state, refetch, retry };
}
