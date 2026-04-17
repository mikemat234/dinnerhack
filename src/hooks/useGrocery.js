// ─── useGrocery.js ────────────────────────────────────────────────────────────
// Derives grocery list from the real weekly menu deals.
// Also manages custom items the user adds manually (persisted to Supabase).
//
// Sections:
//   1. Deal Items   — one entry per menu day's deal, from live Supabase data
//   2. Pantry Check — common staples the user ticks off if needed
//   3. Custom Items — user-added extras (e.g. "Open Pit BBQ Sauce")
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useMemo, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export const PANTRY_STAPLES = [
  "Olive oil", "Vegetable oil", "Garlic", "Onion",
  "Salt & pepper", "Butter", "Chicken broth",
  "Soy sauce", "Flour", "Sugar",
  "Canned tomatoes", "Dried pasta", "White rice",
  "Bread crumbs", "Hot sauce",
];

/**
 * Derive a clean list of grocery items from the live menu.
 * One item per day that has a real deal attached.
 */
function dealItemsFromMenu(menu = []) {
  const seen = new Set();
  const items = [];

  for (const day of menu) {
    if (!day?.deal) continue;
    const { deal } = day;
    const key = deal.id ?? deal.item;
    if (seen.has(key)) continue;
    seen.add(key);

    items.push({
      id:    key,
      item:  deal.item,
      store: deal.store,
      price: deal.sale ?? 0,
      emoji: deal.emoji ?? "🏷️",
      unit:  deal.unit ?? "/ea",
      day:   day.day,
    });
  }

  return items;
}

export function useGrocery(menu = [], userId = null) {
  const [pantryChecked, setPantryChecked] = useState(new Set());
  const [removedIds,    setRemovedIds]    = useState(new Set());
  const [customItems,   setCustomItems]   = useState([]);  // { id, text, checked }
  const [customInput,   setCustomInput]   = useState("");
  const [copied,        setCopied]        = useState(false);

  // ── Load custom items from Supabase on mount ──────────────────────────────
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("profiles")
      .select("custom_grocery_items")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        if (data?.custom_grocery_items?.length) {
          setCustomItems(data.custom_grocery_items);
        }
      });
  }, [userId]);

  // ── Persist custom items to Supabase ─────────────────────────────────────
  const persistCustomItems = useCallback(async (items) => {
    if (!userId) return;
    await supabase
      .from("profiles")
      .update({ custom_grocery_items: items })
      .eq("id", userId);
  }, [userId]);

  // ── Deal items from real menu ─────────────────────────────────────────────
  const dealItems = useMemo(() => dealItemsFromMenu(menu), [menu]);

  const visibleItems = useMemo(
    () => dealItems.filter(i => !removedIds.has(i.id)),
    [dealItems, removedIds]
  );

  const totalPrice = useMemo(
    () => visibleItems.reduce((sum, i) => sum + i.price, 0),
    [visibleItems]
  );

  // ── Pantry helpers ────────────────────────────────────────────────────────
  const togglePantry = (item) =>
    setPantryChecked(prev => {
      const next = new Set(prev);
      next.has(item) ? next.delete(item) : next.add(item);
      return next;
    });

  // ── Remove deal item ──────────────────────────────────────────────────────
  const removeItem = (id) => setRemovedIds(prev => new Set([...prev, id]));

  // ── Custom items ──────────────────────────────────────────────────────────
  const addCustomItem = () => {
    const text = customInput.trim();
    if (!text) return;
    const newItem = { id: `custom-${Date.now()}`, text, checked: false };
    const updated = [...customItems, newItem];
    setCustomItems(updated);
    setCustomInput("");
    persistCustomItems(updated);
  };

  const toggleCustomItem = (id) => {
    const updated = customItems.map(i =>
      i.id === id ? { ...i, checked: !i.checked } : i
    );
    setCustomItems(updated);
    persistCustomItems(updated);
  };

  const removeCustomItem = (id) => {
    const updated = customItems.filter(i => i.id !== id);
    setCustomItems(updated);
    persistCustomItems(updated);
  };

  // ── Copy shopping list to clipboard ──────────────────────────────────────
  const copyShoppingList = () => {
    const lines = ["🛒 DinnerHack Shopping List", ""];

    // Group deal items by store
    const byStore = {};
    for (const item of visibleItems) {
      if (!byStore[item.store]) byStore[item.store] = [];
      byStore[item.store].push(item);
    }
    for (const [store, items] of Object.entries(byStore)) {
      lines.push(`📍 ${store}`);
      for (const item of items) {
        lines.push(`  ${item.emoji} ${item.item} — $${item.price.toFixed(2)}${item.unit}`);
      }
      lines.push("");
    }

    // Custom items
    const uncheckedCustom = customItems.filter(i => !i.checked);
    if (uncheckedCustom.length) {
      lines.push("➕ Added Items");
      for (const item of uncheckedCustom) {
        lines.push(`  • ${item.text}`);
      }
      lines.push("");
    }

    lines.push("(Check your recipe for the full ingredient list)");

    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return {
    pantryStaples:    PANTRY_STAPLES,
    pantryChecked,
    togglePantry,
    visibleItems,
    removeItem,
    totalPrice,
    customItems,
    customInput,
    setCustomInput,
    addCustomItem,
    toggleCustomItem,
    removeCustomItem,
    copyShoppingList,
    copied,
  };
}
