// ─── flipp.js ─────────────────────────────────────────────────────────────────
// Fetches weekly flyer items from Flipp's API (dam.flippenterprise.net).
//
// Strategy:
//   1. GET /api/flipp/flyers?postal_code={zip} → list of active flyers
//   2. Filter to target stores (aldi, giant eagle, walmart, etc.)
//   3. For each matching flyer, GET /api/flipp/flyers/{id}/flyer_items
//   4. Return raw item arrays keyed by merchant name
//
// No Playwright needed — direct HTTP calls to Flipp's API.
// Much more reliable than browser automation.
//
// Discovered via Chrome DevTools on April 10, 2026:
//   Old API: backflipp.wishabi.com  (no longer works)
//   New API: dam.flippenterprise.net (confirmed working)
// ──────────────────────────────────────────────────────────────────────────────

import logger from "./logger.js";

const FLIPP_BASE = "https://dam.flippenterprise.net/api/flipp";

// Delay between API calls to avoid rate limiting
const CALL_DELAY_MS = 300;

// Headers that mimic a real browser request
const HEADERS = {
  "User-Agent":      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept":          "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Referer":         "https://flipp.com/",
  "Origin":          "https://flipp.com",
};

// Confirmed working endpoints (discovered via Chrome DevTools, April 10 2026):
//   Flyer listing: GET /api/flipp/data?locale=en&postal_code={zip}
//     → returns { flyers: [...], coupons: [...], ... }
//     → each flyer has: id, merchant, valid_from, valid_to
//   Flyer items:   GET /api/flipp/flyers/{id}/flyer_items?locale=en
//     → returns array of item objects

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch the list of active flyers for a given ZIP code.
 * Uses /api/flipp/data endpoint (confirmed working April 2026).
 * Returns an array of flyer objects with id, merchant, valid_from, valid_to, etc.
 */
async function fetchFlyers(postalCode) {
  const url = FLIPP_BASE + "/data?locale=en&postal_code=" + postalCode;

  logger.info("[flipp] Fetching flyer list for ZIP: " + postalCode);

  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) {
    throw new Error("Flipp data API returned HTTP " + res.status);
  }

  const data = await res.json();

  // Response is { flyers: [...], coupons: [...], ... }
  const flyers = data.flyers ?? [];
  logger.info("[flipp] Found " + flyers.length + " active flyers");
  return flyers;
}

/**
 * Fetch all deal items for a specific flyer ID.
 * Returns an array of item objects with name, current_price, pre_price, etc.
 */
async function fetchFlyerItems(flyerId, merchantName) {
  const url = FLIPP_BASE + "/flyers/" + flyerId + "/flyer_items?locale=en";

  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) {
    logger.warn("[flipp] Could not fetch items for flyer " + flyerId + " (" + merchantName + "): HTTP " + res.status);
    return [];
  }

  const data = await res.json();
  const items = Array.isArray(data) ? data : (data.flyer_items ?? data.items ?? data.data ?? []);

  // Attach merchant_name to each item so transform.js can group them
  // Use both merchant_name and merchant for compatibility
  return items.map(item => ({ ...item, merchant_name: merchantName, merchant: merchantName }));
}

/**
 * Main export — fetches all deal items for target stores in a given ZIP code.
 *
 * @param {string}   zipCode       - e.g. "15944"
 * @param {string[]} targetStores  - lowercased store names e.g. ["aldi", "walmart"]
 * @returns {Promise<Object>}      - e.g. { "aldi": [...], "walmart": [...] }
 */
export async function scrapeFlipp(zipCode, targetStores) {
  logger.info("[flipp] Starting Flipp API fetch for ZIP " + zipCode);

  // ── Step 1: Get all flyers for this ZIP ───────────────────────────────────
  const allFlyers = await fetchFlyers(zipCode);

  // ── Step 2: Filter to target stores ──────────────────────────────────────
  const matchedFlyers = [];
  for (const flyer of allFlyers) {
    // API uses "merchant" field (confirmed April 2026)
    const merchantName = flyer.merchant ?? flyer.merchant_name ?? flyer.name ?? "";
    const merchant = merchantName.toLowerCase().trim();
    const matchedStore = targetStores.find(target =>
      merchant.includes(target) || target.includes(merchant)
    );
    if (matchedStore) {
      matchedFlyers.push({ ...flyer, _merchantName: merchantName, _matchedStore: matchedStore });
      logger.info("[flipp] Matched: " + merchantName + " → " + matchedStore);
    }
  }

  logger.info("[flipp] Matched " + matchedFlyers.length + " flyers for target stores");

  // ── Step 3: Fetch items for each matched flyer ────────────────────────────
  const grouped = {};
  for (const store of targetStores) {
    grouped[store] = [];
  }

  for (const flyer of matchedFlyers) {
    await delay(CALL_DELAY_MS);
    const items = await fetchFlyerItems(flyer.id, flyer._merchantName);
    logger.info("[flipp] " + flyer._merchantName + ": " + items.length + " items fetched");
    grouped[flyer._matchedStore].push(...items);
  }

  // ── Step 4: Log summary ───────────────────────────────────────────────────
  for (const [store, items] of Object.entries(grouped)) {
    logger.info("[flipp] " + store + ": " + items.length + " raw items captured");
  }

  return grouped;
}
