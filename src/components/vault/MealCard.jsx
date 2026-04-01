import Tag from "../shared/Tag";

export default function MealCard({ meal, onDelete, onCookAgain }) {
  return (
    <div style={{
      background: "white", border: "1px solid #e5e7eb",
      borderRadius: 14, padding: "18px 20px",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 38 }}>{meal.emoji}</span>
        <div style={{ textAlign: "right" }}>
          <div style={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            {[1, 2, 3, 4, 5].map(s => (
              <span key={s} style={{ color: s <= meal.rating ? "#f59e0b" : "#e5e7eb", fontSize: 13 }}>★</span>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>Saved {meal.date}</div>
        </div>
      </div>

      <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 7, lineHeight: 1.35 }}>
        {meal.name}
      </div>

      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
        {meal.tags.map(t => <Tag key={t} color="gray">{t}</Tag>)}
      </div>

      <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#9ca3af", marginBottom: 14 }}>
        <span>👥 {meal.headcount}</span>
        <span>💰 ${meal.cost.toFixed(2)}/serving</span>
        <span>🍳 ×{meal.cooked}</span>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
        <button onClick={() => onCookAgain(meal.id)} style={{
          flex: 1, background: "#f0fdf4", border: "1px solid #bbf7d0",
          color: "#16a34a", borderRadius: 8, padding: "9px",
          fontWeight: 600, fontSize: 13, cursor: "pointer",
        }}>
          Cook This Again
        </button>
        <button onClick={() => onDelete(meal.id)} style={{
          background: "#fef2f2", border: "1px solid #fecaca",
          color: "#ef4444", borderRadius: 8, padding: "9px 11px",
          fontWeight: 600, fontSize: 13, cursor: "pointer",
        }}>
          ✕
        </button>
      </div>
    </div>
  );
}
