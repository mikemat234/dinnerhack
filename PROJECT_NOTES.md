# DinnerHack — Project Notes

Last updated: April 13, 2026 (Session 4)

---

## What DinnerHack Does
A weekly meal planning app that scrapes grocery store deals, finds the best loss
leaders, and builds a personalized 5-day dinner menu around them — with real
recipes, cost-per-serving calculations, and weekly savings totals. Users pick
their stores, set food restrictions, and get a ready-to-shop grocery list every week.

---

## Live URLs
- **App:** https://www.dinnerhack.app
- **GitHub:** https://github.com/mikemat234/dinnerhack
- **Vercel:** https://vercel.com/mikemat234s-projects/dinnerhack
- **Supabase:** https://supabase.com (project: urgtcdwzjteslxqtecak)
- **Railway:** https://railway.app (pipeline service: amiable-miracle)

---

## Project Location (local)
```
C:\Users\Liqui\Documents\dinnerhack
```
Push changes using push-changes.bat in the root of that folder.
Do NOT move this folder — OneDrive caused major issues when it moved files.
If OneDrive tries to move files again, restore immediately and keep at this path.

---

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend/DB | Supabase (Postgres + Auth + RLS) |
| Hosting | Vercel (auto-deploy from GitHub main) |
| Pipeline | Node.js on Railway (weekly cron) |
| Payments | Stripe (not built yet) |

---

## Project Structure
```
dinner hack/
├── src/
│   ├── components/
│   │   ├── menu/MenuDashboard.jsx      ← Weekly menu display
│   │   ├── menu/DayCard.jsx            ← Day card with Regenerate + View Recipe
│   │   ├── grocery/GroceryListView.jsx ← Grocery list (pantry check + shopping list)
│   │   ├── grocery/ShoppingList.jsx    ← List UI + Send to Instacart/Walmart buttons (mockup)
│   │   ├── grocery/PantryCheck.jsx     ← Pantry staples checklist
│   │   ├── vault/RecipeVault.jsx       ← User's saved meals
│   │   ├── auth/OnboardingWizard.jsx   ← 3-step new user setup
│   │   ├── auth/AuthView.jsx           ← Login/signup
│   │   ├── settings/SettingsPage.jsx   ← Store picker, no-no list, family name
│   │   └── referral/ReferralPage.jsx   ← Referral page (placeholder)
│   ├── hooks/
│   │   ├── useMenu.js                  ← Main data hook (deals + recipes + vault)
│   │   ├── menuBuilder.js              ← Pure functions: scoring, building menu
│   │   ├── useProfile.js               ← User profile fetch/save
│   │   ├── useAuth.js                  ← Supabase auth
│   │   ├── useGrocery.js               ← Grocery list state (still on mockData!)
│   │   └── useVault.js                 ← Saved meals vault
│   └── lib/supabase.js                 ← Supabase client
├── pipeline/
│   ├── scraper.js                      ← Entry point — orchestrates ETL
│   ├── flipp.js                        ← Fetches deals from Flipp API
│   ├── transform.js                    ← Normalizes/filters raw deal data
│   ├── db.js                           ← Supabase upsert functions
│   ├── fetchRecipes.js                 ← Spoonacular recipes (not in cron — deprecated)
│   ├── promoteRecipes.js               ← Promotes popular meals → community pool
│   ├── seedDeals.js                    ← Manual deal seeding for testing
│   ├── logger.js                       ← Logging utility
│   ├── railway.json                    ← Railway cron + build config
│   └── .env                            ← Pipeline credentials (NOT in git)
└── supabase/
    └── recipes-table.sql               ← SQL schema reference
```

---

## Supabase Tables
| Table | Purpose | Written By |
|-------|---------|-----------|
| `deals` | Weekly grocery deals from Flipp | pipeline/scraper.js |
| `saved_meals` | User's recipe vault | frontend (user action) |
| `profiles` | User preferences, stores, nono list | frontend |
| `recipes` | Spoonacular recipe data | pipeline/fetchRecipes.js |
| `community_recipes` | Popular meals promoted from saved_meals | pipeline/promoteRecipes.js |
| `pipeline_runs` | Scraper run log | pipeline/scraper.js |

