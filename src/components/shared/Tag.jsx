const COLOR_MAP = {
  gray:  { bg: "#f3f4f6", border: "#e5e7eb", text: "#6b7280" },
  amber: { bg: "#fef3c7", border: "#fde68a", text: "#b45309" },
  red:   { bg: "#fef2f2", border: "#fecaca", text: "#dc2626" },
  green: { bg: "#f0fdf4", border: "#bbf7d0", text: "#16a34a" },
};

export default function Tag({ children, color = "gray" }) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.gray;
  return (
    <span style={{
      background: c.bg,
      border: `1px solid ${c.border}`,
      borderRadius: 6,
      padding: "2px 8px",
      fontSize: 11,
      fontWeight: 600,
      color: c.text,
    }}>
      {children}
    </span>
  );
}
