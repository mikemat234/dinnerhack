// ─── useMenu.js ────────────────────────────────────────────────────────────────
// Live Supabase implementation of the weekly menu hook.
//
// ── Signature change from original ───────────────────────────────────────────
// useMenu(userId) now accepts the authenticated user's UUID from the parent
// (App.jsx → MainApp).  This avoids calling supabase.auth.getUser() inside a
// data-fetching hook (separation of concerns) and means the hook only runs
// after auth is confirmed — no auth-error handling needed here.
//
// ── Data flow ────────────────────────────────────────────────────────────────
//
//   useEffect (when userId changes)
//     │
//     ├─ Promise.all([
//     │    supabase.from("deals").select()          ← this week's loss leaders
//     │    supabase.from("profiles").select()       ← user's nonoList
//     │    supabase.from("saved_meals").select()    ← recipe vault
//     │  ])
//     │
//     └─ buildMenuFromDeals(deals, vaultMeals, nonoList)
//          └─ scores vault recipes against top-5 deals
//          └─ filters allergenic / disliked items
//          └─ falls back to synthetic template suggestions for sparse vaults
//
// ── Fallback ──────────────────────────────────────────────────────────────────
// If VITE_SUPABASE_URL is not set, the hook falls back to mock data so the UI
// renders correctly in local dev without a Supabase project.
//
// ── RLS audit ─────────────────────────────────────────────────────────────────
// All queries that touch user-owned rows pass .eq("user_id", userId)
// explicitly, providing belt-and-suspenders protection beyond RLS policies:
//   • saved_meals → fetchVaultMeals   → .eq("user_id", userId)
//   • profiles    → fetchUserProfile  → .eq("id", userId)
//   • toggleSaved delete              → .eq("id", `${userId}_${id}`)
//   • toggleSaved upsert payload      → user_id field set to userId
//   • deals table has no user_id — public read, RLS policy USING (true)
//
// ── Persistence ───────────────────────────────────────────────────────────────
// toggleSaved  → optimistic UI update + async Supabase upsert/delete + rollback
// updateHeadcount → local-only (session state)
//   TODO: persist to menu_headcounts table for cross-device sync
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase }                              from "../lib/supabase";
import { INITIAL_MENU, DEALS }                   from "../data/mockData";
import {
  buildMenuFromDeals,
  filterByNonoList,
  currentWeekOf,
  formatWeekRange,
}                                                from "./menuBuilder";

// ── Feature flag ──────────────────────────────────────────────────────────────
// When Supabase env vars are absent we serve mock data so devs can work on UI
// without a backend. Flip to `false` to force Supabase even in dev.
const SUPABASE_CONFIGURED = Boolean(import.meta.env.VITE_SUPABASE_URL);

// ── Data fetchers (isolated for easy testing / replacement) ───────────────────

/** Fetch this week's deals — no user filter, deals are public. */
async function fetchDeals(weekOf) {
  const { data, error } = await supabase
    .from("deals")
    .select("id, store, item, orig, sale, unit, pct, emoji, category, week_of")
    .eq("week_of", weekOf)
    .order("pct", { ascending: false });

  if (error) throw new Error(`deals: ${error.message}`);
  return data ?? [];
}

/**
 * Fetch the current user's profile to get nonoList + store preferences.
 * Uses .eq("id", userId) — belt-and-suspenders on top of RLS.
 * Returns null (non-fatal) if the profile row doesn't exist yet.
 */
async function fetchUserProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("nono_list, stores, family_name, default_headcount")
    .eq("id", userId)              // explicit filter — belt-and-suspenders
    .maybeSingle();

  if (error) throw new Error(`profiles: ${error.message}`);
  return data;                     // null if new user
}

/**
 * Fetch the user's saved meals (Recipe Vault) — used for recipe matching.
 * Uses .eq("user_id", userId) — belt-and-suspenders on top of RLS.
 */
async function fetchVaultMeals(userId) {
  const { data, error } = await supabase
    .from("saved_meals")
    .select("id, name, rating, tags, emoji, headcount, cost_per_serving, ingredients, prep_time, subtitle")
    .eq("user_id", userId)         // explicit filter — belt-and-suspenders
    .order("rating", { ascending: false });

  if (error) throw new Error(`saved_meals: ${error.message}`);
  return data ?? [];
}

// ── Saved-meal upsert payload ──────────────────────────────────────────────────

