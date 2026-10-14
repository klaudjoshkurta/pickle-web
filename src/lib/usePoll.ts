"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PollNotFoundError, fetchPollBundle } from "./pollApi";
import { supabase } from "./supabase";
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

  const refetch = useCallback((): Promise<void> => {
    // Only the most recent request may write state, so a slow background poll can't
    // overwrite the fresher result fetched right after a vote.
    const mine = ++seq.current;
    return fetchPollBundle(pollId).then(
      (data) => {
        if (mine !== seq.current) return;
        loaded.current = true;
        setState({ kind: "ready", data });
      },
      (err) => {
        if (mine !== seq.current) return;
        if (err instanceof PollNotFoundError) setState({ kind: "notFound" });
        // Keep showing stale data on background failures; only surface errors before first load.
        else if (!loaded.current) setState({ kind: "error" });
      },
    );
  }, [pollId]);

  const retry = useCallback(() => {
    setState({ kind: "loading" });
    void refetch();
  }, [refetch]);

  // Initial load, and reload when the signed-in user changes (their vote differs).
  useEffect(() => {
    if (!enabled) return;
    void refetch();
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

  return { state, refetch, retry };
}
