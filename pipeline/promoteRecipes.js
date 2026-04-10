// ─── promoteRecipes.js ────────────────────────────────────────────────────────
// Community Recipe Promotion Job
//
// Finds meals that have been saved by multiple different users and promotes
// them into the `community_recipes` table. This builds DinnerHack's own
// recipe database automatically from subscriber behavior — no manual curation.
//
// Promotion threshold: a meal saved by 3+ different users gets promoted.
// Already-promoted meals get their save_count updated so popular ones rank higher.
//
// Run weekly on Railway alongside scraper.js and fetchRecipes.js.
//
// Usage:
//   node promoteRecipes.js              # full run
//   node promoteRecipes.js --dry-run    # preview without writing
//   node promoteRecipes.js --threshold 2  # lower threshold for early growth
// ──────────────────────────────────────────────────────────────────────────────

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import logger from "./logger.js";

// ── Config ────────────────────────────────────────────────────────────────────

// How many unique users must save a meal before it gets promoted
const DEFAULT_THRESHOLD = 3;

// Ingredient keywords — same as menuBuilder.js RECIPE_DATABASE keys
const INGREDIENT_KEYS = [
  "chicken", "beef", "pork", "turkey",
  "fish", "salmon", "shrimp",
  "pasta", "tomato", "broccoli",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Determine the ingredient key for a meal based on its name and ingredients.
 * Mirrors the recipeKeyFor logic in menuBuilder.js.
 */
function ingredientKeyFor(mealName, ingredients = []) {
  const haystack = (mealName + " " + ingredients.join(" ")).toLowerCase();
  return INGREDIENT_KEYS.find(k => haystack.includes(k)) ?? "default";
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { dryRun: false, threshold: DEFAULT_THRESHOLD };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--dry-run") opts.dryRun = true;
    if (args[i] === "--threshold" && args[i + 1]) opts.threshold = Number(args[++i]);
  }
  return opts;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  const { dryRun, threshold } = parseArgs();
  const supabase = getSupabase();

  logger.info("[promoteRecipes] ── Community Recipe Promotion ──────────────────");
  logger.info("[promoteRecipes] Threshold: " + threshold + " unique users | Dry run: " + dryRun);

  // ── Step 1: Find popular meals from saved_meals ────────────────────────────
  // Fetch all saved meals and count unique users per meal name
  const { data: savedMeals, error: fetchError } = await supabase
    .from("saved_meals")
    .select("name, subtitle, emoji, prep_time, tags, ingredients, user_id");

  if (fetchError) {
    logger.error("[promoteRecipes] Failed to fetch saved_meals: " + fetchError.message);
    process.exitCode = 1;
    return;
  }

  logger.info("[promoteRecipes] Total saved meal rows: " + (savedMeals?.length ?? 0));

  // Group by meal name, count unique users
  const mealMap = {};
  for (const row of (savedMeals ?? [])) {
    const key = row.name.toLowerCase().trim();
    if (!mealMap[key]) {
      mealMap[key] = {
        name:        row.name,
        subtitle:    row.subtitle,
        emoji:       row.emoji,
        prep_time:   row.prep_time,
        tags:        row.tags ?? [],
        ingredients: row.ingredients ?? [],
        users:       new Set(),
      };
    }
    mealMap[key].users.add(row.user_id);
  }

  // Filter to meals that hit the threshold
  const candidates = Object.values(mealMap)
    .filter(m => m.users.size >= threshold)
    .map(m => ({
      meal:            m.name,
      subtitle:        m.subtitle ?? null,
      emoji:           m.emoji ?? "🍽️",
      prep_time:       m.prep_time ?? "30 min",
      tags:            m.tags,
      ingredient_key:  ingredientKeyFor(m.name, m.ingredients),
      save_count:      m.users.size,
      last_promoted:   new Date().toISOString().slice(0, 10),
    }));

  logger.info("[promoteRecipes] Meals hitting threshold (" + threshold + "+ users): " + candidates.length);

  if (candidates.length === 0) {
    logger.info("[promoteRecipes] Nothing to promote yet — keep growing your subscriber base!");
    return;
  }

  // ── Step 2: Log what would be promoted ────────────────────────────────────
  for (const c of candidates) {
    logger.info("[promoteRecipes]   " + c.emoji + " " + c.meal + " — saved by " + c.save_count + " users (" + c.ingredient_key + ")");
  }

  if (dryRun) {
    logger.info("[promoteRecipes] DRY RUN — no DB write");
    return;
  }

  // ── Step 3: Upsert to community_recipes ───────────────────────────────────
  const { error: upsertError } = await supabase
    .from("community_recipes")
    .upsert(candidates, {
      onConflict:       "meal",       // meal name is the unique key
      ignoreDuplicates: false,        // update save_count when already promoted
    });

  if (upsertError) {
    logger.error("[promoteRecipes] Upsert failed: " + upsertError.message);
    process.exitCode = 1;
    return;
  }

  logger.info("[promoteRecipes] Promoted " + candidates.length + " meals to community_recipes");
  logger.info("[promoteRecipes] ── Done ──────────────────────────────────────────");
}

run();
