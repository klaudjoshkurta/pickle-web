"use client";

import type { User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ProfileDialog } from "@/components/auth/ProfileDialog";
import { getSupabase } from "@/lib/supabase";

export interface Profile {
  displayName: string | null;
  avatarUrl: string | null;
}

interface AuthValue {
  user: User | null;
  /** True once a session (anonymous or real) exists. */
  ready: boolean;
  /** Set when anonymous sign-in failed (e.g. offline). */
  error: Error | null;
  profile: Profile;
  retry: () => void;
  /** Ensures a session exists, signing in anonymously if needed. */
  ensureSession: () => void;
  /** Resolves true once the user has a display name, opening the profile dialog if needed. */
  requireProfile: () => Promise<boolean>;
  /** Opens the profile dialog to edit name/avatar. */
  openProfile: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

function profileOf(user: User | null): Profile {
  const meta = user?.user_metadata ?? {};
  const name = typeof meta.display_name === "string" ? meta.display_name.trim() : "";
  return {
    displayName: name || null,
    avatarUrl: typeof meta.avatar_url === "string" ? meta.avatar_url : null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);
  // Anonymous sign-in only happens once a page asks for a session (poll pages), so
  // landing-page visitors don't create throwaway users.
  const [wanted, setWanted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const pending = useRef<((ok: boolean) => void) | null>(null);
  const sessionLost = useRef(false);
  const ensureSession = useCallback(() => setWanted(true), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      const supabase = getSupabase();
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (cancelled) return;
      if (sessionError) throw sessionError;
      if (data.session) {
        setUser(data.session.user);
        setReady(true);
        return;
      }
      if (!wanted) return;
      if (sessionLost.current) {
        setError(new Error("Session lost. Sign in to recover your votes and suggestions."));
        return;
      }
      const res = await supabase.auth.signInAnonymously();
      if (cancelled) return;
      if (res.error) {
        setError(res.error);
        return;
      }
      setUser(res.data.user);
      setReady(true);
    })().catch((err: Error) => {
      // e.g. missing env vars; poll pages show this as the error state.
      if (!cancelled) setError(err);
    });
    return () => {
      cancelled = true;
    };
  }, [attempt, wanted]);

  useEffect(() => {
    let supabase;
    try {
      supabase = getSupabase();
    } catch {
      return; // Reported by the session effect above.
    }
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        sessionLost.current = false;
        setUser(session.user);
        setReady(true);
        setError(null);
      } else if (_event !== "INITIAL_SESSION") {
        sessionLost.current = true;
        setUser(null);
        setReady(false);
        setError(new Error("Session expired. Sign in again."));
        pending.current?.(false);
        pending.current = null;
        setDialogOpen(false);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const profile = useMemo(() => profileOf(user), [user]);

  const requireProfile = useCallback(() => {
    if (profile.displayName) return Promise.resolve(true);
    pending.current?.(false);
    setDialogOpen(true);
    return new Promise<boolean>((resolve) => {
      pending.current = resolve;
    });
  }, [profile.displayName]);

  const openProfile = useCallback(() => {
    pending.current?.(false);
    pending.current = null;
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback((ok: boolean) => {
    setDialogOpen(false);
    pending.current?.(ok);
    pending.current = null;
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      ready,
      error,
      profile,
      retry: () => setAttempt((a) => a + 1),
      ensureSession,
      requireProfile,
      openProfile,
    }),
    [user, ready, error, profile, requireProfile, openProfile, ensureSession],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <ProfileDialog open={dialogOpen} onDone={closeDialog} />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
