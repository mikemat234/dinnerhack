// ─── menuBuilder.js ────────────────────────────────────────────────────────────
// Pure, side-effect-free functions that transform raw Supabase data into a
// 5-day menu. Kept separate from the hook so they are independently testable.
//
// Call graph:
//   buildMenuFromDeals(deals, vaultMeals, nonoList)
//     └─ filterByNonoList(meals, nonoList)
//     └─ scoreRecipeAgainstDeal(recipe, deal)     ← core scoring
//     └─ dedupeByName(scoredItems)
//     └─ syntheticMealFor(deal, dayIndex)         ← fallback when vault is sparse
// ──────────────────────────────────────────────────────────────────────────────

// ── Constants ──────────────────────────────────────────────────────────────────

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// ── Recipe Database ────────────────────────────────────────────────────────────
// Each ingredient key maps to an array of real recipe options.
// URLs use AllRecipes anchors (#recipe-body, #recipe-ingredients) to skip
// straight to the recipe content and minimise blog fluff in the preview.
// Multiple options per ingredient enable the Regenerate feature.
export const RECIPE_DATABASE = {
  chicken: [
    { meal: "Garlic Lemon Chicken Thighs",     subtitle: "with Roasted Broccoli & Steamed Rice",       emoji: "🍗", prepTime: "35 min", tags: ["High Protein", "Quick"],           recipeUrl: "https://www.allrecipes.com/search?q=garlic+lemon+chicken+thighs" },
    { meal: "Baked BBQ Chicken Thighs",         subtitle: "with Coleslaw & Cornbread",                  emoji: "🍗", prepTime: "45 min", tags: ["Family Favorite", "Easy"],         recipeUrl: "https://www.allrecipes.com/search?q=baked+bbq+chicken+thighs" },
    { meal: "Chicken Thigh Stir Fry",           subtitle: "with Bell Peppers, Rice & Soy Glaze",        emoji: "🍗", prepTime: "25 min", tags: ["Quick", "Kid Friendly"],           recipeUrl: "https://www.allrecipes.com/search?q=chicken+thigh+stir+fry" },
    { meal: "Creamy Tuscan Chicken",            subtitle: "with Sun-Dried Tomatoes & Spinach",          emoji: "🍗", prepTime: "30 min", tags: ["Date Night", "Comfort Food"],      recipeUrl: "https://www.allrecipes.com/search?q=creamy+tuscan+chicken" },
    { meal: "Chicken Tortilla Soup",            subtitle: "with Avocado, Cheese & Lime",                emoji: "🍲", prepTime: "35 min", tags: ["Meal Prep", "Freezer Friendly"],   recipeUrl: "https://www.allrecipes.com/search?q=chicken+tortilla+soup" },
  ],
  beef: [
    { meal: "Classic Beef Bolognese",           subtitle: "with Penne Pasta & Parmesan",                emoji: "🍝", prepTime: "45 min", tags: ["Comfort Food", "Family Favorite"], recipeUrl: "https://www.allrecipes.com/search?q=beef+bolognese+sauce" },
    { meal: "Beef & Broccoli Stir Fry",         subtitle: "with White Rice & Sesame Sauce",             emoji: "🥦", prepTime: "25 min", tags: ["Quick", "Kid Friendly"],           recipeUrl: "https://www.allrecipes.com/search?q=beef+and+broccoli+stir+fry" },
    { meal: "Beef Taco Bowls",                  subtitle: "with Pico de Gallo, Rice & Guacamole",       emoji: "🌮", prepTime: "20 min", tags: ["Quick", "Crowd Pleaser"],          recipeUrl: "https://www.allrecipes.com/search?q=beef+taco+bowls" },
    { meal: "Classic Meatloaf",                 subtitle: "with Mashed Potatoes & Green Beans",         emoji: "🍖", prepTime: "1 hr",   tags: ["Comfort Food", "Meal Prep"],       recipeUrl: "https://www.allrecipes.com/search?q=classic+meatloaf" },
    { meal: "Beef Stuffed Peppers",             subtitle: "with Rice, Tomato Sauce & Mozzarella",       emoji: "🫑", prepTime: "50 min", tags: ["Low Carb", "Meal Prep"],           recipeUrl: "https://www.allrecipes.com/search?q=beef+stuffed+peppers" },
  ],
  pork: [
    { meal: "Slow-Cooker Pulled Pork Bowls",    subtitle: "with Cabbage Slaw & White Rice",             emoji: "🫙", prepTime: "20 min active", tags: ["Meal Prep", "Freezer Friendly"], recipeUrl: "https://www.allrecipes.com/search?q=slow+cooker+pulled+pork" },
    { meal: "Pork Chops with Apple Sauce",      subtitle: "with Roasted Sweet Potatoes",                emoji: "🥩", prepTime: "30 min", tags: ["Easy", "Family Favorite"],         recipeUrl: "https://www.allrecipes.com/search?q=pork+chops+with+apple+sauce" },
    { meal: "Pork Fried Rice",                  subtitle: "with Eggs, Peas & Soy Sauce",                emoji: "🍳", prepTime: "20 min", tags: ["Quick", "Kid Friendly"],           recipeUrl: "https://www.allrecipes.com/search?q=pork+fried+rice" },
    { meal: "Honey Garlic Pork Tenderloin",     subtitle: "with Roasted Asparagus & Mashed Potatoes",   emoji: "🥩", prepTime: "35 min", tags: ["Date Night", "Quick"],             recipeUrl: "https://www.allrecipes.com/search?q=honey+garlic+pork+tenderloin" },
  ],
  turkey: [
    { meal: "Turkey & Vegetable Skillet",       subtitle: "with Garlic Rice & Fresh Herbs",             emoji: "🦃", prepTime: "30 min", tags: ["Lean", "Quick"],                   recipeUrl: "https://www.allrecipes.com/search?q=turkey+vegetable+skillet" },
    { meal: "Turkey Taco Lettuce Wraps",        subtitle: "with Pico de Gallo & Lime Crema",            emoji: "🥬", prepTime: "20 min", tags: ["Low Carb", "Quick"],               recipeUrl: "https://www.allrecipes.com/search?q=turkey+taco+lettuce+wraps" },
    { meal: "Turkey Meatball Soup",             subtitle: "with Spinach, Pasta & Parmesan",             emoji: "🍲", prepTime: "40 min", tags: ["Comfort Food", "Meal Prep"],       recipeUrl: "https://www.allrecipes.com/search?q=turkey+meatball+soup" },
  ],
  fish: [
    { meal: "Baked Lemon Herb Fish Fillets",    subtitle: "with Roasted Potatoes & Green Beans",        emoji: "🐟", prepTime: "30 min", tags: ["Light", "High Protein"],           recipeUrl: "https://www.allrecipes.com/search?q=baked+lemon+herb+fish+fillets" },
    { meal: "Fish Tacos",                       subtitle: "with Cabbage Slaw, Lime & Chipotle Sauce",   emoji: "🌮", prepTime: "25 min", tags: ["Quick", "Crowd Pleaser"],          recipeUrl: "https://www.allrecipes.com/search?q=baja+fish+tacos" },
    { meal: "Pan-Fried Fish with Tartar Sauce", subtitle: "with French Fries & Coleslaw",               emoji: "🐟", prepTime: "30 min", tags: ["Family Favorite", "Comfort Food"], recipeUrl: "https://www.allrecipes.com/search?q=pan+fried+fish+tartar+sauce" },
  ],
  salmon: [
    { meal: "Pan-Seared Salmon",                subtitle: "with Garlic Butter Rice & Asparagus",        emoji: "🐟", prepTime: "25 min", tags: ["High Protein", "Omega-3"],         recipeUrl: "https://www.allrecipes.com/search?q=pan+seared+salmon" },
    { meal: "Honey Glazed Salmon",              subtitle: "with Roasted Broccoli & Brown Rice",         emoji: "🐟", prepTime: "20 min", tags: ["Quick", "Healthy"],                recipeUrl: "https://www.allrecipes.com/search?q=honey+garlic+glazed+salmon" },
    { meal: "Baked Salmon with Lemon Dill",     subtitle: "with Wild Rice & Steamed Vegetables",        emoji: "🐟", prepTime: "30 min", tags: ["Light", "Date Night"],             recipeUrl: "https://www.allrecipes.com/search?q=baked+salmon+lemon+dill" },
  ],
  shrimp: [
    { meal: "Garlic Butter Shrimp Pasta",       subtitle: "with Linguine & Parsley",                    emoji: "🍝", prepTime: "20 min", tags: ["Quick", "Date Night"],             recipeUrl: "https://www.allrecipes.com/search?q=garlic+butter+shrimp+pasta" },
    { meal: "Shrimp Tacos",                     subtitle: "with Avocado, Cilantro & Lime",              emoji: "🌮", prepTime: "20 min", tags: ["Quick", "Crowd Pleaser"],          recipeUrl: "https://www.allrecipes.com/search?q=shrimp+tacos+avocado" },
    { meal: "Shrimp Fried Rice",                subtitle: "with Eggs, Peas & Green Onion",              emoji: "🍳", prepTime: "25 min", tags: ["Quick", "Kid Friendly"],           recipeUrl: "https://www.allrecipes.com/search?q=shrimp+fried+rice" },
  ],
  pasta: [
    { meal: "Tomato Cream Pasta",               subtitle: "with Crushed Tomatoes & Fresh Basil",        emoji: "🍝", prepTime: "25 min", tags: ["Vegetarian", "Comfort Food"],      recipeUrl: "https://www.allrecipes.com/search?q=tomato+cream+pasta" },
    { meal: "Cacio e Pepe",                     subtitle: "with Pecorino Romano & Black Pepper",        emoji: "🍝", prepTime: "20 min", tags: ["Quick", "Date Night"],             recipeUrl: "https://www.allrecipes.com/search?q=cacio+e+pepe+pasta" },
    { meal: "Baked Ziti",                       subtitle: "with Ricotta, Mozzarella & Marinara",        emoji: "🫙", prepTime: "50 min", tags: ["Comfort Food", "Freezer Friendly"], recipeUrl: "https://www.allrecipes.com/search?q=baked+ziti" },
  ],
  tomato: [
    { meal: "Tomato Chicken Skillet",           subtitle: "with Crushed Tomatoes, Herbs & Crusty Bread",emoji: "🍅", prepTime: "30 min", tags: ["One Pan", "Quick"],               recipeUrl: "https://www.allrecipes.com/search?q=tomato+chicken+skillet" },
    { meal: "Classic Tomato Soup",              subtitle: "with Grilled Cheese on the Side",            emoji: "🍅", prepTime: "30 min", tags: ["Comfort Food", "Vegetarian"],      recipeUrl: "https://www.allrecipes.com/search?q=classic+tomato+basil+soup" },
    { meal: "Shakshuka",                        subtitle: "with Eggs Poached in Spiced Tomato Sauce",   emoji: "🍳", prepTime: "25 min", tags: ["Vegetarian", "Brunch"],            recipeUrl: "https://www.allrecipes.com/search?q=shakshuka+eggs+tomato" },
  ],
  broccoli: [
    { meal: "Beef & Broccoli Stir Fry",         subtitle: "with White Rice & Sesame Sauce",             emoji: "🥦", prepTime: "25 min", tags: ["Quick", "Kid Friendly"],           recipeUrl: "https://www.allrecipes.com/search?q=beef+and+broccoli+stir+fry" },
    { meal: "Broccoli Cheddar Soup",            subtitle: "with Crusty Bread for Dipping",              emoji: "🫕", prepTime: "35 min", tags: ["Comfort Food", "Vegetarian"],      recipeUrl: "https://www.allrecipes.com/search?q=broccoli+cheddar+soup" },
    { meal: "Roasted Broccoli Pasta",           subtitle: "with Garlic, Lemon & Parmesan",              emoji: "🍝", prepTime: "30 min", tags: ["Vegetarian", "Quick"],             recipeUrl: "https://www.allrecipes.com/search?q=roasted+broccoli+pasta+garlic+parmesan" },
  ],
  default: [
    { meal: "Sheet Pan Dinner",                 subtitle: "with This Week's Best Deals",                emoji: "🍽️", prepTime: "40 min", tags: ["Easy", "One Pan"],                recipeUrl: "https://www.allrecipes.com/search?q=sheet+pan+dinner" },
    { meal: "One-Pot Rice Bowl",                subtitle: "with Seasoned Protein & Vegetables",         emoji: "🍚", prepTime: "30 min", tags: ["Easy", "Meal Prep"],               recipeUrl: "https://www.allrecipes.com/search?q=one+pot+rice+bowl" },
  ],
};

