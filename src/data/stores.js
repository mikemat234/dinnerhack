// ─── stores.js ────────────────────────────────────────────────────────────────
// Single source of truth for the grocery chains DinnerHack supports.
//
// Both OnboardingWizard (Step 1) and SettingsPage → "My Stores" import from
// here so the list and visual treatment never drift apart.
//
// Shape:
//   {
//     name:  string — canonical chain name (what we store in profiles.stores)
//     short: string — 1–2 letter badge code
//     bg:    string — brand-ish background hex for the badge tile
//     fg:    string — badge text colour (always high-contrast on `bg`)
//   }
//
// Matching note: `profiles.stores` is an array of the `name` field. The
// scraper writes `deals.store` using the same canonical names, so equality
// matching is sufficient (no fuzzy matching needed). If you add a chain here,
// make sure the scraper normalises its output to one of these names.
// ──────────────────────────────────────────────────────────────────────────────

export const STORES = [
  { name: "Walmart",         short: "W",  bg: "#0071ce", fg: "#ffffff" },
  { name: "Aldi",            short: "A",  bg: "#ff7a00", fg: "#ffffff" },
  { name: "Giant Eagle",     short: "GE", bg: "#e51937", fg: "#ffffff" },
  { name: "Dollar General",  short: "DG", bg: "#fdb714", fg: "#000000" },
  { name: "Target",          short: "T",  bg: "#cc0000", fg: "#ffffff" },
  { name: "Kroger",          short: "K",  bg: "#004b93", fg: "#ffffff" },
  { name: "Publix",          short: "P",  bg: "#007749", fg: "#ffffff" },
  { name: "Safeway",         short: "S",  bg: "#e31837", fg: "#ffffff" },
  { name: "Meijer",          short: "M",  bg: "#d40029", fg: "#ffffff" },
  { name: "Costco",          short: "C",  bg: "#005daa", fg: "#ffffff" },
  { name: "Sam's Club",      short: "SC", bg: "#0067a0", fg: "#ffffff" },
  { name: "Trader Joe's",    short: "TJ", bg: "#b33a2c", fg: "#ffffff" },
  { name: "Whole Foods",     short: "WF", bg: "#00674b", fg: "#ffffff" },
];

/** Array of just the canonical store names. Useful for defaults / validation. */
export const STORE_NAMES = STORES.map(s => s.name);

/** Lookup by name → full store object (or undefined). */
export function getStore(name) {
  return STORES.find(s => s.name === name);
}
