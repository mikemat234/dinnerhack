// ─── Sidebar.jsx ───────────────────────────────────────────────────────────────
// Fixed left navigation rail.
// Props:
//   active      – currently selected tab id
//   setActive   – tab setter
//   totalSaved  – number (dollars saved this week for the savings pill)
//   user        – Supabase User object (for email display)
//   signOut     – async fn from useAuth (for sign-out button)
// ──────────────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "menu",     label: "This Week's Menu", icon: "📅" },
  { id: "grocery",  label: "Grocery List",     icon: "🛒" },
  { id: "vault",    label: "Recipe Vault",     icon: "📖" },
  { id: "refer",    label: "Refer Friends",    icon: "🎁" },
  { id: "settings", label: "Settings",         icon: "⚙️" },
];

export default function Sidebar({ active, setActive, totalSaved, user, signOut }) {
  // Abbreviate email for display: show only the part before @
  const emailLabel = user?.email
    ? user.email.length > 22
      ? user.email.slice(0, 22) + "…"
      : user.email
    : "";

  return (
    <div style={{
      width: 240, flexShrink: 0, position: "fixed", top: 0, left: 0,
      height: "100vh", background: "white", borderRight: "1px solid #e5e7eb",
      display: "flex", flexDirection: "column", zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid #f3f4f6" }}>
        <div style={{ fontSize: 21, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px" }}>
          🍽️ DinnerHack
        </div>
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3, fontWeight: 500 }}>
          Smart meals. Real savings.
        </div>
      </div>

      {/* Savings pill */}
      <div style={{
        margin: "14px 14px 0",
        background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
        border: "1px solid #a7f3d0", borderRadius: 10, padding: "11px 14px",
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          This week
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#065f46", marginTop: 1 }}>
          ${totalSaved.toFixed(2)} saved
        </div>
        <div style={{ fontSize: 11, color: "#34d399", marginTop: 1 }}>
          vs. regular grocery prices
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: "14px 10px", flex: 1 }}>
        {NAV_ITEMS.map(item => {
          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => setActive(item.id)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 8, marginBottom: 2,
              border: "none", cursor: "pointer", textAlign: "left",
              background: isActive ? "#f0fdf4" : "transparent",
              color: isActive ? "#15803d" : "#6b7280",
              fontWeight: isActive ? 700 : 500,
              fontSize: 14, transition: "all 0.12s",
            }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User identity + sign-out */}
      <div style={{ padding: "12px 14px", borderTop: "1px solid #f3f4f6" }}>
        {/* Email chip */}
        {emailLabel && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 10px", borderRadius: 8,
            background: "#f9fafb", marginBottom: 8,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "#e5e7eb", display: "flex",
              alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: "#6b7280", flexShrink: 0,
            }}>
              {(user?.email?.[0] ?? "?").toUpperCase()}
            </div>
            <span style={{ fontSize: 12, color: "#374151", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {emailLabel}
            </span>
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={signOut}
          style={{
            width: "100%", padding: "9px 12px",
            background: "transparent", border: "1px solid #e5e7eb",
            borderRadius: 8, cursor: "pointer",
            fontSize: 13, fontWeight: 600, color: "#6b7280",
            display: "flex", alignItems: "center", gap: 8,
            transition: "all 0.12s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.borderColor = "#fecaca"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6b7280"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
        >
          <span>↩</span> Sign Out
        </button>
      </div>
    </div>
  );
}
