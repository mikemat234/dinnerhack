// ─── supabase.js ──────────────────────────────────────────────────────────────
// Supabase client. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your
// .env file to connect to your project.
//
// ── Schema (paste into Supabase SQL editor) ───────────────────────────────────
//
// -- 1. Deals (written by the pipeline scraper, read by all authenticated users)
// CREATE TABLE deals (
//   id          TEXT PRIMARY KEY,
//   store       TEXT NOT NULL,
//   item        TEXT NOT NULL,
//   orig        NUMERIC(8,2) NOT NULL,
//   sale        NUMERIC(8,2) NOT NULL,
//   unit        TEXT NOT NULL DEFAULT '/ea',
//   pct         INTEGER NOT NULL,
//   emoji       TEXT NOT NULL DEFAULT '🏷️',
//   category    TEXT NOT NULL DEFAULT 'General',
//   week_of     DATE NOT NULL,
//   created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
// );
// CREATE INDEX idx_deals_week_of ON deals(week_of);
//
// -- 2. Saved Meals / Recipe Vault (per-user; includes ingredients for deal matching)
// CREATE TABLE saved_meals (
//   id               TEXT PRIMARY KEY,          -- "{user_id}_{menu_item_id}"
//   user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
//   name             TEXT NOT NULL,
//   subtitle         TEXT,
//   date_saved       DATE NOT NULL,
//   rating           SMALLINT DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
//   tags             TEXT[] DEFAULT '{}',
//   emoji            TEXT DEFAULT '🍽️',
//   cooked_count     INTEGER DEFAULT 0,
//   headcount        SMALLINT DEFAULT 4,
//   cost_per_serving NUMERIC(6,2),
//   ingredients      TEXT[] DEFAULT '{}',       -- used by useMenu recipe matching
//   prep_time        TEXT,
//   created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
// );
// CREATE INDEX idx_saved_meals_user ON saved_meals(user_id);
//
// -- 3. Profiles (one row per user; created by a trigger on auth.users insert)
// CREATE TABLE profiles (
//   id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
//   family_name         TEXT DEFAULT 'My Family',
//   stores              TEXT[] DEFAULT '{Aldi,"Giant Eagle"}',
//   nono_list           TEXT[] DEFAULT '{}',    -- allergens / dislikes
//   default_headcount   SMALLINT DEFAULT 4,     -- used to pre-fill per-meal headcount
//   subscription_status TEXT DEFAULT 'trial',
//   billing_date        DATE,
//   created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
// );
//
// -- Auto-create profile on signup
// CREATE OR REPLACE FUNCTION public.handle_new_user()
// RETURNS TRIGGER AS $$
// BEGIN
//   INSERT INTO public.profiles (id) VALUES (NEW.id);
//   RETURN NEW;
// END;
// $$ LANGUAGE plpgsql SECURITY DEFINER;
//
// CREATE TRIGGER on_auth_user_created
//   AFTER INSERT ON auth.users
//   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
//
// -- 4. Menu headcount overrides (cross-device headcount persistence)
// CREATE TABLE menu_headcounts (
//   id         BIGSERIAL PRIMARY KEY,
//   user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
//   item_name  TEXT NOT NULL,                   -- matches saved_meals.name
//   week_of    DATE NOT NULL,
//   headcount  SMALLINT NOT NULL DEFAULT 4,
//   UNIQUE(user_id, item_name, week_of)
// );
//
// -- 5. Pipeline run log (written by the scraper, readable by admins)
// CREATE TABLE pipeline_runs (
//   id          BIGSERIAL PRIMARY KEY,
//   run_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//   zip_code    TEXT,
//   stores      TEXT[],
//   total_deals INTEGER,
//   status      TEXT,
//   error_msg   TEXT
// );
//
// -- 6. Referrals
// CREATE TABLE referrals (
//   id           BIGSERIAL PRIMARY KEY,
//   referrer_id  UUID NOT NULL REFERENCES auth.users(id),
//   referee_email TEXT NOT NULL,
//   joined_at    TIMESTAMPTZ,
//   credited     BOOLEAN DEFAULT FALSE,
//   created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
// );
//
// ── Row Level Security ────────────────────────────────────────────────────────
//
// -- Deals: public read, scraper writes via service role (bypasses RLS)
// ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "deals_public_read" ON deals FOR SELECT USING (true);
//
// -- Saved meals: users manage their own rows only
// ALTER TABLE saved_meals ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "saved_meals_owner" ON saved_meals FOR ALL USING (auth.uid() = user_id);
//
// -- Profiles: users manage their own profile only
// ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "profiles_owner" ON profiles FOR ALL USING (auth.uid() = id);
//
// -- Menu headcounts: users manage their own rows only
// ALTER TABLE menu_headcounts ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "headcounts_owner" ON menu_headcounts FOR ALL USING (auth.uid() = user_id);
//
// -- Referrals: referrer sees their own outbound referrals only
// ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "referrals_owner" ON referrals FOR ALL USING (auth.uid() = referrer_id);
// ──────────────────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL     ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[DinnerHack] Supabase env vars not set. " +
    "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
