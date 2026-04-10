// ─── fetchRecipes.js ───────────────────────────────────────────────────────────
// Spoonacular → Supabase recipe population script.
//
// Runs weekly on Railway (alongside scraper.js) to keep the `recipes` table
// fresh with real, rated recipe options keyed to each deal ingredient.
//
// What it does:
//   1. For each ingredient key (chicken, beef, pork, …), calls Spoonacular
//      findByIngredients to get the top 6 recipe candidates.
//   2. Fetches full recipeInformation for each candidate (title, readyInMinutes,
//      sourceUrl, diets, extendedIngredients).
//   3. Upserts the results into the Supabase `recipes` table, keyed by
//      spoonacular_id so re-runs are safe and idempotent.
//
// Usage:
//   node fetchRecipes.js               # full run
//   node fetchRecipes.js --dry-run     # fetch only, no DB write
//   node fetchRecipes.js --ingredient chicken   # run one ingredient only
//
// Required env vars (in .env):
//   SUPABASE_URL
//   SUPABASE_SERVICE_KEY
//   SPOONACULAR_API_KEY=e56f147ec621495eb8a89586a95261ca
// ──────────────────────────────────────────────────────────────────────────────

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import logger           from "./logger.js";
import { currentWeekOf } from "./transform.js";

// ── Config ────────────────────────────────────────────────────────────────────

const SPOONACULAR_KEY  = process.env.SPOONACULAR_API_KEY;
const SPOONACULAR_BASE = "https://api.spoonacular.com";

// How many recipe options to fetch per ingredient (controls Regenerate variety)
const RECIPES_PER_INGREDIENT = 6;

// ms to wait between Spoonacular API calls (free tier: 150 req/day)
const CALL_DELAY_MS = 300;

// All ingredient keys we track — must match RECIPE_DATABASE keys in menuBuilder.js
const ALL_INGREDIENT_KEYS = [
  "chicken", "beef", "pork", "turkey",
  "fish", "salmon", "shrimp",
  "pasta", "tomato", "broccoli",
];

// Emoji per ingredient (consistent with the rest of the app)
const INGREDIENT_EMOJI = {
  chicken:  "🍗",
  beef:     "🥩",
  pork:     "🥩",
  turkey:   "🦃",
  fish:     "🐟",
  salmon:   "🐟",
  shrimp:   "🦐",
  pasta:    "🍝",
  tomato:   "🍅",
  broccoli: "🥦",
};

// ── Supabase client ───────────────────────────────────────────────────────────

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY. Copy .env.example to .env."
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

// ── Spoonacular API helpers ───────────────────────────────────────────────────

/**
 * GET /recipes/findByIngredients
 * Returns the top N recipes that use the given ingredient.
 */
async function findByIngredient(ingredient, number) {
  const url =
    SPOONACULAR_BASE + "/recipes/findByIngredients" +
    "?ingredients=" + encodeURIComponent(ingredient) +
    "&number=" + number +
    "&ranking=2" +          // maximize used ingredients
    "&ignorePantry=true" +
    "&apiKey=" + SPOONACULAR_KEY;

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error("findByIngredients HTTP " + res.status + ": " + body.slice(0, 120));
  }
  return await res.json(); // array of { id, title, image, usedIngredients, ... }
}

/**
 * GET /recipes/{id}/information
 * Returns full metadata: readyInMinutes, sourceUrl, servings, diets, dishTypes,
 * extendedIngredients, etc.
 */
async function getRecipeInfo(id) {
  const url =
    SPOONACULAR_BASE + "/recipes/" + id + "/information" +
    "?includeNutrition=false" +
    "&apiKey=" + SPOONACULAR_KEY;

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error("recipeInformation HTTP " + res.status + ": " + body.slice(0, 120));
  }
  return await res.json();
}

// ── Transformation helpers ────────────────────────────────────────────────────

/**
 * Build a human-readable subtitle from the recipe's extended ingredients.
 * e.g. "with garlic, lemon, broccoli"
 */
function buildSubtitle(info) {
  const SKIP = new Set(["water", "salt", "pepper", "oil", "butter", "flour", "sugar"]);
  const ingredients = (info.extendedIngredients ?? [])
    .map(i => (i.nameClean ?? i.name ?? "").toLowerCase())
    .filter(n => n.length > 2 && !SKIP.has(n))
    .slice(0, 3);

  if (ingredients.length === 0) return "Full recipe with ingredients & instructions";
  return "with " + ingredients.join(", ");
}

/**
 * Build a short tags array from Spoonacular's diet/dish data.
 * Keeps the same tag vocabulary used in the static RECIPE_DATABASE.
 */
