# DinnerHack — Project Notes

Last updated: April 13, 2026 (Session 4)

---

## What DinnerHack Does
A weekly meal planning app that scrapes grocery store deals (Aldi, Giant Eagle),
finds the best loss leaders, and builds a personalized 5-day dinner menu around
them — with real recipes, cost-per-serving calculations, and weekly savings totals.

---

## Live URLs
- **App:** https://www.dinnerhack.app
- **GitHub:** https://github.com/mikemat234/dinnerhack
- **Vercel:** https://vercel.com/mikemat234s-projects/dinnerhack
- **Supabase:** https://supabase.com (project: urgtcdwzjteslxqtecak)
- **Railway:** https://railway.app (pipeline service: amiable-miracle)

---

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend/DB | Supabase (Postgres + Auth + RLS) |
| Hosting | Vercel (auto-deploy from GitHub main) |
| Pipeline | Node.js on Railway (weekly cron) |
| Recipes API | Spoonacular (free tier, 150 req/day) |

---

## Project Structure
```
dinnerhack/
├── src/
│   ├── components/
│   │   ├── menu/
│   │   │   └── DayCard.jsx          ← Day card with Regenerate + View Recipe
│   │   ├── vault/RecipeVault.jsx    ← User's saved meals
│   │   ├── auth/                    ← Login/signup/onboarding
│   │   └── shared/                  ← Tag, HeadcountSelector
│   ├── hooks/
│   │   ├── useMenu.js               ← Main data hook (deals + recipes + vault)
│   │   └── menuBuilder.js           ← Pure functions: scoring, building menu
│   └── lib/
│       └── supabase.js              ← Supabase client
├── pipeline/
│   ├── scraper.js                   ← Entry point — orchestrates ETL
│   ├── flipp.js                     ← Scrapes Flipp.com for weekly deals
│   ├── transform.js                 ← Normalizes/filters raw deal data
│   ├── db.js                        ← Supabase upsert functions
│   ├── fetchRecipes.js              ← Calls Spoonacular, populates recipes table
│   ├── promoteRecipes.js            ← Promotes popular saved meals → community pool
│   ├── seedDeals.js                 ← Manual deal seeding for testing
│   ├── logger.js                    ← Logging utility
│   └── .env                         ← Pipeline credentials (not in git)
└── supabase/
    └── recipes-table.sql            ← SQL to create recipes table
```

---

## Supabase Tables
| Table | Purpose | Written By |
|-------|---------|-----------|
| `deals` | Weekly grocery deals from Flipp | pipeline/scraper.js |
| `saved_meals` | User's recipe vault | frontend (user action) |
| `profiles` | User preferences, nono list, stores | frontend |
| `recipes` | Spoonacular recipe data | pipeline/fetchRecipes.js |
| `community_recipes` | Popular meals promoted from saved_meals | pipeline/promoteRecipes.js |
| `pipeline_runs` | Scraper run log | pipeline/scraper.js |

---

## Recipe Priority Stack (how menu suggestions are ranked)
1. **User's saved meals** (personal vault) — highest priority, best personalization
2. **Community recipes** (meals saved by 3+ different subscribers) — grows automatically
3. **Spoonacular recipes** (real recipes fetched weekly from API) — 41 recipes loaded
4. **Static RECIPE_DATABASE** (hardcoded fallback in menuBuilder.js) — always works

---

## Environment Variables

### Frontend (.env in root)
```
VITE_SUPABASE_URL=https://urgtcdwzjteslxqtecak.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_Mru44KsjUDTjw3bu5UR76A_8Y6t4SbB
```

### Pipeline (pipeline/.env — NOT in git)
```
SUPABASE_URL=https://urgtcdwzjteslxqtecak.supabase.co
SUPABASE_SERVICE_KEY=<service role key — rotate this, was shared in chat>
SPOONACULAR_API_KEY=e56f147ec621495eb8a89586a95261ca
ZIP_CODE=15944
MIN_DISCOUNT_PCT=30
```

### Railway Environment Variables
Same as pipeline/.env above — set in Railway → amiable-miracle → Variables

---

