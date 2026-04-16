// ─── transform.js ─────────────────────────────────────────────────────────────
// Normalises raw Flipp items into DinnerHack's deals schema and filters to
// only keep Loss Leaders (discount >= MIN_DISCOUNT_PCT).
//
// Output schema per item:
//   {
//     id:           string   (deterministic hash: store+name+weekOf)
//     store:        string   (display name, e.g. "Aldi")
//     item:         string   (cleaned item name)
//     orig:         number   (original price, 2dp)
//     sale:         number   (sale price, 2dp)
//     unit:         string   (e.g. "/lb", "/ea", "/pkg")
//     pct:          number   (discount %, integer)
//     emoji:        string
//     category:     string
//     week_of:      string   (ISO date of the Monday of current week)
//   }
// ──────────────────────────────────────────────────────────────────────────────

const MIN_DISCOUNT_PCT = Number(process.env.MIN_DISCOUNT_PCT ?? 30);

// ── Non-food blocklist ─────────────────────────────────────────────────────────
// Items matching any of these patterns are skipped — they're not groceries.
const NON_FOOD_PATTERNS = [
  // Clothing & apparel
  /\b(shirt|t-shirt|tee|pants|jeans|shorts|skirt|dress|jacket|coat|hoodie|sweater|sweatshirt|cardigan|blazer|blouse|top|legging|sock|underwear|bra|brief|boxer|pajama|pyjama|robe|swimsuit|bikini|sandal|shoe|boot|sneaker|slipper|glove|hat|cap|scarf|belt|tie|purse|handbag|wallet|backpack)\b/i,
  // Beauty & personal care
  /\b(shampoo|conditioner|lotion|moisturizer|sunscreen|deodorant|antiperspirant|toothpaste|toothbrush|mouthwash|razor|shave|cologne|perfume|fragrance|lipstick|mascara|foundation|concealer|eyeliner|blush|nail polish|makeup|cosmetic|skincare|hair color|hair dye)\b/i,
  // Home & household (non-food)
  /\b(notepad|notebook|pen|pencil|marker|crayon|binder|folder|tape|staple|scissors|glue|paper towel|tissue|toilet paper|paper plate|plastic bag|trash bag|laundry|detergent|bleach|fabric softener|dryer sheet|dish soap|dishwasher|cleaner|disinfectant|mop|broom|vacuum|sponge|scrub)\b/i,
  // Electronics & toys
  /\b(battery|batteries|charger|cable|headphone|earbud|speaker|remote|controller|toy|game|puzzle|doll|action figure|lego|board game|card game)\b/i,
  // Furniture & home décor
  /\b(pillow|blanket|sheet|towel|curtain|rug|mat|lamp|candle|vase|picture frame|storage bin|container|basket|shelf|table|chair|desk|drawer)\b/i,
  // Pet supplies (non-food)
  /\b(litter|leash|collar|pet bed|aquarium|cage)\b/i,
];

function isNonFood(name, category = "") {
  const text = `${name} ${category}`;
  return NON_FOOD_PATTERNS.some(p => p.test(text));
}