// Points awarded when a deal ingredient appears as a PRIMARY PROTEIN in a recipe.
// Primary proteins are the centre of the meal (chicken, beef, pork…).
// We award more points here because it maximises savings on the most expensive
// part of the meal.
const PROTEIN_SCORE    = 10;
const INGREDIENT_SCORE = 5;   // deal appears in name/ingredients but not a protein
const TAG_SCORE        = 2;   // deal keyword appears in a recipe tag

// Assumed pounds of primary protein used per meal (for savings calculation)
const ASSUMED_QTY_LBS  = 1.5;

// Estimated cost of pantry staples per serving (oil, garlic, rice, herbs…)
const PANTRY_COST_PER_SERVING = 0.65;

const PROTEIN_KEYWORDS = [
  "chicken", "beef", "pork", "turkey", "lamb",
  "fish", "salmon", "tuna", "tilapia", "shrimp", "ground",
];

// Meal templates used when the vault doesn't have a recipe for a given deal.
// Keyed by a keyword found in the deal's item name.
const MEAL_TEMPLATES = {
  chicken: { meal: "Garlic Herb Chicken Thighs",      subtitle: "with Roasted Broccoli & Steamed Rice",        tags: ["High Protein", "Quick"],          emoji: "🍗", prepTime: "35 min" },
  beef:    { meal: "Classic Bolognese",               subtitle: "with Penne Pasta & Parmesan",                 tags: ["Comfort Food", "Family Favorite"], emoji: "🍝", prepTime: "45 min" },
  pork:    { meal: "Slow-Cooker Pulled Pork Bowls",   subtitle: "with Cabbage Slaw & White Rice",              tags: ["Meal Prep", "Freezer Friendly"],   emoji: "🫙", prepTime: "20 min active" },
  turkey:  { meal: "Turkey & Vegetable Skillet",      subtitle: "with Garlic Rice & Fresh Herbs",             tags: ["Lean", "Quick"],                   emoji: "🦃", prepTime: "30 min" },
  fish:    { meal: "Baked Lemon Herb Fish Fillets",   subtitle: "with Roasted Potatoes & Green Beans",        tags: ["Light", "High Protein"],           emoji: "🐟", prepTime: "30 min" },
  salmon:  { meal: "Pan-Seared Salmon",              subtitle: "with Garlic Butter Rice & Asparagus",        tags: ["High Protein", "Omega-3"],         emoji: "🐟", prepTime: "25 min" },
  shrimp:  { meal: "Garlic Butter Shrimp Pasta",     subtitle: "with Linguine & Parsley",                    tags: ["Quick", "Date Night"],             emoji: "🍝", prepTime: "20 min" },
  pasta:   { meal: "Tomato Cream Pasta",             subtitle: "with Crushed Tomatoes & Fresh Basil",        tags: ["Vegetarian Option", "Comfort Food"],emoji: "🍝", prepTime: "25 min" },
  tomato:  { meal: "Tomato Chicken Skillet",         subtitle: "with Crushed Tomatoes, Herbs & Crusty Bread", tags: ["One Pan", "Quick"],               emoji: "🍅", prepTime: "30 min" },
  broccoli:{ meal: "Beef & Broccoli Stir Fry",       subtitle: "with White Rice & Sesame Sauce",             tags: ["Quick", "Kid Friendly"],           emoji: "🥦", prepTime: "25 min" },
  default: { meal: "Sheet Pan Dinner",               subtitle: "with This Week's Best Deals",                tags: ["Easy", "One Pan"],                 emoji: "🍽️", prepTime: "40 min" },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Returns true if a given string contains any of the PROTEIN_KEYWORDS. */
function isPrimaryProtein(text) {
  const lower = text.toLowerCase();
  return PROTEIN_KEYWORDS.some(kw => lower.includes(kw));
}

/**
 * Tokenise a deal item name into meaningful words (≥4 chars).
 * e.g. "Ground Beef 80/20" → ["ground", "beef"]
 */
function dealTokens(dealItem) {
  return dealItem
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length >= 4);
}

