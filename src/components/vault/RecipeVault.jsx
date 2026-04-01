import { useVault } from "../../hooks/useVault";
import MealCard from "./MealCard";

export default function RecipeVault() {
  const { meals, totalCount, search, setSearch, deleteMeal, cookAgain } = useVault();

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 27, fontWeight: 800, color: "#111827", margin: "0 0 5px", letterSpacing: "-0.5px" }}>
          Recipe Vault
        </h1>
        <p style={{ color: "#9ca3af", fontSize: 14, margin: "0 0 18px" }}>
          Your family's personalized cookbook · {totalCount} saved meals
        </p>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Search by meal or tag..."
          style={{
            width: "100%", maxWidth: 380, padding: "10px 14px",
            border: "1.5px solid #e5e7eb", borderRadius: 10,
            fontSize: 14, outline: "none", background: "white", color: "#111827",
          }}
        />
      </div>

      {meals.length === 0 ? (
        <div style={{ textAlign: "center", color: "#9ca3af", padding: "60px 0", fontSize: 14 }}>
          No meals found · try a different search
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 14 }}>
          {meals.map(meal => (
            <MealCard key={meal.id} meal={meal} onDelete={deleteMeal} onCookAgain={cookAgain} />
          ))}
        </div>
      )}
    </div>
  );
}