---

## Recipe Priority Stack
1. **User's saved meals** (personal vault) — highest priority
2. **Community recipes** (meals saved by 3+ different users) — auto-grows
3. **Spoonacular recipes** (real recipes from API) — 41 loaded
4. **Static RECIPE_DATABASE** (hardcoded fallback) — always works

ALL recipe links go to: `https://www.allrecipes.com/search?q={meal name}`

---

## Weekly Pipeline (Railway cron)
**Schedule:** `0 23 * * 3,0` — Wednesday + Sunday 11pm UTC (7pm Eastern)

```
node scraper.js        → scrapes Flipp API → writes to deals table
node promoteRecipes.js → promotes popular meals → community_recipes table
```

**Manual retrigger:** Railway → amiable-miracle → Deployments → Deploy button

---

## Environment Variables

### Frontend (.env in root — committed)
```
VITE_SUPABASE_URL=https://urgtcdwzjteslxqtecak.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_Mru44KsjUDTjw3bu5UR76A_8Y6t4SbB
```

### Pipeline (pipeline/.env — NOT in git)
```
SUPABASE_URL=https://urgtcdwzjteslxqtecak.supabase.co
SUPABASE_SERVICE_KEY=<sb_secret_... from Supabase Settings → API Keys>
ZIP_CODE=15944
MIN_DISCOUNT_PCT=30
```

---

## Known Bugs (fix next session first)

### 🔴 BUG — week_of wrong on Sunday scraper runs
- **File:** `pipeline/transform.js` line 129
- **Problem:** When scraper runs Sunday night, `currentWeekOf()` calculates the
  PREVIOUS Monday instead of the upcoming Monday. Deals get stamped with last
  week's date → app queries current week → finds nothing → falls back to mock data.
- **Fix:** Change line 129:
  - FROM: `const diff = (day === 0 ? -6 : 1 - day);`
  - TO:   `const diff = (day === 0 ? 1  : 1 - day);`
- **After fix:** Retrigger scraper on Railway so this week's data writes correctly

### 🔴 BUG — Grocery list still on mock data
- **File:** `src/hooks/useGrocery.js`
- **Problem:** Imports `GROCERY_ITEMS` and `PANTRY_STAPLES` from `mockData.js`
  instead of using real deal/menu data. Grocery list never changes.
- **Fix:** Wire useGrocery.js to pull items from the real weekly menu deals
- **Also:** `ShoppingList.jsx` has STORES hardcoded as `["Aldi", "Giant Eagle"]`
  — needs to use `profile.stores` dynamically

### 🟡 UI — Cart buttons are mockups only
- **File:** `src/components/grocery/ShoppingList.jsx`
- **Problem:** "Send to Instacart" and "Send to Walmart Pickup" buttons just
  flip a state variable — no API call happens, nothing goes to any cart.
- **Fix:** Wire real Instacart API (after Developer Platform approval) and
  Walmart cart API behind these buttons

---

## Revenue Strategy

### Subscriptions — Stripe + Supabase
- **Stack:** Stripe for payments, Supabase for subscription state
- **Why not App Store:** Web app = no Apple/Google 30% cut. Stripe fee = ~2.9% + $0.30
- **Flow:** User pays on dinnerhack.app → Stripe webhook → update `profiles.subscription_status`
- **Schema ready:** `subscription_status` and `billing_date` columns exist in profiles table
- **Not built yet** — build after core data pipeline is fixed

### Instacart Affiliate — $10 per qualifying order
- **Status:** Application submitted April 13, 2026 via Impact.com
- **Commission:** $10 flat per order (not percentage)
- **Referral window:** 7 days last-click attribution
- **Payout:** ~35-55 days after month end, minimum $10, via bank or PayPal
- **FTC disclosure required:** Add "Affiliate partner" note near cart buttons
- **Revenue at scale:** 2,500 users × 1 order/month = $25,000/month
- **Also apply for:** Instacart Developer Platform (unlocks multi-item cart API)
  → https://www.instacart.com/company/business/developers

