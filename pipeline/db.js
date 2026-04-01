// ─── db.js ────────────────────────────────────────────────────────────────────
// Supabase integration: upsert deals and log pipeline runs.
//
// Required Supabase table (run this SQL in your Supabase SQL editor):
//
//   CREATE TABLE IF NOT EXISTS deals (
//     id          TEXT PRIMARY KEY,          -- deterministic hash
//     store       TEXT NOT NULL,
//     item        TEXT NOT NULL,
//     orig        NUMERIC(8,2) NOT NULL,
//     sale        NUMERIC(8,2) NOT NULL,
//     unit        TEXT NOT NULL DEFAULT '/ea',
//     pct         INTEGER NOT NULL,
//     emoji       TEXT NOT NULL DEFAULT '🏷️',
//     category    TEXT NOT NULL DEFAULT 'General',
//     week_of     DATE NOT NULL,
//     created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
//   );
//
//   -- Index for fast weekly lookups
//   CREATE INDEX IF NOT EXISTS idx_deals_week_of ON deals(week_of);
//   CREATE INDEX IF NOT EXISTS idx_deals_store   ON deals(store);
//
//   -- Optional: pipeline run log table
//   CREATE TABLE IF NOT EXISTS pipeline_runs (
//     id          BIGSERIAL PRIMARY KEY,
//     run_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//     zip_code    TEXT,
//     stores      TEXT[],
//     total_deals INTEGER,
//     status      TEXT,        -- 'success' | 'partial' | 'error'
//     error_msg   TEXT
//   );
// ──────────────────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";
import logger from "./logger.js";

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY; // use service role key for server-side writes

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables. " +
      "Copy .env.example to .env and fill in your project credentials."
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

/**
 * Upsert an array of deal records into the 'deals' table.
 * Conflicts on 'id' (the deterministic hash) are ignored — so re-running
 * the scraper in the same week is safe and idempotent.
 *
 * @param {Object[]} deals - Transformed deal records from transform.js
 * @returns {Promise<{ inserted: number, errors: number }>}
 */
export async function upsertDeals(deals) {
  if (!deals || deals.length === 0) {
    logger.info("[db] No deals to upsert.");
    return { inserted: 0, errors: 0 };
  }

  const supabase = getSupabaseClient();

  // Batch in chunks of 100 to stay within Supabase payload limits
  const BATCH_SIZE = 100;
  let inserted = 0;
  let errors   = 0;

  for (let i = 0; i < deals.length; i += BATCH_SIZE) {
    const batch = deals.slice(i, i + BATCH_SIZE);
    const { error, count } = await supabase
      .from("deals")
      .upsert(batch, {
        onConflict:        "id",
        ignoreDuplicates:  true, // silently skip rows whose id already exists
        count:             "exact",
      });

    if (error) {
      logger.error(`[db] Batch ${i / BATCH_SIZE + 1} error: ${error.message}`);
      errors += batch.length;
    } else {
      logger.info(`[db] Batch ${i / BATCH_SIZE + 1}: upserted ${count ?? batch.length} rows`);
      inserted += count ?? batch.length;
    }
  }

  return { inserted, errors };
}

/**
 * Log a pipeline run to the pipeline_runs table (best-effort, non-fatal).
 *
 * @param {{ zipCode: string, stores: string[], totalDeals: number, status: string, errorMsg?: string }} opts
 */
export async function logPipelineRun({ zipCode, stores, totalDeals, status, errorMsg }) {
  try {
    const supabase = getSupabaseClient();
    await supabase.from("pipeline_runs").insert({
      zip_code:    zipCode,
      stores:      stores,
      total_deals: totalDeals,
      status:      status,
      error_msg:   errorMsg ?? null,
    });
  } catch (err) {
    // Non-fatal: don't let logging failures break the pipeline
    logger.warn(`[db] Failed to log pipeline run: ${err.message}`);
  }
}

/**
 * Fetch this week's deals (for dry-run verification).
 *
 * @param {string} weekOf - ISO date string "YYYY-MM-DD"
 */
export async function fetchDealsForWeek(weekOf) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("deals")
    .select("*")
    .eq("week_of", weekOf)
    .order("pct", { ascending: false });

  if (error) throw new Error(`[db] fetchDealsForWeek error: ${error.message}`);
  return data;
}
