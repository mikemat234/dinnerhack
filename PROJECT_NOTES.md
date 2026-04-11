# DinnerHack — Project Notes

Last updated: April 10, 2026 (Session 2)

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

### ✅ FIXED — Recipe link fallback (April 10, 2026)
- Spoonacular recipes with a real `source_url` → link to that site (Foodista, Food.com, etc.)
- Spoonacular recipes with null `source_url` → link to AllRecipes search for that meal name
- Static fallback recipes → always link to AllRecipes search
- AllRecipes preferred over spoonacular.com because: multiple recipe options, step photos, familiar UX
- Wife-approved ✓

### ✅ FIXED — Cron schedule updated (April 10, 2026)
- Changed from `0 6 * * 1` (Monday 6am) to `0 23 * * 3,0` (Wed + Sun 11pm UTC)
- Set via `pipeline/railway.json` (not Railway dashboard UI — file takes precedence)

### 🟡 Railway Cron — promoteRecipes not scheduled yet
- `promoteRecipes.js` exists but hasn't been added to Railway cron schedule
- Add it to run weekly after scraper.js and fetchRecipes.js

### 🟡 Rotate Supabase Service Key
- The service role key was shared in chat on April 10, 2026
- Go to Supabase → Project Settings → API → regenerate service_role key
- Update Railway env var and pipeline/.env with the new key

### 🔵 NEXT SESSION — Store Picker (onboarding)
**Decision made:** Use store selection instead of geolocation.

**Why store picker beats geolocation:**
- Users know which stores they shop at
- National chains (Walmart, ALDI, Target, Dollar General) have identical deals nationwide
- Regional chains (Giant Eagle, Kroger, Publix) are self-selecting — users only see what's in their area
- No location permission dialog, no privacy concerns, less friction to sign up
- Respects real-world constraints: closest store wins, gas is $4+/gallon

**Core value prop copy:** "Pick the stores you already go to. We'll plan meals around their sales so every trip counts."

**What to build:**
1. Onboarding screen — grid of store logos with checkboxes (Walmart, ALDI, Giant Eagle, Dollar General, Target, Kroger, Publix, Safeway, Meijer, etc.)
2. Add `preferred_stores TEXT[]` column to `profiles` table in Supabase
3. Filter deals in `useMenu.js` to only show deals from user's selected stores
4. Minimum 1 store required to continue onboarding

**Estimated build time:** 2-3 hours

---

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