/**
 * Score a single vault recipe against a single deal.
 * Returns a numeric score: higher = better match.
 *
 * Matching surfaces (in priority order):
 *   1. recipe.ingredients array  (most explicit — user-entered)
 *   2. recipe.name               (e.g. "Beef & Broccoli" matches "Ground Beef")
 *   3. recipe.tags               (e.g. ["High Protein"] → no direct match, low value)
 */
export function scoreRecipeAgainstDeal(recipe, deal) {
  const tokens = dealTokens(deal.item);
  if (tokens.length === 0) return 0;

  // Build a searchable text blob from every recipe surface
  const ingredients = (recipe.ingredients ?? []).map(i => i.toLowerCase());
  const nameLower   = (recipe.name ?? "").toLowerCase();
  const tagsLower   = (recipe.tags ?? []).map(t => t.toLowerCase());
  const isProtein   = isPrimaryProtein(deal.item);

  let score = 0;

  // Surface 1: explicit ingredients array
  if (ingredients.length > 0) {
    const ingText = ingredients.join(" ");
    if (tokens.some(tok => ingText.includes(tok))) {
      score += isProtein ? PROTEIN_SCORE : INGREDIENT_SCORE;
    }
  }

  // Surface 2: recipe name (strong signal — e.g. "Chicken Thigh Skillet")
  if (tokens.some(tok => nameLower.includes(tok))) {
    score += isProtein ? PROTEIN_SCORE : INGREDIENT_SCORE;
  }

  // Surface 3: tags (weak signal)
  if (tokens.some(tok => tagsLower.some(tag => tag.includes(tok)))) {
    score += TAG_SCORE;
  }

  return score;
}

