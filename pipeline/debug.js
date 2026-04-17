import "dotenv/config";
import { scrapeFlipp } from "./flipp.js";

const ZIP = process.env.ZIP_CODE ?? "15944";
const results = await scrapeFlipp(ZIP, ["shop 'n save", "wegman", "martin"]);

for (const [store, items] of Object.entries(results)) {
  console.log(`\n=== ${store.toUpperCase()}: ${items.length} items ===`);
  if (items.length === 0) { console.log("  (no data)"); continue; }
  for (const item of items.slice(0, 3)) {
    console.log(`  name: ${item.name} | price: ${item.price} | pre_price: ${item.pre_price ?? "none"} | category: ${item.category ?? "none"}`);
  }
}
