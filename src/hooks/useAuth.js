// ─── useAuth.js ────────────────────────────────────────────────────────────────
// Session lifecycle management for DinnerHack.
//
// ── What it does ─────────────────────────────────────────────────────────────
//   • Calls supabase.auth.getSession() once on mount to hydrate from storage
//   • Subscribes to onAuthStateChange so the UI reacts immediately to
//     sign-in / sign-out / token-refresh events
//   • Exposes signOut() which calls supabase.auth.signOut() and lets the
//     listener above handle the state update (no double setState)
//
// ── Returns ───────────────────────────────────────────────────────────────────
//   { session, user, loading, signOut }
//
//   session  – Supabase Session object or null
//   user     – session.user shorthand or null
//   loading  – true while the initial getSession() is in flight
//   signOut  – async fn; clears the session
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ── 1. Hydrate from persisted storage ────────────────────────────────────
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // ── 2. Subscribe to future auth state changes ─────────────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        // If loading is still true (race condition), clear it
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    // onAuthStateChange fires → setSession(null) automatically
  }, []);

  return {
    session,
    user: session?.user ?? null,
    loading,
    signOut,
  };
}
