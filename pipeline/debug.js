import "dotenv/config";
import { scrapeFlipp } from "./flipp.js";

const ZIP = process.env.ZIP_CODE ?? "15944";
const results = await scrapeFlipp(ZIP, ["giant eagle"]);
const items = results["giant eagle"] ?? [];

console.log("\n=== FIRST 5 RAW GIANT EAGLE ITEMS (ALL FIELDS) ===");
for (const item of items.slice(0, 5)) {
  const clean = { ...item };
  delete clean.merchant_name;
  delete clean.merchant;
  console.log(JSON.stringify(clean, null, 2));
  console.log("---");
}