// ── Emoji map (category keyword → emoji) ──────────────────────────────────────
const EMOJI_RULES = [
  // Protein
  { match: /chicken/i,           emoji: "🍗" },
  { match: /turkey/i,            emoji: "🦃" },
  { match: /ground beef|beef/i,  emoji: "🥩" },
  { match: /steak/i,             emoji: "🥩" },
  { match: /pork|ham|bacon/i,    emoji: "🫙" },
  { match: /sausage/i,           emoji: "🌭" },
  { match: /fish|salmon|tuna|tilapia|cod|shrimp|seafood/i, emoji: "🐟" },
  // Produce
  { match: /broccoli/i,          emoji: "🥦" },
  { match: /tomato/i,            emoji: "🍅" },
  { match: /potato|sweet potato/i, emoji: "🥔" },
  { match: /pepper/i,            emoji: "🫑" },
  { match: /onion|garlic/i,      emoji: "🧅" },
  { match: /carrot/i,            emoji: "🥕" },
  { match: /corn/i,              emoji: "🌽" },
  { match: /apple/i,             emoji: "🍎" },
  { match: /banana/i,            emoji: "🍌" },
  { match: /strawberr|berr/i,    emoji: "🍓" },
  { match: /orange|clementine/i, emoji: "🍊" },
  { match: /lemon|lime/i,        emoji: "🍋" },
  { match: /avocado/i,           emoji: "🥑" },
  { match: /lettuce|salad|spinach|kale|cabbage/i, emoji: "🥬" },
  // Dairy / Bakery
  { match: /egg/i,               emoji: "🥚" },
  { match: /butter/i,            emoji: "🧈" },
  { match: /milk/i,              emoji: "🥛" },
  { match: /cheese/i,            emoji: "🧀" },
  { match: /yogurt/i,            emoji: "🫙" },
  { match: /bread/i,             emoji: "🍞" },
  { match: /bagel|muffin|pastry|cake/i, emoji: "🥐" },
  // Pantry
  { match: /pasta|penne|spaghetti|noodle/i, emoji: "🍝" },
  { match: /rice/i,              emoji: "🍚" },
  { match: /soup|broth|stock/i,  emoji: "🍲" },
  { match: /sauce|salsa|ketchup/i, emoji: "🍅" },
  { match: /oil/i,               emoji: "🫙" },
  { match: /coffee/i,            emoji: "☕" },
  { match: /juice/i,             emoji: "🧃" },
  { match: /water|soda|drink|beverage/i, emoji: "🥤" },
  { match: /cereal/i,            emoji: "🥣" },
  { match: /chip|crisp|snack/i,  emoji: "🍿" },
  { match: /chocolate|candy/i,   emoji: "🍫" },
  { match: /ice cream|frozen/i,  emoji: "🍦" },
  // Category fallbacks
  { match: /meat|protein/i,      emoji: "🥩" },
  { match: /produce|vegetable|fruit/i, emoji: "🥦" },
  { match: /dairy/i,             emoji: "🧀" },
  { match: /bakery/i,            emoji: "🍞" },
  { match: /deli/i,              emoji: "🥪" },
];

function assignEmoji(name, category = "") {
  const text = `${name} ${category}`.toLowerCase();
  for (const rule of EMOJI_RULES) {
    if (rule.match.test(text)) return rule.emoji;
  }
  return "🏷️";
}

// ── Price parsing helpers ──────────────────────────────────────────────────────

/**
 * Extract a numeric price from a Flipp price_text string.
 * Handles: "$2.99", "$2.99/lb", "2 for $5", "$1.99 ea", etc.
 * Returns null if no price found.
 */
function parsePriceText(text) {
  if (!text) return null;
  // "2 for $X" → take X (the per-unit price)
  const forMatch = text.match(/(\d+)\s+for\s+\$?([\d.]+)/i);
  if (forMatch) {
    const count = parseFloat(forMatch[1]);
    const total = parseFloat(forMatch[2]);
    return count > 0 ? +(total / count).toFixed(2) : null;
  }
  // "$X.XX" anywhere in the string
  const dollarMatch = text.match(/\$?([\d]+\.[\d]{1,2})/);
  if (dollarMatch) return parseFloat(dollarMatch[1]);
  return null;
}

/**
 * Normalise the unit text from price_text (e.g. "/lb", "/ea", "/pkg").
 */
function parseUnit(priceText = "") {
  const lower = priceText.toLowerCase();
  if (/\/\s*lb|per lb/.test(lower))  return "/lb";
  if (/\/\s*oz/.test(lower))         return "/oz";
  if (/\/\s*kg/.test(lower))         return "/kg";
  if (/\/\s*pk|\/\s*pack/.test(lower)) return "/pkg";
  if (/\/\s*ct|\/\s*count/.test(lower)) return "/ct";
  if (/each|\/\s*ea/.test(lower))    return "/ea";
  return "/ea";
}

