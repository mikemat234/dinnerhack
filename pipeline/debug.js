import "dotenv/config";
import { scrapeFlipp } from "./flipp.js";

const ZIP = process.env.ZIP_CODE ?? "15944";
const results = await scrapeFlipp(ZIP, ["save a lot"]);
const items = results["save a lot"] ?? [];

console.log("\n=== SAVE A LOT: total items fetched:", items.length, "===");
console.log("\n=== FIRST 5 RAW SAVE A LOT ITEMS (ALL FIELDS) ===");
for (const item of items.slice(0, 5)) {
  const clean = { ...item };
  delete clean.merchant_name;
  delete clean.merchant;
  console.log(JSON.stringify(clean, null, 2));
  console.log("---");
}
