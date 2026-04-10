// ─── seedDeals.js ─────────────────────────────────────────────────────────────
// Manually insert test deals for the current week.
// Run this when the scraper hasn't populated the deals table yet.
//
// Usage:
//   node seedDeals.js
// ──────────────────────────────────────────────────────────────────────────────

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { currentWeekOf } from "./transform.js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

const weekOf = currentWeekOf();
console.log("Seeding deals for week:", weekOf);

const deals = [
  { id: "seed_chicken_" + weekOf,  store: "Aldi",        item: "Chicken Thighs Family Pack", orig: 8.99,  sale: 3.99,  unit: "/lb",  pct: 56, emoji: "🍗", category: "Meat",    week_of: weekOf },
  { id: "seed_beef_" + weekOf,     store: "Giant Eagle", item: "Ground Beef 80/20",           orig: 7.49,  sale: 3.49,  unit: "/lb",  pct: 53, emoji: "🥩", category: "Meat",    week_of: weekOf },
  { id: "seed_salmon_" + weekOf,   store: "Aldi",        item: "Atlantic Salmon Fillet",      orig: 12.99, sale: 5.99,  unit: "/lb",  pct: 54, emoji: "🐟", category: "Seafood", week_of: weekOf },
  { id: "seed_pork_" + weekOf,     store: "Giant Eagle", item: "Pork Shoulder Roast",         orig: 5.99,  sale: 2.49,  unit: "/lb",  pct: 58, emoji: "🥩", category: "Meat",    week_of: weekOf },
  { id: "seed_shrimp_" + weekOf,   store: "Aldi",        item: "Raw Shrimp 16/20 ct",         orig: 14.99, sale: 6.99,  unit: "/lb",  pct: 53, emoji: "🦐", category: "Seafood", week_of: weekOf },
];

const { error, count } = await supabase
  .from("deals")
  .upsert(deals, { onConflict: "id", ignoreDuplicates: true, count: "exact" });

if (error) {
  console.error("Error seeding deals:", error.message);
  process.exitCode = 1;
} else {
  console.log("Done! Seeded", deals.length, "deals for week", weekOf);
  console.log("Refresh www.dinnerhack.app to see them in action.");
}