/**
 * Remove any recipe whose name/ingredients/tags contain a nonoList word.
 * Case-insensitive exact-word matching to avoid false positives
 * (e.g. "peanut butter" correctly blocks if nonoList includes "peanuts").
 */
export function filterByNonoList(recipes, nonoList) {
  if (!nonoList || nonoList.length === 0) return recipes;

  return recipes.filter(recipe => {
    const haystack = [
      recipe.name ?? "",
      ...(recipe.ingredients ?? []),
      ...(recipe.tags ?? []),
    ].join(" ").toLowerCase();

    return !nonoList.some(nono => haystack.includes(nono.toLowerCase()));
  });
}

/**
 * Find the best RECIPE_DATABASE key for a given deal item.
 */
function recipeKeyFor(itemLower) {
  return Object.keys(RECIPE_DATABASE).find(k => k !== "default" && itemLower.includes(k)) ?? "default";
}

/**
 * Return a synthetic (template-generated) MenuDay for a deal that had no
 * vault match.
 *
 * Priority:
 *   1. Spoonacular recipes from Supabase (when spoonacularByKey is provided)
 *   2. Static RECIPE_DATABASE (always-available fallback)
 *
 * @param {Object} deal
 * @param {number} dayIndex
 * @param {number} [recipeIndex=0]      - Which recipe option to use (for Regenerate)
 * @param {Object} [spoonacularByKey={}] - Map of ingredient_key → recipe[] from Supabase
 */
