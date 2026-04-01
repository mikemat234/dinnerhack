function StepBtn({ children, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 28, height: 28, borderRadius: "50%",
      border: "1.5px solid #e5e7eb", background: "white",
      cursor: "pointer", display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: 15, color: "#6b7280",
      fontWeight: 700, lineHeight: 1, padding: 0, flexShrink: 0,
    }}>
      {children}
    </button>
  );
}

export default function HeadcountSelector({ value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <StepBtn onClick={() => onChange(Math.max(1, value - 1))}>−</StepBtn>
      <span style={{
        minWidth: 20, textAlign: "center",
        fontWeight: 700, fontSize: 15, color: "#111827",
      }}>
        {value}
      </span>
      <StepBtn onClick={() => onChange(Math.min(12, value + 1))}>+</StepBtn>
    </div>
  );
}
