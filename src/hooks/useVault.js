// ─── useVault.js ──────────────────────────────────────────────────────────────
// Owns recipe vault state: saved meals list + search filtering.
//
// TODO (Supabase migration):
//   1. Fetch saved_meals from supabase.from("saved_meals").select("*")
//      .eq("user_id", user.id).order("date_saved", { ascending: false })
//   2. deleteMeal → supabase.from("saved_meals").delete().eq("id", id)
//   3. cookAgain  → supabase.from("saved_meals").update({ cooked_count: cooked + 1 })

import { useState, useMemo } from "react";
import { VAULT_MEALS } from "../data/mockData";

export function useVault() {
  const [meals, setMeals]   = useState(VAULT_MEALS);
  const [search, setSearch] = useState("");

  const filteredMeals = useMemo(
    () => meals.filter(m =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    ),
    [meals, search]
  );

  const deleteMeal = (id) =>
    setMeals(prev => prev.filter(m => m.id !== id));

  const cookAgain = (id) =>
    setMeals(prev =>
      prev.map(m => m.id === id ? { ...m, cooked: m.cooked + 1 } : m)
    );

  return { meals: filteredMeals, totalCount: meals.length, search, setSearch, deleteMeal, cookAgain };
}
