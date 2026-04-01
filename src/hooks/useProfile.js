// ─── useProfile.js ────────────────────────────────────────────────────────────
// Fetch and persist the user's DinnerHack profile from the `profiles` table.
//
// ── Profile shape (mirrors DB schema) ────────────────────────────────────────
//   id                  UUID   (PK, equals auth.users.id)
//   family_name         TEXT   ("My Family")
//   stores              TEXT[] (["Aldi", "Giant Eagle"])
//   nono_list           TEXT[] (allergens / dislikes)
//   default_headcount   SMALLINT (1–12, default 4)
//   subscription_status TEXT   ("trial" | "active" | "cancelled")
//
// ── Behaviour ─────────────────────────────────────────────────────────────────
//   • Fetches on mount whenever userId is truthy
//   • hasProfile = false means no row exists → show OnboardingWizard
//   • saveProfile upserts then re-fetches to keep UI in sync
//   • refetch() can be called externally (e.g. after onboarding completes)
//
// ── Returns ───────────────────────────────────────────────────────────────────
//   { profile, hasProfile, loading, error, saveProfile, refetch }
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

const DEFAULT_PROFILE = {
  family_name:        "My Family",
  stores:             ["Aldi", "Giant Eagle"],
  nono_list:          [],
  default_headcount:  4,
  subscription_status:"trial",
};

export function useProfile(userId) {
  const [profile,    setProfile]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  // ── Core fetch ──────────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("profiles")
      .select("id, family_name, stores, nono_list, default_headcount, subscription_status, billing_date")
      .eq("id", userId)
      .maybeSingle(); // returns null (not an error) if no row found yet

    if (error) {
      console.error("[useProfile] fetch failed:", error.message);
      setError(error.message);
      setLoading(false);
      return;
    }

    setProfile(data);   // null → new user, object → existing user
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ── Upsert profile ──────────────────────────────────────────────────────────
  /**
   * Upsert a partial or complete profile payload.
   * Merges with DEFAULT_PROFILE so callers only need to pass changed fields.
   *
   * @param {Object} updates - Partial profile fields to save
   * @returns {{ error: string|null }}
   */
  const saveProfile = useCallback(async (updates) => {
    if (!userId) return { error: "Not authenticated" };

    const payload = {
      ...DEFAULT_PROFILE,
      ...updates,
      id: userId,
    };

    const { error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" });

    if (error) {
      console.error("[useProfile] save failed:", error.message);
      return { error: error.message };
    }

    // Re-fetch so `profile` state reflects what's actually in the DB
    await fetchProfile();
    return { error: null };
  }, [userId, fetchProfile]);

  return {
    profile,
    hasProfile: profile !== null,   // false = new user, needs onboarding
    loading,
    error,
    saveProfile,
    refetch: fetchProfile,
  };
}