function buildVaultPayload(userId, menuDay) {
  return {
    id:               `${userId}_${menuDay.id}`,
    user_id:          userId,
    name:             menuDay.meal,
    subtitle:         menuDay.subtitle ?? null,
    date_saved:       new Date().toISOString().slice(0, 10),
    rating:           0,
    tags:             menuDay.tags ?? [],
    emoji:            menuDay.emoji ?? "🍽️",
    cooked_count:     0,
    headcount:        menuDay.headcount ?? 4,
    cost_per_serving: menuDay.costPerServing,
    ingredients:      menuDay.dealIngredients ?? [],
    prep_time:        menuDay.prepTime ?? null,
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * @param {string} userId - The authenticated user's UUID (from useAuth → App.jsx)
 */
export function useMenu(userId) {
  const [menu,       setMenu]       = useState([]);
  const [deals,      setDeals]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [saveError,  setSaveError]  = useState(null);

  const weekRangeRef = useRef(formatWeekRange());

  // ── Initial data fetch ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);

      // ── Dev fallback ────────────────────────────────────────────────────────
      if (!SUPABASE_CONFIGURED) {
        console.warn("[useMenu] Supabase not configured — using mock data");
        setDeals(DEALS);
        setMenu(INITIAL_MENU);
        setLoading(false);
        return;
      }

      // userId is guaranteed truthy here (App.jsx gates on it), but guard anyway
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const weekOf = currentWeekOf();

        // ── Parallel fetch: deals + profile + vault ──────────────────────────
        const [rawDeals, profile, vaultMeals] = await Promise.all([
          fetchDeals(weekOf),
          fetchUserProfile(userId).catch(err => {
            console.warn("[useMenu] Profile not found:", err.message);
            return null;
          }),
          fetchVaultMeals(userId).catch(err => {
            console.warn("[useMenu] Vault fetch failed:", err.message);
            return [];
          }),
        ]);

        if (cancelled) return;

        const nonoList = profile?.nono_list ?? [];

        // ── Build the 5-day menu ──────────────────────────────────────────────
        const builtMenu = rawDeals.length > 0
          ? buildMenuFromDeals(rawDeals, vaultMeals, nonoList)
          : INITIAL_MENU;

        setDeals(rawDeals.length > 0 ? rawDeals : DEALS);
        setMenu(builtMenu);

      } catch (err) {
        if (cancelled) return;
        console.error("[useMenu] Load failed:", err);
        setError(err.message ?? "Failed to load menu data.");
        setDeals(DEALS);
        setMenu(INITIAL_MENU);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [userId]); // re-run if user changes (e.g. fast account switch)

  // ── Mutations ──────────────────────────────────────────────────────────────

  const updateHeadcount = useCallback((id, val) => {
    setMenu(prev => prev.map(m => m.id === id ? { ...m, headcount: val } : m));
  }, []);

  /**
   * Toggle a meal's saved-to-vault status.
   * Optimistic update → async Supabase write → rollback on error.
   * All writes scoped to userId (RLS + explicit filter).
   */
  const toggleSaved = useCallback(async (id) => {
    const snapshot = menu;
    const target   = menu.find(m => m.id === id);
    if (!target) return;

    const nowSaved = !target.isSaved;

    // ── Optimistic update ───────────────────────────────────────────────────
    setMenu(prev => prev.map(m => m.id === id ? { ...m, isSaved: nowSaved } : m));
    setSaveError(null);

    // ── Dev mode: no DB write ────────────────────────────────────────────────
    if (!SUPABASE_CONFIGURED) return;

    try {
      if (nowSaved) {
        // ── Upsert into saved_meals ──────────────────────────────────────────
        // buildVaultPayload sets user_id = userId (RLS compliant)
        const { error } = await supabase
          .from("saved_meals")
          .upsert(buildVaultPayload(userId, target), {
            onConflict:       "id",
            ignoreDuplicates: false,
          });

        if (error) throw error;

      } else {
        // ── Delete from saved_meals ──────────────────────────────────────────
        // ID format: `${userId}_${menuItemId}` — user-scoped by construction
        const { error } = await supabase
          .from("saved_meals")
          .delete()
          .eq("id",      `${userId}_${id}`)  // scoped to this user's row
          .eq("user_id", userId);             // belt-and-suspenders RLS guard

        if (error) throw error;
      }

    } catch (err) {
      console.error("[useMenu] toggleSaved failed:", err);
      setMenu(snapshot);
      setSaveError(
        `Couldn't ${nowSaved ? "save" : "unsave"} "${target.meal}". Please try again.`
      );
    }
  }, [menu, userId]);

  // ── Derived values (memoised) ─────────────────────────────────────────────

  const totalSaved = useMemo(
    () => menu.reduce((sum, m) => sum + (m.weekSaved ?? 0), 0),
    [menu]
  );

  const totalCost = useMemo(
    () => menu.reduce((sum, m) => sum + (m.costPerServing ?? 0) * (m.headcount ?? 4), 0),
    [menu]
  );

  const avgPerServing = useMemo(() => {
    const totalServings = menu.reduce((sum, m) => sum + (m.headcount ?? 4), 0);
    return totalServings > 0 ? totalCost / totalServings : 0;
  }, [menu, totalCost]);

  return {
    menu,
    deals,
    loading,
    error,
    saveError,
    weekRange: weekRangeRef.current,
    updateHeadcount,
    toggleSaved,
    totalSaved,
    totalCost,
    avgPerServing,
  };
}