## Weekly Pipeline (runs on Railway cron)
**Schedule:** `0 23 * * 3,0` — Wednesday 11pm + Sunday 11pm UTC (7pm Eastern)
- Wednesday catches: Giant Eagle, ALDI, Kroger, Publix, Safeway
- Sunday catches: Target (new ad starts Sunday), Walmart (updates Thu/Fri)

```
node scraper.js        ← scrapes Flipp.com deals → populates deals table
node fetchRecipes.js   ← fetches Spoonacular recipes → populates recipes table
node promoteRecipes.js ← promotes popular saved meals → community_recipes table
```

**Manual retrigger:** Railway → amiable-miracle → click Deploy button

---

## Known Issues / Next Steps

### ✅ FIXED — Flipp Scraper (April 10, 2026)
- **Was:** `scraper.js` returned 0 items — old API domain `backflipp.wishabi.com` gone
- **Fix:** Discovered new endpoint via Chrome DevTools Network tab:
  - **Flyer listing:** `GET https://dam.flippenterprise.net/api/flipp/data?locale=en&postal_code={zip}`
    → returns `{ flyers: [...] }` — each flyer has `id`, `merchant`, `valid_from`, `valid_to`
  - **Flyer items:** `GET https://dam.flippenterprise.net/api/flipp/flyers/{id}/flyer_items?locale=en`
    → returns array of item objects (unchanged, was already working)
- **Also fixed:** merchant field is `merchant` not `merchant_name` in new API response
- **Confirmed:** 57 flyers returned for ZIP 15944 including Giant Eagle, ALDI, Walmart, Target, Dollar General

### ✅ DECIDED — AllRecipes is the primary recipe destination (April 12, 2026)
- ALL recipe links go to `https://www.allrecipes.com/search?q={meal name}` — no exceptions
- Spoonacular `source_url` (Foodista, Food.com, etc.) is ignored for links — only used internally for data
- Reasons: more recipe choices, step-by-step photos, universally trusted, wife-approved ✓
- Updated in `menuBuilder.js` — both Spoonacular cards and vault meal cards

### ✅ FIXED — Cron schedule updated (April 10, 2026)
- Changed from `0 6 * * 1` (Monday 6am) to `0 23 * * 3,0` (Wed + Sun 11pm UTC)
- Set via `pipeline/railway.json` (not Railway dashboard UI — file takes precedence)

### ✅ DONE — Supabase Service Key Rotated (April 12, 2026)
- Old legacy JWT service_role key was exposed in chat — no longer in use
- New key: `sb_secret_...` from Supabase → Settings → API Keys → Secret keys
- Updated in Railway → Variables → SUPABASE_SERVICE_KEY ✓
- Updated in pipeline/.env locally ✓
- Old key is now irrelevant as pipeline uses the new one

### ✅ DONE — promoteRecipes.js added to Railway cron (April 12, 2026)
- `pipeline/railway.json` startCommand now chains: `node scraper.js && node promoteRecipes.js`
- promoteRecipes only runs if scraper succeeds (&&)
- Runs every Wednesday + Sunday at 11pm UTC alongside the deal scrape

### ✅ DONE — Store Picker (April 12, 2026)
**Decision:** Store selection over geolocation — users know where they shop.

**Why:**
- National chains (Walmart, ALDI, Target, Dollar General) = same deals nationwide
- Regional chains (Giant Eagle, Kroger, Publix) = self-selecting, users only pick what exists near them
- No location permission dialog, no privacy concerns, less friction
- Gas is $4+/gallon — closest store wins, not best deal 20 miles away

**What was built:**
- `OnboardingWizard.jsx` Step 1 — 12 stores with emojis in a 2-column grid, checkmarks on select, min 1 required
- `useMenu.js` — after fetching deals, filters to only deals from `profile.stores` (case-insensitive match)
- Supabase `profiles` table — `preferred_stores TEXT[]` column added (profile already had `stores` column in use)
- Default pre-selection: Walmart + ALDI

**Supported stores (matches pipeline/scraper.js STORE_MAP):**
Walmart 🛒, ALDI 🛍️, Giant Eagle 🦅, Kroger 🏪, Target 🎯, Dollar General 💲, Meijer 🛒, Publix 🏪, Safeway 🏪, Food Lion 🦁, Whole Foods 🌿, Trader Joe's 🌺

