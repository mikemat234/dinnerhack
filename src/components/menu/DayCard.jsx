import Tag from "../shared/Tag";
import HeadcountSelector from "../shared/HeadcountSelector";

export default function DayCard({ day, updateHeadcount, toggleSaved }) {
  return (
    <div style={{
      background: "white", border: "1px solid #e5e7eb", borderRadius: 14,
      padding: "16px 20px", display: "flex", alignItems: "center", gap: 18,
    }}>
      {/* Day + emoji */}
      <div style={{ minWidth: 72, textAlign: "center", flexShrink: 0 }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: "#9ca3af",
          textTransform: "uppercase", letterSpacing: "0.5px",
        }}>
          {day.day}
        </div>
        <div style={{ fontSize: 34, marginTop: 4 }}>{day.emoji}</div>
      </div>

      <div style={{ width: 1, background: "#f3f4f6", alignSelf: "stretch", flexShrink: 0 }} />

      {/* Meal info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 1,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {day.meal}
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 9 }}>{day.subtitle}</div>
          </div>
          <button onClick={() => toggleSaved(day.id)} style={{
            border: "none", background: "none", cursor: "pointer",
            fontSize: 18, padding: "2px 0", flexShrink: 0, lineHeight: 1,
          }}>
            {day.isSaved ? "❤️" : "🤍"}
          </button>
        </div>

        {/* Tags */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {day.dealIngredients.map(ing => (
            <Tag key={ing} color="amber">🏷️ {ing}</Tag>
          ))}
          {day.tags.map(t => (
            <Tag key={t} color="gray">{t}</Tag>
          ))}
        </div>

        {/* Meta */}
        <div style={{ display: "flex", gap: 18, fontSize: 12 }}>
          <span style={{ color: "#9ca3af" }}>⏱ {day.prepTime}</span>
          <span style={{ color: "#16a34a", fontWeight: 600 }}>
            💰 ${day.costPerServing.toFixed(2)}/serving
          </span>
          <span style={{ color: "#059669", fontWeight: 600 }}>
            Saves ${day.weekSaved.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Headcount */}
      <div style={{ textAlign: "center", flexShrink: 0, minWidth: 80 }}>
        <div style={{
          fontSize: 10, color: "#9ca3af", fontWeight: 600,
          textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 8,
        }}>
          👥 Tonight
        </div>
        <HeadcountSelector value={day.headcount} onChange={v => updateHeadcount(day.id, v)} />
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>
          ${(day.costPerServing * day.headcount).toFixed(2)} total
        </div>
      </div>
    </div>
  );
}
