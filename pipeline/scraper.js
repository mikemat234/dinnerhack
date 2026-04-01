// ─── scraper.js ───────────────────────────────────────────────────────────────
// DinnerHack Deal Scraper — Entry Point
//
// Orchestrates the full ETL pipeline:
//   1. Scrape  → flipp.js   (Playwright + Flipp.com network interception)
//   2. Transform → transform.js (normalise, filter, assign emoji)
//   3. Load    → db.js      (Supabase upsert)
//
// Usage:
//   node scraper.js                    # production run
//   node scraper.js --dry-run          # scrape + transform, skip DB write
//   node scraper.js --store aldi       # run only one store
//   node scraper.js --zip 15944        # override ZIP code
// ──────────────────────────────────────────────────────────────────────────────

import "dotenv/config";
import { scrapeFlipp }           from "./flipp.js";
import { transformItems, currentWeekOf } from "./transform.js";
import { upsertDeals, logPipelineRun }   from "./db.js";
import logger                    from "./logger.js";

// ── Config ────────────────────────────────────────────────────────────────────

const DEFAULT_ZIP    = process.env.ZIP_CODE ?? "15944";
const MAX_RETRIES    = Number(process.env.MAX_RETRIES  ?? 2);
const RETRY_DELAY_MS = Number(process.env.RETRY_DELAY  ?? 10_000);

/** Map of lowercased Flipp merchant name → display name stored in Supabase */
const STORE_MAP = {
  "aldi":        "Aldi",
  "giant eagle": "Giant Eagle",
};

// ── CLI arg parsing ───────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    dryRun: false,
    zip:    DEFAULT_ZIP,
    stores: Object.keys(STORE_MAP), // default: all stores
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--dry-run")          opts.dryRun = true;
    if (args[i] === "--zip"   && args[i+1]) { opts.zip    = args[++i]; }
    if (args[i] === "--store" && args[i+1]) { opts.stores = [args[++i].toLowerCase()]; }
  }

  return opts;
}

// ── Retry helper ──────────────────────────────────────────────────────────────

async function withRetry(fn, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt > retries) throw err;
      logger.warn(`[scraper] Attempt ${attempt} failed: ${err.message}. Retrying in ${RETRY_DELAY_MS / 1000}s…`);
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
    }
  }
}

// ── Main pipeline ─────────────────────────────────────────────────────────────

async function run() {
  const { dryRun, zip, stores } = parseArgs();
  const weekOf = currentWeekOf();

  logger.info(`[scraper] ── DinnerHack Deal Scraper ──────────────────`);
  logger.info(`[scraper] ZIP: ${zip} | Week of: ${weekOf} | Stores: ${stores.join(", ")}`);
  if (dryRun) logger.info("[scraper] DRY RUN — DB write skipped");

  let allDeals      = [];
  let status        = "success";
  let errorMsg;

  try {
    // ── Step 1: Scrape ───────────────────────────────────────────────────────
    logger.info("[scraper] Step 1/3 — Scraping Flipp.com…");

    const rawByStore = await withRetry(() => scrapeFlipp(zip, stores));

    // ── Step 2: Transform ────────────────────────────────────────────────────
    logger.info("[scraper] Step 2/3 — Transforming items…");

    for (const storeKey of stores) {
      const displayName = STORE_MAP[storeKey] ?? storeKey;
      const rawItems    = rawByStore[storeKey] ?? [];

      logger.info(`[scraper]   ${displayName}: ${rawItems.length} raw → filtering for ≥${process.env.MIN_DISCOUNT_PCT ?? 30}% off…`);

      const deals = transformItems(displayName, rawItems);
      logger.info(`[scraper]   ${displayName}: ${deals.length} loss leaders found`);

      if (process.env.LOG_LEVEL === "debug") {
        for (const d of deals) {
          logger.debug(`[scraper]     ${d.emoji} ${d.item} — ${d.store} $${d.sale} (was $${d.orig}, −${d.pct}%)`);
        }
      }

      allDeals.push(...deals);
    }

    logger.info(`[scraper] Total deals this week: ${allDeals.length}`);

    // ── Step 3: Load ─────────────────────────────────────────────────────────
    if (dryRun) {
      logger.info("[scraper] Step 3/3 — DRY RUN: skipping DB write");
      logger.info("[scraper] Preview of deals that would be upserted:");
      allDeals.forEach(d =>
        logger.info(`  ${d.emoji}  [${d.store}] ${d.item} — $${d.sale} (was $${d.orig}) −${d.pct}% | ${d.category}`)
      );
    } else {
      logger.info("[scraper] Step 3/3 — Upserting to Supabase…");
      const { inserted, errors } = await upsertDeals(allDeals);
      logger.info(`[scraper] Upsert complete: ${inserted} inserted, ${errors} errors`);
      if (errors > 0) status = "partial";
    }

  } catch (err) {
    status   = "error";
    errorMsg = err.message;
    logger.error(`[scraper] Pipeline failed: ${err.message}`);
    logger.error(err.stack ?? "");
  } finally {
    // ── Log the run ──────────────────────────────────────────────────────────
    if (!dryRun) {
      await logPipelineRun({
        zipCode:    zip,
        stores:     stores.map(s => STORE_MAP[s] ?? s),
        totalDeals: allDeals.length,
        status,
        errorMsg,
      });
    }
  }

  if (status === "error") {
    process.exitCode = 1;
  }

  logger.info(`[scraper] ── Done (${status}) ────────────────────────────`);
}

run();