---

### ✅ DECIDED — Regional Launch Strategy (April 12, 2026)
- **Target region:** Western PA, Eastern Ohio, Maryland, West Virginia
- **Why:** Covers Giant Eagle territory + all national chains already in scraper
- **No geolocation needed** — store picker handles this naturally (users self-select regional stores)
- **Expand later** as user base grows outside the region

### ✅ DONE — Settings page store picker synced (April 12, 2026)
- `SettingsPage.jsx` ALL_STORES updated to full 12-store list with emojis
- Matches OnboardingWizard exactly — same names, same emojis, same UX
- Default fallback corrected to Walmart + ALDI
- Store buttons now show emoji → flips to ✓ when selected

---

### 💬 DISCUSSED — Instacart Affiliate + Shopping List Integration (April 12, 2026)

**Plan (in order):**

**IMPORTANT DISCOVERY (April 13, 2026):** "Send to Instacart" and "Send to Walmart Pickup"
buttons are already in `ShoppingList.jsx` — but they are UI MOCKUPS ONLY. `sendToCart()`
just sets a state variable to show a "Sent!" style. No API calls, no real cart push happens.
Grocery list is also still on mockData.js — not wired to real deal data yet.

**Phase 1 — Fix the data pipeline first** (next session — CRITICAL)
- Fix `currentWeekOf()` bug in `pipeline/transform.js` line 129:
  - Current: `const diff = (day === 0 ? -6 : 1 - day);`  ← Sunday goes BACK 6 days to last Monday
  - Fix:     `const diff = (day === 0 ? 1  : 1 - day);`  ← Sunday goes FORWARD to next Monday
  - Bug effect: scraper runs Sunday 11pm → stamps deals with week_of = last Monday (April 6)
    → Monday morning app queries week_of = April 13 → finds nothing → falls back to mockData
- After fix: retrigger scraper on Railway so fresh deals write with correct week_of
- Wire `useGrocery.js` to real menu deal data instead of importing from mockData.js

**Phase 2 — Copy List button** (~30 min, interim solution)
- Add "Copy Shopping List" to `GroceryListView.jsx`
- Formats real ingredient list as plain text → clipboard
- Bridges the gap while Instacart API approval is pending

**Phase 3 — Instacart Affiliate + Developer Platform** (Mike applies — links below)
- Apply to Instacart Affiliate Program: https://www.instacart.com/company/affiliate
  - Runs through Impact.com, no minimum follower count, ~1-2 week approval
  - Commission: up to 15% per qualifying order, paid ~55 days after month end
- Apply for Instacart Developer Platform: https://www.instacart.com/company/business/developers
  - Unlocks multi-item cart API: send ingredient list → pre-filled Instacart cart link

**Phase 4 — Real cart integration** (after affiliate + dev platform approval)
- Wire up "Send to Instacart" button in `ShoppingList.jsx` with real API call + affiliate link
- Wire up "Send to Walmart Pickup" button with real Walmart cart API
- Both buttons already exist in the UI — just need the real logic behind them

**Revenue estimate at 5,000 subscribers / 2,500 Instacart users:**
- Conservative (3% commission, 1 order/month): ~$6,400/month
- Middle (5%, 1.5 orders/month): ~$16,000/month
- Optimistic (8%, 2 orders/month): ~$34,000/month
- Key: commission only counts if user taps YOUR Instacart link — in-app button is critical

---

### 🔵 NEXT SESSION — Priority Order

1. **Fix week_of bug in transform.js** (5 min — MUST DO FIRST)
   - File: `pipeline/transform.js` line 129
   - Change: `const diff = (day === 0 ? -6 : 1 - day);`
   - To:     `const diff = (day === 0 ? 1  : 1 - day);`
   - Then retrigger scraper on Railway so this week's data writes correctly

2. **Wire useGrocery.js to real deal data** (1-2 hrs)
   - Currently imports GROCERY_ITEMS from mockData.js
   - Needs to pull from the real weekly menu/deals (same data useMenu.js uses)
   - ShoppingList.jsx also has STORES hardcoded as ["Aldi", "Giant Eagle"] — needs to use user's profile.stores

