-- ─── recipes-table.sql ────────────────────────────────────────────────────────
-- Run this in your Supabase SQL Editor (project → SQL Editor → New query).
--
-- Creates the `recipes` table that stores Spoonacular recipe data, fetched
-- weekly by pipeline/fetchRecipes.js and served to the DinnerHack frontend
-- as recipe options for each deal ingredient.
--
-- After creating the table:
--   1. Add SPOONACULAR_API_KEY to your Railway env vars
--   2. Run `node pipeline/fetchRecipes.js` once to seed the table
--   3. Add fetchRecipes.js to your Railway cron (weekly, after scraper.js)
-- ──────────────────────────────────────────────────────────────────────────────

-- ── Main recipes table ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS recipes (
  id              BIGSERIAL      PRIMARY KEY,

  -- Spoonacular source data
  spoonacular_id  INTEGER        UNIQUE NOT NULL,  -- Spoonacular recipe ID (dedup key)
  source_url      TEXT,                            -- full recipe URL on source site
  image_url       TEXT,                            -- recipe photo from Spoonacular

  -- Display fields (shown in DayCard + RecipePreview)
  ingredient_key  TEXT           NOT NULL,         -- 'chicken', 'beef', 'salmon', etc.
  meal            TEXT           NOT NULL,         -- recipe title, e.g. "Garlic Lemon Chicken"
  subtitle        TEXT,                            -- "with garlic, lemon, broccoli"
  emoji           TEXT           NOT NULL DEFAULT '🍽️',
  prep_time       TEXT           NOT NULL DEFAULT '30 min',  -- e.g. "25 min" or "1 hr"
  tags            TEXT[]         NOT NULL DEFAULT '{}',       -- ["Quick", "Vegetarian", …]
  servings        INTEGER        NOT NULL DEFAULT 4,

  -- Freshness tracking
  week_of         DATE           NOT NULL,         -- ISO week this recipe was fetched for
  fetched_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

-- Primary lookup: "give me all chicken recipes for this week"
CREATE INDEX IF NOT EXISTS idx_recipes_ingredient_week
  ON recipes (ingredient_key, week_of);

-- Secondary: quick lookup by ingredient alone (for fallback queries)
CREATE INDEX IF NOT EXISTS idx_recipes_ingredient_key
  ON recipes (ingredient_key);

-- ── RLS (Row Level Security) ──────────────────────────────────────────────────
-- Recipes are public read — no user_id needed.
-- Writes are restricted to the service role (pipeline only).

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anonymous users) to SELECT
CREATE POLICY "recipes_public_read"
  ON recipes FOR SELECT
  USING (true);

-- Only the service role can INSERT/UPDATE/DELETE (pipeline uses service key)
-- No INSERT/UPDATE/DELETE policy needed — service role bypasses RLS by default.

-- ── Verification query ────────────────────────────────────────────────────────
-- After running fetchRecipes.js, use this to check the table is populated:
--
-- SELECT ingredient_key, count(*) AS recipes, max(fetched_at) AS last_fetched
-- FROM recipes
-- GROUP BY ingredient_key
-- ORDER BY ingredient_key;
