export default function StatsBar({ totalSaved, totalCost, avgPerServing }) {
  const stats = [
    { label: "Weekly Savings",   value: `$${totalSaved.toFixed(2)}`,    bg: "#f0fdf4", border: "#bbf7d0", textColor: "#16a34a" },
    { label: "Est. Total Cost",  value: `$${totalCost.toFixed(2)}`,     bg: "white",   border: "#e5e7eb", textColor: "#111827" },
    { label: "Avg. Per Serving", value: `$${avgPerServing.toFixed(2)}`, bg: "white",   border: "#e5e7eb", textColor: "#111827" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 22 }}>
      {stats.map(s => (
        <div key={s.label} style={{
          background: s.bg, border: `1px solid ${s.border}`,
          borderRadius: 12, padding: "14px 18px",
        }}>
          <div style={{
            fontSize: 11, color: "#9ca3af", fontWeight: 600,
            textTransform: "uppercase", letterSpacing: "0.4px",
          }}>
            {s.label}
          </div>
          <div style={{ fontSize: 25, fontWeight: 800, color: s.textColor, marginTop: 3 }}>
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}
