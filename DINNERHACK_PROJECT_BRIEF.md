# DinnerHack — Project Brief

## What Is DinnerHack?
A React + Supabase meal planning web app that generates a 5-day weekly dinner menu based on grocery store Loss Leaders (deals ≥30% off). Built for families who want to eat well and save money automatically.

**Tagline:** Smart meals. Real savings.

**Owner:** Mike (liquifire340@gmail.com)

---

## Current Status
- ✅ Full React app built and running locally
- ✅ Code pushed to GitHub: https://github.com/mikemat234/dinnerhack
- ✅ Supabase project live (database, auth, RLS all configured)
- ✅ All 6 database tables created and working
- ✅ User auth working (email/password + magic link)
- ✅ App runs at localhost:5173 via `npm run dev`
- ⬜ Railway — scraper not yet deployed (needed for live weekly deals)
- ⬜ Vercel — not yet deployed (needed to go online publicly)
- ⬜ Custom domain — not yet purchased (GoDaddy, something like dinnerhack.com)

---

## Tech Stack
- **Frontend:** React 18 + Vite (no TypeScript)
- **Backend/DB:** Supabase (Postgres + Auth + RLS)
- **Scraper:** Node.js + Playwright on Railway (cron: every Monday 6am)
- **Hosting:** Vercel (planned)
- **Email:** Brevo (planned for onboarding sequences)
- **Payments:** TBD

---

## File Structure
```
dinnerhack/
├── src/
│   ├── App.jsx                          ← Root with 5-gate auth flow
│   ├── main.jsx                         ← Vite entry point
│   ├── lib/supabase.js                  ← Supabase client + full SQL schema
│   ├── data/mockData.js                 ← Dev fallback data
│   ├── hooks/
│   │   ├── useAuth.js                   ← Session management
│   │   ├── useProfile.js                ← Profile fetch/upsert
│   │   ├── useMenu.js                   ← Live menu from Supabase deals
│   │   ├── menuBuilder.js               ← Pure recipe scoring algorithm
│   │   ├── useGrocery.js                ← Grocery list state
│   │   └── useVault.js                  ← Recipe vault state
│   └── components/
│       ├── auth/AuthView.jsx            ← Sign in / sign up / magic link
│       ├── auth/OnboardingWizard.jsx    ← 3-step new user setup
│       ├── layout/Sidebar.jsx           ← Nav + user email + sign out
│       ├── menu/MenuDashboard.jsx       ← Main weekly menu view
│       ├── menu/DayCard.jsx
│       ├── menu/DealsStrip.jsx
│       ├── menu/StatsBar.jsx
│       ├── grocery/GroceryListView.jsx
│       ├── grocery/PantryCheck.jsx
│       ├── grocery/ShoppingList.jsx
│       ├── vault/RecipeVault.jsx
│       ├── vault/MealCard.jsx
│       ├── referral/ReferralPage.jsx
│       ├── settings/SettingsPage.jsx    ← Live profile editing + sign out
│       └── shared/Tag.jsx, HeadcountSelector.jsx
├── pipeline/                            ← Railway scraper
│   ├── scraper.js                       ← Entry point
│   ├── flipp.js                         ← Playwright Flipp.com scraper
│   ├── transform.js                     ← Deal normalization
│   ├── db.js                            ← Supabase upsert
│   ├── logger.js
│   ├── package.json
│   └── railway.json                     ← Cron: "0 6 * * 1" (Monday 6am)
├── package.json
├── vite.config.js
├── index.html
└── .env                                 ← Supabase keys (not in GitHub)
```

---

## Supabase Config
- **Project name:** dinnerhack
- **Project URL:** https://urgtcdwzjteslxqtecak.supabase.co
- **Tables:** deals, saved_meals, profiles, menu_headcounts, pipeline_runs, referrals
- **Auth:** Email/password + Magic Link enabled
- **RLS:** Enabled on all tables

---

## Key App Logic
- **Auth flow:** AppLoading → AuthView → AppLoading → OnboardingWizard → MainApp
- **Menu generation:** Top 5 deals by % off → score vault recipes → fill with synthetic meals
- **Onboarding:** 3 steps — store selection, no-no list, family headcount
- **Dev fallback:** If VITE_SUPABASE_URL not set, uses mock data automatically
- **Scraper target:** Flipp.com (ZIP 15944, New Florence PA) for Aldi + Giant Eagle

---

## Supabase Database Tables
| Table | Purpose |
|-------|---------|
| deals | Weekly loss leaders from scraper |
| saved_meals | User recipe vault |
| profiles | User preferences (stores, nono list, headcount) |
| menu_headcounts | Per-meal serving overrides |
| pipeline_runs | Scraper run logs |
| referrals | Referral tracking |

---

## Next Steps (in order)
1. **Railway** — deploy the pipeline scraper so real deals load every Monday
2. **Vercel** — deploy the React app so it's live on the internet
3. **Custom domain** — buy on GoDaddy, point at Vercel (dinnerhack.com or similar)
4. **Brevo email sequences** — welcome email, weekly menu ready, upgrade nudge
5. **Facebook compliance** — privacy policy, terms of service, data deletion flow
6. **Marketing launch** — Facebook ads, scorecard tracking

---

## Running Locally
```bash
cd C:\Users\Liqui\Documents\dinnerhack
npm run dev
# Open http://localhost:5173
```

---

## Notes
- Mike has zero prior coding experience — keep explanations clear and step-by-step
- Always confirm before running destructive commands
- The app is complete — remaining work is deployment and marketing only