function syntheticMealFor(deal, dayIndex, recipeIndex = 0, spoonacularByKey = {}) {
  const itemLower = deal.item.toLowerCase();
  const key       = recipeKeyFor(itemLower);

  const costPerServing = +(deal.sale * ASSUMED_QTY_LBS / 4 + PANTRY_COST_PER_SERVING).toFixed(2);
  const weekSaved      = +((deal.orig - deal.sale) * ASSUMED_QTY_LBS).toFixed(2);

  // ── Prefer live Spoonacular recipes if available ──────────────────────────
  const spoonOptions = spoonacularByKey[key] ?? [];
  if (spoonOptions.length > 0) {
    const tpl = spoonOptions[recipeIndex % spoonOptions.length];
    return {
      id:              "synthetic_" + deal.id + "_day" + dayIndex,
      day:             DAYS[dayIndex],
      meal:            tpl.meal,
      subtitle:        tpl.subtitle ?? "See recipe for full details",
      dealIngredients: [deal.item],
      prepTime:        tpl.prep_time ?? "30 min",
      costPerServing,
      weekSaved,
      headcount:       4,
      tags:            tpl.tags ?? [],
      emoji:           deal.emoji ?? tpl.emoji ?? "🍽️",
      isSaved:         false,
      recipeUrl:       tpl.source_url ?? ("https://www.allrecipes.com/search?q=" + encodeURIComponent(tpl.meal)),
      imageUrl:        tpl.image_url ?? null,
      _recipeKey:      key,
      _recipeIndex:    recipeIndex,
      _spoonOptions:   spoonOptions,   // stored so Regenerate can cycle them
      _source:         "spoonacular",
    };
  }

  // ── Fallback: static RECIPE_DATABASE ─────────────────────────────────────
  const options = RECIPE_DATABASE[key];
  const tpl     = options[recipeIndex % options.length];

  return {
    id:             "synthetic_" + deal.id + "_day" + dayIndex,
    day:            DAYS[dayIndex],
    meal:           tpl.meal,
    subtitle:       tpl.subtitle,
    dealIngredients:[deal.item],
    prepTime:       tpl.prepTime,
    costPerServing,
    weekSaved,
    headcount:      4,
    tags:           tpl.tags,
    emoji:          deal.emoji ?? tpl.emoji,
    isSaved:        false,
    recipeUrl:      tpl.recipeUrl,
    imageUrl:       null,
    _recipeKey:     key,
    _recipeIndex:   recipeIndex,
    _spoonOptions:  [],
    _source:        "synthetic",
  };
}

