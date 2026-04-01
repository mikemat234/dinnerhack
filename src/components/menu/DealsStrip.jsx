export default function DealsStrip({ deals }) {
  return (
    <div style={{
      background: "white", border: "1px solid #e5e7eb",
      borderRadius: 14, padding: "18px 20px", marginBottom: 20,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
          🔥 This Week's Loss Leaders
        </span>
        <span style={{
          background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a",
          fontSize: 11, fontWeight: 600, borderRadius: 20, padding: "2px 9px",
        }}>
          Aldi &amp; Giant Eagle
        </span>
      </div>

      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
        {deals.map(deal => (
          <div key={deal.id} style={{
            minWidth: 128, background: "#f9fafb", border: "1px solid #e5e7eb",
            borderRadius: 10, padding: "11px 13px", flexShrink: 0,
          }}>
            <div style={{ fontSize: 24, marginBottom: 5 }}>{deal.emoji}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#111827", lineHeight: 1.3, marginBottom: 5 }}>
              {deal.item}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 5 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: "#16a34a" }}>
                ${deal.sale.toFixed(2)}
              </span>
              <span style={{ fontSize: 10, color: "#d1d5db", textDecoration: "line-through" }}>
                ${deal.orig.toFixed(2)}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{
                background: "#fef3c7", border: "1px solid #fde68a",
                borderRadius: 4, padding: "1px 5px",
                fontSize: 10, fontWeight: 700, color: "#b45309",
              }}>
                −{deal.pct}%
              </span>
              <span style={{ fontSize: 9, color: "#9ca3af" }}>{deal.store}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
