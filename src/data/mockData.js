// ─── mockData.js ──────────────────────────────────────────────────────────────
// All mock data lives here. Each export maps 1:1 to a future Supabase table.
// When you're ready to go live, replace the relevant hook's data source
// (see src/hooks/) with a supabase.from('table').select() call instead.

export const DEALS = [
  { id: 1, store: "Aldi",        item: "Chicken Thighs",     orig: 3.49, sale: 0.89, unit: "/lb",   pct: 74, emoji: "🍗" },
  { id: 2, store: "Aldi",        item: "Ground Beef 80/20",  orig: 5.99, sale: 2.99, unit: "/lb",   pct: 50, emoji: "🥩" },
  { id: 3, store: "Giant Eagle", item: "Broccoli Crowns",    orig: 1.99, sale: 0.79, unit: "/head", pct: 60, emoji: "🥦" },
  { id: 4, store: "Aldi",        item: "Penne Pasta",        orig: 1.29, sale: 0.59, unit: "/box",  pct: 54, emoji: "🍝" },
  { id: 5, store: "Giant Eagle", item: "Crushed Tomatoes",   orig: 1.49, sale: 0.69, unit: "/can",  pct: 54, emoji: "🍅" },
  { id: 6, store: "Giant Eagle", item: "Pork Shoulder",      orig: 4.99, sale: 1.49, unit: "/lb",   pct: 70, emoji: "🫙" },
];

export const INITIAL_MENU = [
  {
    id: 1, day: "Monday",
    meal: "Garlic Lemon Chicken Thighs",
    subtitle: "with Roasted Broccoli & Steamed Rice",
    dealIngredients: ["Chicken Thighs", "Broccoli Crowns"],
    prepTime: "35 min", costPerServing: 2.10, weekSaved: 6.20,
    headcount: 4, tags: ["High Protein", "Low Carb"], emoji: "🍗", isSaved: false,
  },
  {
    id: 2, day: "Tuesday",
    meal: "Beef & Broccoli Pasta Bake",
    subtitle: "with Ground Beef, Penne & Cheddar",
    dealIngredients: ["Ground Beef 80/20", "Penne Pasta", "Broccoli Crowns"],
    prepTime: "40 min", costPerServing: 1.85, weekSaved: 5.90,
    headcount: 4, tags: ["Kid Friendly", "Comfort Food"], emoji: "🍝", isSaved: true,
  },
  {
    id: 3, day: "Wednesday",
    meal: "Slow-Cooker Pulled Pork Bowls",
    subtitle: "with Cabbage Slaw & White Rice",
    dealIngredients: ["Pork Shoulder"],
    prepTime: "20 min active", costPerServing: 2.40, weekSaved: 8.10,
    headcount: 4, tags: ["Meal Prep", "Freezer Friendly"], emoji: "🫙", isSaved: false,
  },
  {
    id: 4, day: "Thursday",
    meal: "Tomato Chicken Skillet",
    subtitle: "with Crushed Tomatoes, Herbs & Crusty Bread",
    dealIngredients: ["Chicken Thighs", "Crushed Tomatoes"],
    prepTime: "30 min", costPerServing: 1.95, weekSaved: 5.50,
    headcount: 4, tags: ["One Pan", "Quick"], emoji: "🍅", isSaved: false,
  },
  {
    id: 5, day: "Friday",
    meal: "Classic Bolognese",
    subtitle: "with Ground Beef, Penne & Parmesan",
    dealIngredients: ["Ground Beef 80/20", "Penne Pasta", "Crushed Tomatoes"],
    prepTime: "45 min", costPerServing: 1.75, weekSaved: 4.80,
    headcount: 4, tags: ["Family Favorite", "Comfort Food"], emoji: "🍝", isSaved: true,
  },
];

export const PANTRY_STAPLES = [
  "Olive Oil", "Salt & Pepper", "Garlic (bulb)", "Onion",
  "White Rice (dry)", "Chicken Broth", "Soy Sauce", "Paprika",
  "Italian Seasoning", "Butter", "All-Purpose Flour", "Parmesan Cheese",
  "Lemon", "Red Pepper Flakes",
];

export const GROCERY_ITEMS = [
  { id: 1, store: "Aldi",        cat: "Meat & Protein", item: "Chicken Thighs",    qty: "3 lbs",   price: 2.67, deal: true,  emoji: "🍗" },
  { id: 2, store: "Aldi",        cat: "Meat & Protein", item: "Ground Beef 80/20", qty: "2 lbs",   price: 5.98, deal: true,  emoji: "🥩" },
  { id: 3, store: "Giant Eagle", cat: "Meat & Protein", item: "Pork Shoulder",     qty: "2 lbs",   price: 2.98, deal: true,  emoji: "🫙" },
  { id: 4, store: "Giant Eagle", cat: "Produce",        item: "Broccoli Crowns",   qty: "2 heads", price: 1.58, deal: true,  emoji: "🥦" },
  { id: 5, store: "Giant Eagle", cat: "Produce",        item: "Green Cabbage",     qty: "1 head",  price: 1.29, deal: false, emoji: "🥬" },
  { id: 6, store: "Aldi",        cat: "Dry Goods",      item: "Penne Pasta",       qty: "2 boxes", price: 1.18, deal: true,  emoji: "🍝" },
  { id: 7, store: "Giant Eagle", cat: "Canned Goods",   item: "Crushed Tomatoes",  qty: "3 cans",  price: 2.07, deal: true,  emoji: "🍅" },
  { id: 8, store: "Aldi",        cat: "Dairy",          item: "Shredded Cheddar",  qty: "8 oz",    price: 2.29, deal: false, emoji: "🧀" },
];

export const VAULT_MEALS = [
  { id: 1, name: "Beef & Broccoli Pasta Bake",  date: "Mar 18", rating: 5, tags: ["Kid Friendly"],    emoji: "🍝", cooked: 3, headcount: 4, cost: 1.85 },
  { id: 2, name: "Classic Bolognese",            date: "Mar 11", rating: 5, tags: ["Family Favorite"], emoji: "🍝", cooked: 5, headcount: 4, cost: 1.75 },
  { id: 3, name: "Chicken Tortilla Soup",        date: "Feb 28", rating: 4, tags: ["Freezer Friendly"],emoji: "🍲", cooked: 2, headcount: 6, cost: 2.20 },
  { id: 4, name: "Sheet Pan Sausage & Peppers",  date: "Feb 21", rating: 5, tags: ["One Pan"],         emoji: "🫑", cooked: 4, headcount: 4, cost: 2.10 },
  { id: 5, name: "Pulled Pork Rice Bowls",       date: "Feb 14", rating: 4, tags: ["Meal Prep"],       emoji: "🫙", cooked: 2, headcount: 5, cost: 2.40 },
  { id: 6, name: "Tomato Basil Chicken Skillet", date: "Feb 7",  rating: 5, tags: ["Quick"],           emoji: "🍗", cooked: 6, headcount: 4, cost: 1.95 },
];