/**
 * Regenerate a menu day — same deal, next recipe option.
 *
 * Prefers Spoonacular options stored on the day (_spoonOptions) over the
 * static RECIPE_DATABASE, so once the Supabase `recipes` table is populated
 * Regenerate will cycle through real Spoonacular recipes automatically.
 *
 * @param {Object} currentDay  - Existing MenuDay object
 * @param {Object} deal        - The deal this day is anchored to
 * @param {number} dayIndex    - 0–4 (Monday–Friday)
 * @returns {Object}           - New MenuDay with the next recipe
 */
export function regenerateMealFor(currentDay, deal, dayIndex) {
  const key     = currentDay._recipeKey ?? recipeKeyFor(deal.item.toLowerCase());
  const current = currentDay._recipeIndex ?? 0;
  const next    = current + 1;

  // Rebuild the spoonacularByKey map from the stored options on currentDay
  // so syntheticMealFor can cycle them correctly without needing a re-fetch.
  const spoonOptions = currentDay._spoonOptions ?? [];
  const spoonByKey   = spoonOptions.length > 0 ? { [key]: spoonOptions } : {};

  return syntheticMealFor(deal, dayIndex, next, spoonByKey);
}

// ── Main export ────────────────────────────────────────────────────────────────

/**
 * Build a 5-day menu from live deal + vault data.
 *
 * Algorithm:
 *   1. Take the top 5 Loss Leaders (highest % discount).
 *   2. Score every vault recipe against every deal; keep the best (deal, score) pair per recipe.
 *   3. Sort by score desc, then by recipe rating desc.
 *   4. Pick the top 5 unique recipes; assign Monday→Friday.
 *   5. If vault has fewer than 5 deal-matched recipes, fill remaining slots with
 *      Spoonacular recipes from Supabase (when available) or static template fallbacks.
 *
 * @param {Object[]} deals              - Rows from the `deals` Supabase table
 * @param {Object[]} vaultMeals         - Rows from `saved_meals` for the current user
 * @param {string[]} nonoList           - Allergens / dislikes from user's profile
 * @param {Object[]} [spoonacularRecipes=[]] - Rows from the `recipes` Supabase table
 * @returns {Object[]}                  - 5-element array of MenuDay objects
 */