### Referral Viral Loop
- **Mechanic:** Refer 2 friends who sign up → earn 1 free month
- **Safety:** If 1 referral cancels → immediate notification → 14-day grace period
  to find replacement before free month is clawed back
- **Dashboard:** ReferralPage.jsx shows live count "2 of 2 active ✓"
- **Requires:** Stripe to be live first (to credit free month via Stripe coupon)

---

## Launch Checklist — Everything Needed to Go Live

### 🔴 CRITICAL — Fix Before Anything Else
- [ ] Fix week_of bug in `pipeline/transform.js` (1 line, 5 min)
- [ ] Retrigger Railway scraper after fix — verify real deals appear in app
- [ ] Wire `useGrocery.js` to real menu/deal data (not mockData.js)
- [ ] Fix `ShoppingList.jsx` STORES hardcode → use profile.stores

### 🟠 CORE FEATURES — App Must Have These to Launch
- [ ] Last week's deals fallback in `useMenu.js` (if 0 deals this week, show last week)
- [ ] Replace Instacart/Walmart mockup buttons with single "📋 Copy Shopping List" button
      → Copies full list as plain text to clipboard → "Copied!" toast confirmation
      → Works with Instacart, Walmart, AnyList, Notes app — anything
      → Real Instacart cart button added later once Developer Platform approved
- [ ] Stripe subscription payments wired up
- [ ] Paywall — gate features behind subscription_status = "active"
- [ ] Sign up / pricing page on dinnerhack.app for new visitors

### 🟠 MARKETING ENGINE — Cannot Launch Without These
- [ ] Referral system — unique code per user, track signups, reward free month at 2 referrals
- [ ] Referral safety net — if 1 referral cancels → immediate email/notification to user
      → 14-day grace period to replace referral before free month is removed
- [ ] Referral dashboard in ReferralPage.jsx — show "2 of 2 active ✓" or "1 of 2 ⚠️ Replace by [date]"
- [ ] Weekly Monday morning email — "Your DinnerHack menu is ready 🍽️"
      → Shows week's meals, total savings, link to open app
      → This is the #1 retention tool — users who don't get the email forget the app
- [ ] Welcome email — sent immediately on signup, explains the app, sets expectations
- [ ] Referral cancelled email — "One of your referrals cancelled — find a replacement by [date]"
- [ ] Email provider needed: Resend.com or SendGrid (both have free tiers, simple API)

### 🟡 IMPORTANT — Launch Better With These
- [ ] Push notifications — "Your new menu is ready!" on Sundays
- [ ] App resilience — graceful error states when scraper fails

### 🟢 GROWTH — Add After Launch
- [ ] Instacart Developer Platform integration (multi-item cart deep link)
- [ ] Walmart cart API integration
- [ ] Native iOS app (App Store) — enables push notifications, home screen icon
- [ ] Native Android app (Play Store)
- [ ] Community recipes visible in app (needs 3+ users saving same meal)
- [ ] Store expansion beyond Western PA/Ohio/MD/WV launch region

### 🔵 BUSINESS — Before Marketing Push
- [ ] Apply for Instacart Developer Platform (Mike — link above)
- [ ] Stripe account set up at stripe.com
- [ ] Privacy Policy page on dinnerhack.app (required for App Store + legal)
- [ ] Terms of Service page on dinnerhack.app
- [ ] FTC affiliate disclosure added to grocery list UI
- [ ] Business bank account for revenue
- [ ] DinnerHack LLC or business entity registered

---

## How to Push Changes
```
Double-click: C:\Users\Liqui\Documents\dinnerhack\push-changes.bat
```
Vercel auto-deploys on GitHub push (check vercel.com for status)

## How to Run Pipeline Manually
```
Open Command Prompt in: C:\dinner hack\pipeline
node scraper.js           ← scrape fresh deals
node promoteRecipes.js    ← promote community recipes
node seedDeals.js         ← seed test deals
node promoteRecipes.js --dry-run  ← preview without writing
```

## Instacart Affiliate Links
- Affiliate Program: https://www.instacart.com/company/affiliate
- Developer Platform: https://www.instacart.com/company/business/developers
- Impact.com dashboard: https://app.impact.com
