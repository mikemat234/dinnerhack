// ─── useGrocery.js ────────────────────────────────────────────────────────────
// Owns grocery list state: pantry check, item removal, and cart-push status.
//
// TODO (Supabase migration):
//   1. Fetch grocery_items from supabase.from("grocery_items").select(...)
//      filtered by the current week's menu_id
//   2. Persist pantry selections per user in a "pantry_cache" table so they
//      don't re-check the same items every week

import { useState, useMemo } from "react";
import { GROCERY_ITEMS, PANTRY_STAPLES } from "../data/mockData";

export function useGrocery() {
  const [pantryChecked, setPantryChecked] = useState(new Set());
  const [removedIds, setRemovedIds]       = useState(new Set());
  const [cartSentTo, setCartSentTo]       = useState(null); // "instacart" | "walmart" | null

  const togglePantry = (item) =>
    setPantryChecked(prev => {
      const next = new Set(prev);
      next.has(item) ? next.delete(item) : next.add(item);
      return next;
    });

  const removeItem = (id) =>
    setRemovedIds(prev => new Set([...prev, id]));

  const visibleItems = useMemo(
    () => GROCERY_ITEMS.filter(i => !removedIds.has(i.id)),
    [removedIds]
  );

  const totalPrice = useMemo(
    () => visibleItems.reduce((sum, i) => sum + i.price, 0),
    [visibleItems]
  );

  const sendToCart = (provider) => setCartSentTo(provider);

  return {
    pantryStaples: PANTRY_STAPLES,
    pantryChecked,
    togglePantry,
    visibleItems,
    removedIds,
    removeItem,
    totalPrice,
    cartSentTo,
    sendToCart,
  };
}
