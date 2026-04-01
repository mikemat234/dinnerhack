// ─── flipp.js ─────────────────────────────────────────────────────────────────
// Scrapes weekly flyer items from Flipp.com using Playwright.
//
// Strategy:
//   1. Navigate to https://flipp.com/home/{zip_code}
//   2. Intercept all responses from backflipp.wishabi.com — this is the internal
//      API Flipp's SPA calls to load flyer data.
//   3. Wait for the stores we care about to appear in the intercepted JSON.
//   4. Return raw item arrays keyed by merchant name.
//
// Flipp API response shape (from each item):
//   {
//     id:            number,
//     name:          string,
//     description:   string | null,
//     current_price: number | null,   // sale price
//     pre_price:     number | null,   // original price
//     price_text:    string | null,   // fallback "2 for $5.00 / lb"
//     category:      string | null,
//     merchant_name: string,
//     flyer_id:      number,
//     image_url:     string | null,
//     valid_from:    string,          // ISO date
//     valid_to:      string,
//   }
// ──────────────────────────────────────────────────────────────────────────────

import { chromium } from "playwright";
import logger from "./logger.js";

// Rotate through these to reduce fingerprinting risk.
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
];

const FLIPP_BASE      = "https://flipp.com/home";
const WISHABI_PATTERN = /backflipp\.wishabi\.com/;
const PAGE_TIMEOUT_MS = 45_000;
const IDLE_TIMEOUT_MS = 8_000;

/**
 * Pick a random user agent from the rotation list.
 */
function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Given a raw Flipp API response body (parsed JSON), extract any arrays of
 * items that look like flyer deal records. Flipp sometimes wraps items under
 * different keys depending on the endpoint (items, flyer_items, results, etc.).
 */
function extractItemsFromResponse(data) {
  if (!data || typeof data !== "object") return [];

  // Direct array of items
  if (Array.isArray(data)) {
    if (data.length > 0 && ("current_price" in data[0] || "pre_price" in data[0])) {
      return data;
    }
  }

  // Wrapped under known keys
  for (const key of ["items", "flyer_items", "results", "data"]) {
    if (Array.isArray(data[key]) && data[key].length > 0) {
      const sample = data[key][0];
      if ("current_price" in sample || "pre_price" in sample || "name" in sample) {
        return data[key];
      }
    }
  }

  return [];
}

/**
 * Scrapes Flipp.com for a given ZIP code and returns raw deal items grouped
 * by merchant name (lowercased).
 *
 * @param {string}   zipCode     - e.g. "15944"
 * @param {string[]} targetStores - lowercased store names to filter by
 * @returns {Promise<Object>}  e.g. { "aldi": [...], "giant eagle": [...] }
 */
export async function scrapeFlipp(zipCode, targetStores) {
  const ua = randomUA();
  logger.info(`[flipp] Launching browser (UA: ${ua.slice(0, 40)}...)`);

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const context = await browser.newContext({
    userAgent: ua,
    viewport: { width: 1280, height: 900 },
    locale: "en-US",
    extraHTTPHeaders: {
      "Accept-Language": "en-US,en;q=0.9",
      "Accept": "application/json, text/plain, */*",
    },
  });

  // ── Collect all items seen from wishabi API responses ─────────────────────
  const collectedItems = [];

  context.on("response", async (response) => {
    try {
      const url = response.url();
      if (!WISHABI_PATTERN.test(url)) return;
      if (!response.ok()) return;

      const contentType = response.headers()["content-type"] ?? "";
      if (!contentType.includes("application/json")) return;

      const body = await response.json().catch(() => null);
      if (!body) return;

      const items = extractItemsFromResponse(body);
      if (items.length > 0) {
        logger.debug(`[flipp] Captured ${items.length} items from ${url.slice(0, 80)}`);
        collectedItems.push(...items);
      }
    } catch {
      // Non-fatal: some responses may not be JSON or may time out
    }
  });

  const page = await context.newPage();

  try {
    const url = `${FLIPP_BASE}/${zipCode}?locale=en-US`;
    logger.info(`[flipp] Navigating to ${url}`);

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: PAGE_TIMEOUT_MS,
    });

    // Wait for network to quiet down so all flyer requests complete
    await page.waitForLoadState("networkidle", { timeout: IDLE_TIMEOUT_MS })
      .catch(() => logger.warn("[flipp] Network did not fully idle — proceeding with collected data"));

    // Extra buffer for any deferred XHR calls
    await page.waitForTimeout(3_000);

    logger.info(`[flipp] Collected ${collectedItems.length} raw items total`);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }

  // ── Group by merchant ──────────────────────────────────────────────────────
  const grouped = {};
  for (const store of targetStores) {
    grouped[store] = [];
  }

  for (const item of collectedItems) {
    const merchant = (item.merchant_name ?? "").toLowerCase().trim();
    for (const target of targetStores) {
      if (merchant.includes(target) || target.includes(merchant)) {
        grouped[target].push(item);
        break;
      }
    }
  }

  for (const [store, items] of Object.entries(grouped)) {
    logger.info(`[flipp] ${store}: ${items.length} raw items captured`);
  }

  return grouped;
}