3. **Last week's deals fallback** (1 hr)
   - In `useMenu.js`: if current week returns 0 deals, auto-query previous week
   - Show subtle banner: "Showing last week's deals — new ones coming soon"
   - Prevents blank menu if scraper fails or week_of mismatch happens again

4. **Copy Shopping List button** (~30 min)
   - Add to `GroceryListView.jsx` alongside existing cart buttons
   - Format list as plain text → clipboard → "Copied!" toast

5. **Apply for Instacart affiliate + Developer Platform** (Mike does this)
   - Links in Phase 3 section above
   - Do it this week — 1-2 week approval clock starts on application date

6. **Real cart integration** (after approval)
   - "Send to Instacart" + "Send to Walmart" buttons already exist in ShoppingList.jsx
   - Just need real API logic wired behind them

---

### 💬 DECIDED — Payments: Stripe + Supabase (April 13, 2026)
- **Stack:** Stripe for payment processing, Supabase for subscription state
- **Why not Apple/Google IAP:** DinnerHack is a web app — Apple/Google 30% tax only applies
  to native App Store apps using in-app purchase. Web payments go direct to Stripe.
- **Stripe fee:** ~2.9% + $0.30 per transaction (vs 30% App Store cut)
- **How it works:**
  - User subscribes on dinnerhack.app via Stripe checkout
  - Stripe webhook fires on successful payment → backend updates `profiles.subscription_status` to "active"
  - App reads subscription_status to gate premium features
  - `profiles.subscription_status` column already exists in Supabase schema ✓
  - `profiles.billing_date` column already exists for next billing display ✓
- **Warning:** If DinnerHack ever publishes a native iOS app to the App Store, Apple requires
  in-app purchase for digital subscriptions sold inside the app (enforced aggressively).
  Stay web-first to avoid this entirely.
- **Build priority:** After core data pipeline is fixed and grocery list is wired to real data

### 💬 DECIDED — Referral Viral Loop (April 13, 2026)
- **Mechanic:** User refers 2 friends who sign up → user gets 1 free month
- **ReferralPage.jsx already exists** in the app (`src/components/referral/ReferralPage.jsx`)
  — likely a placeholder, needs to be wired up
- **What needs to be built:**
  - Unique referral code per user (stored in profiles table)
  - Signup flow reads referral code from URL param → credits the referrer
  - Track referral count per user in profiles or a referrals table
  - When referral count hits 2 → grant 1 free month (via Stripe coupon or manual status update)
  - Referral dashboard in ReferralPage.jsx showing count + status
- **Viral math:** If 20% of users refer 2 people → meaningful compounding growth
  - 100 users → 40 referrals → those 40 refer 16 more → etc.
  - Even low conversion rates produce steady organic growth
- **Stripe integration for free month:** Apply a coupon/credit via Stripe API when threshold hit
- **Trigger:** Both referred users complete their FIRST paid month ($14 each)
  - No survival gate needed — nobody will pay $14, wait 3-4 weeks for a refund,
    just to save a friend $14. Abuse risk is negligible at this price point.
  - First payment clears → referral counts → hit 2 → Stripe credits referrer 1 free month
- **Build priority:** After Stripe payments are live (referral reward needs payment system to credit)

### 🟢 Community Recipes — needs real subscriber data to activate
- Table is created, promotion job is written
- Won't show results until 3+ users save the same meal
- Threshold can be lowered: `node promoteRecipes.js --threshold 2`

---

## How to Deploy Changes
1. Edit files in `C:\Users\Liqui\Documents\dinnerhack`
2. Double-click `push-changes.bat` (updates the staged files list first)
3. Vercel auto-deploys on GitHub push — check vercel.com for status

## How to Seed Deals for Testing
```
cd C:\Users\Liqui\Documents\dinnerhack\pipeline
node seedDeals.js
```

## How to Re-fetch Spoonacular Recipes
```
cd C:\Users\Liqui\Documents\dinnerhack\pipeline
node fetchRecipes.js
```

## How to Check Community Recipe Promotion
```
cd C:\Users\Liqui\Documents\dinnerhack\pipeline
node promoteRecipes.js --dry-run
```