export function buildMenuFromDeals(deals, vaultMeals, nonoList = [], spoonacularRecipes = []) {
  // ── Group Spoonacular recipes by ingredient_key for fast lookup ────────────
  const spoonacularByKey = {};
  for (const r of spoonacularRecipes) {
    if (!spoonacularByKey[r.ingredient_key]) spoonacularByKey[r.ingredient_key] = [];
    spoonacularByKey[r.ingredient_key].push(r);
  }
  // ── Step 1: top 5 Loss Leaders ─────────────────────────────────────────────
  const topDeals = [...deals]
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);

  if (topDeals.length === 0) return [];

  // ── Step 2: filter vault by nonoList then score each recipe ───────────────
  const safeRecipes = filterByNonoList(vaultMeals, nonoList);

  const scoredRecipes = safeRecipes.map(recipe => {
    let bestScore = 0;
    let bestDeal  = null;

    for (const deal of topDeals) {
      const s = scoreRecipeAgainstDeal(recipe, deal);
      if (s > bestScore) {
        bestScore = s;
        bestDeal  = deal;
      }
    }

    return { recipe, score: bestScore, deal: bestDeal };
  });

  // ── Step 3: sort — deal-matched & highest-rated first ─────────────────────
  scoredRecipes.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.recipe.rating ?? 0) - (a.recipe.rating ?? 0);
  });

  // ── Step 4: take top 5 unique vault recipes ───────────────────────────────
  const seenNames = new Set();
  const selected  = [];

  for (const item of scoredRecipes) {
    if (selected.length >= 5) break;
    const key = item.recipe.name.toLowerCase();
    if (!seenNames.has(key)) {
      seenNames.add(key);
      selected.push(item);
    }
  }

  // ── Step 5: fill gaps with Spoonacular/synthetic meals for unmatched deals ──
  const usedDealIds = new Set(selected.map(s => s.deal?.id).filter(Boolean));
  const unusedDeals = topDeals.filter(d => !usedDealIds.has(d.id));

  while (selected.length < 5 && unusedDeals.length > 0) {
    const deal = unusedDeals.shift();
    selected.push({ recipe: null, score: 0, deal });
  }

  // Fill any remaining slots (edge case: fewer than 5 deals + no vault)
  while (selected.length < Math.min(5, topDeals.length)) {
    selected.push({ recipe: null, score: 0, deal: topDeals[selected.length] });
  }

  // ── Step 6: map to MenuDay shape ──────────────────────────────────────────
  return selected.slice(0, 5).map((item, idx) => {
    // Synthetic slot — use Spoonacular if available, else static DB
    if (!item.recipe) {
      return syntheticMealFor(item.deal, idx, 0, spoonacularByKey);
    }

    const { recipe, deal } = item;
    const dealIngredients  = deal ? [deal.item] : [];
    const costPerServing   = recipe.cost_per_serving
      ?? (deal ? +(deal.sale * ASSUMED_QTY_LBS / (recipe.headcount ?? 4) + PANTRY_COST_PER_SERVING).toFixed(2) : 2.50);
    const weekSaved        = deal
      ? +((deal.orig - deal.sale) * ASSUMED_QTY_LBS).toFixed(2)
      : 0;

    // Look up a recipe URL from the database for vault meals too
    const dealKey   = deal ? recipeKeyFor(deal.item.toLowerCase()) : "default";
    const dbOptions = RECIPE_DATABASE[dealKey] ?? RECIPE_DATABASE.default;
    const dbMatch   = dbOptions.find(r => r.meal.toLowerCase() === recipe.name.toLowerCase());
    const recipeUrl = recipe.recipe_url ?? dbMatch?.recipeUrl ?? dbOptions[0]?.recipeUrl ?? null;

    return {
      id:             String(recipe.id),
      day:            DAYS[idx],
      meal:           recipe.name,
      subtitle:       recipe.subtitle ?? (deal ? `featuring ${deal.item} at $${deal.sale.toFixed(2)}${deal.unit}` : ""),
      dealIngredients,
      prepTime:       recipe.prep_time ?? "30 min",
      costPerServing,
      weekSaved,
      headcount:      recipe.headcount ?? 4,
      tags:           recipe.tags ?? [],
      emoji:          recipe.emoji ?? "🍽️",
      isSaved:        true,
      recipeUrl,
      _recipeKey:     dealKey,
      _recipeIndex:   0,
      _source:        "vault",
    };
  });
}

// ── Week range helper ──────────────────────────────────────────────────────────

/**
 * Returns a formatted week range string for the UI subtitle.
 * e.g. "Mar 24 – Mar 28, 2026"
 */
export function formatWeekRange() {
  const now = new Date();
  const day  = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  const fmt = (d) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const year = friday.getFullYear();

  return `${fmt(monday)} – ${fmt(friday)}, ${year}`;
}

/** Returns ISO "YYYY-MM-DD" for the Monday of the current week. */
export function currentWeekOf() {
  const now = new Date();
  const day  = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}
