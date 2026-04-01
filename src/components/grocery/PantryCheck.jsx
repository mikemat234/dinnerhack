export default function PantryCheck({ pantryStaples, pantryChecked, togglePantry, onNext }) {
  return (
    <div>
      <div style={{
        background: "white", border: "1px solid #e5e7eb",
        borderRadius: 14, padding: "22px 24px", marginBottom: 18,
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
          🏠 What do you already have?
        </h2>
        <p style={{ color: "#9ca3af", fontSize: 13, margin: "0 0 20px" }}>
          Check items you already have at home — we'll remove them from your list.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {pantryStaples.map(item => {
            const checked = pantryChecked.has(item);
            return (
              <button key={item} onClick={() => togglePantry(item)} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px",
                border: `1.5px solid ${checked ? "#86efac" : "#e5e7eb"}`,
                borderRadius: 9, background: checked ? "#f0fdf4" : "white",
                cursor: "pointer", textAlign: "left", transition: "all 0.1s",
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                  border: `2px solid ${checked ? "#16a34a" : "#d1d5db"}`,
                  background: checked ? "#16a34a" : "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {checked && <span style={{ color: "white", fontSize: 11, fontWeight: 900 }}>✓</span>}
                </div>
                <span style={{
                  fontSize: 13, fontWeight: checked ? 600 : 500,
                  color: checked ? "#15803d" : "#374151",
                }}>
                  {item}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {pantryChecked.size > 0 && (
        <div style={{
          background: "#f0fdf4", border: "1px solid #bbf7d0",
          borderRadius: 10, padding: "10px 16px", marginBottom: 14,
          fontSize: 13, color: "#15803d", fontWeight: 600,
        }}>
          ✅ {pantryChecked.size} item{pantryChecked.size !== 1 ? "s" : ""} already at home — removed from your list!
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={onNext} style={{
          background: "#16a34a", color: "white", border: "none",
          borderRadius: 10, padding: "12px 28px",
          fontWeight: 700, fontSize: 14, cursor: "pointer",
        }}>
          Build My List →
        </button>
      </div>
    </div>
  );
}