// ── Week-of helper ─────────────────────────────────────────────────────────────

/**
 * Returns the ISO date string (YYYY-MM-DD) for the Monday of the current week.
 * Flyers are keyed by week so we don't duplicate rows across daily runs.
 */
export function currentWeekOf() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon …
  const diff = (day === 0 ? 1 : 1 - day); // Sun→next Monday, Mon-Sat→this Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().slice(0, 10); // "2026-03-23"
}

/**
 * Build a deterministic string ID for a deal row.
 * store + itemName + weekOf → used as the upsert conflict key.
 */
export function buildDealId(store, itemName, weekOf) {
  const slug = `${store}::${itemName}::${weekOf}`
    .toLowerCase()
    .replace(/[^a-z0-9:]/g, "_");
  // Simple djb2 hash → hex string (no crypto needed)
  let hash = 5381;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) + hash) + slug.charCodeAt(i);
    hash |= 0; // force 32-bit
  }
  return (hash >>> 0).toString(16).padStart(8, "0"); // e.g. "3a2f1b9c"
}

// ── Main transform ─────────────────────────────────────────────────────────────

/**
 * Transform and filter raw Flipp items into DinnerHack deal records.
 *
 * @param {string}   storeDisplayName  - e.g. "Aldi" or "Giant Eagle"
 * @param {Object[]} rawItems          - items from flipp.js
 * @returns {Object[]}                 - normalised deal records
 */
export function transformItems(storeDisplayName, rawItems) {
  const weekOf = currentWeekOf();
  const results = [];

  for (const item of rawItems) {
    // ── Resolve prices ──────────────────────────────────────────────────────
    // Flipp API uses "price" field (confirmed April 2026)
    // Also check current_price and price_text as fallbacks
    let salePrice = item.current_price != null ? Number(item.current_price)
                  : item.price         != null ? Number(item.price)
                  : null;
    let origPrice = item.pre_price != null ? Number(item.pre_price) : null;

    // Fall back to price_text parsing
    if (salePrice == null && item.price_text) {
      salePrice = parsePriceText(item.price_text);
    }

    // Skip if we can't determine a sale price
    if (salePrice == null || isNaN(salePrice) || salePrice <= 0) continue;

    // Skip non-food items (clothing, office supplies, home goods, etc.)
    const itemName0 = (item.name ?? "").trim();
    const category0 = (item.category ?? "").trim();
    if (isNonFood(itemName0, category0)) continue;

    // ── Discount filter ─────────────────────────────────────────────────────
    // If original price exists, require minimum discount %
    // If no original price, include the item anyway (Flipp already marks it as a deal)
    let discountPct = 0;
    if (origPrice != null && !isNaN(origPrice) && origPrice > 0) {
      discountPct = Math.round(((origPrice - salePrice) / origPrice) * 100);
      if (discountPct < MIN_DISCOUNT_PCT) continue;
    }

    // ── Build record ────────────────────────────────────────────────────────
    const itemName = (item.name ?? "Unknown Item").trim();
    const category = (item.category ?? "").trim();
    const unit     = parseUnit(item.price_text ?? "");

    results.push({
      id:       buildDealId(storeDisplayName, itemName, weekOf),
      store:    storeDisplayName,
      item:     itemName,
      orig:     origPrice != null ? +origPrice.toFixed(2) : +salePrice.toFixed(2),
      sale:     +salePrice.toFixed(2),
      unit,
      pct:      discountPct,
      emoji:    assignEmoji(itemName, category),
      category: category || "General",
      week_of:  weekOf,
    });
  }

  // Deduplicate by id (same item may appear in multiple Flipp responses)
  const seen = new Set();
  return results.filter(r => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}