function buildTags(info) {
  const tags = [];
  const diets     = (info.diets      ?? []).map(d => d.toLowerCase());
  const dishTypes = (info.dishTypes  ?? []).map(d => d.toLowerCase());
  const mins      = info.readyInMinutes ?? 60;

  if (mins <= 30)                          tags.push("Quick");
  if (diets.includes("vegetarian"))        tags.push("Vegetarian");
  if (diets.includes("gluten free"))       tags.push("Gluten Free");
  if (diets.includes("ketogenic"))         tags.push("Keto");
  if (diets.includes("dairy free"))        tags.push("Dairy Free");
  if ((info.servings ?? 4) >= 6)           tags.push("Family Favorite");
  if (dishTypes.includes("soup"))          tags.push("Comfort Food");
  if (dishTypes.includes("salad"))         tags.push("Light");

  // Always include at least one tag
  if (tags.length === 0) tags.push("Dinner");

  return tags.slice(0, 3);
}

/** Format readyInMinutes into a human string like "25 min" or "1 hr 15 min". */
function formatPrepTime(minutes) {
  if (!minutes) return "30 min";
  if (minutes < 60) return minutes + " min";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? h + " hr " + m + " min" : h + " hr";
}

// ── Core fetch loop ───────────────────────────────────────────────────────────

/**
 * Fetch and transform all recipes for one ingredient key.
 * Returns an array of recipe objects ready for Supabase upsert.
 */
async function fetchForIngredient(ingredient, weekOf) {
  logger.info("[fetchRecipes]   Fetching " + RECIPES_PER_INGREDIENT + " recipes for: " + ingredient);

  const candidates = await findByIngredient(ingredient, RECIPES_PER_INGREDIENT);
  logger.info("[fetchRecipes]   Got " + candidates.length + " candidates from Spoonacular");

  const recipes = [];

  for (const c of candidates) {
    try {
      await delay(CALL_DELAY_MS);
      const info = await getRecipeInfo(c.id);

      recipes.push({
        spoonacular_id: c.id,
        ingredient_key: ingredient,
        meal:           info.title,
        subtitle:       buildSubtitle(info),
        emoji:          INGREDIENT_EMOJI[ingredient] ?? "🍽️",
        prep_time:      formatPrepTime(info.readyInMinutes),
        tags:           buildTags(info),
        source_url:     info.sourceUrl ?? null,
        image_url:      info.image     ?? null,
        servings:       info.servings  ?? 4,
        week_of:        weekOf,
      });

      logger.info("[fetchRecipes]   + " + info.title + " (" + (info.readyInMinutes ?? "?") + " min)");
    } catch (err) {
      logger.warn("[fetchRecipes]   ! Skipping recipe " + c.id + ": " + err.message);
    }
  }

  return recipes;
}

// ── CLI arg parsing ───────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    dryRun:      false,
    ingredients: [...ALL_INGREDIENT_KEYS],
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--dry-run") {
      opts.dryRun = true;
    }
    if (args[i] === "--ingredient" && args[i + 1]) {
      opts.ingredients = [args[++i].toLowerCase()];
    }
  }

  return opts;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  const { dryRun, ingredients } = parseArgs();
  const weekOf = currentWeekOf();

  if (!SPOONACULAR_KEY) {
    logger.error("[fetchRecipes] SPOONACULAR_API_KEY is not set in .env");
    process.exitCode = 1;
    return;
  }

  logger.info("[fetchRecipes] ── DinnerHack Recipe Fetcher ──────────────────");
  logger.info("[fetchRecipes] Week of: " + weekOf + " | Ingredients: " + ingredients.join(", "));
  if (dryRun) logger.info("[fetchRecipes] DRY RUN — DB write skipped");

  const supabase = dryRun ? null : getSupabase();

  let totalInserted = 0;
  let totalErrors   = 0;

  for (const ingredient of ingredients) {
    try {
      const recipes = await fetchForIngredient(ingredient, weekOf);

      if (dryRun) {
        logger.info("[fetchRecipes] DRY RUN: would upsert " + recipes.length + " recipes for " + ingredient);
        recipes.forEach(r => logger.info("  - " + r.meal + " (" + r.prep_time + ")"));
      } else {
        const { error } = await supabase
          .from("recipes")
          .upsert(recipes, {
            onConflict:       "spoonacular_id",
            ignoreDuplicates: false, // update if week_of changed
          });

        if (error) {
          logger.error("[fetchRecipes] Upsert error for " + ingredient + ": " + error.message);
          totalErrors += recipes.length;
        } else {
          logger.info("[fetchRecipes] Upserted " + recipes.length + " recipes for " + ingredient);
          totalInserted += recipes.length;
        }
      }

      // Respect Spoonacular's rate limit between ingredients
      await delay(500);

    } catch (err) {
      logger.error("[fetchRecipes] Failed for ingredient '" + ingredient + "': " + err.message);
      totalErrors++;
    }
  }

  logger.info("[fetchRecipes] ── Done: " + totalInserted + " inserted, " + totalErrors + " errors ──");

  if (totalErrors > 0) process.exitCode = 1;
}

run();
