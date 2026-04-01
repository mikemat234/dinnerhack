import { useState } from "react";

const REFERRAL_LINK = "dinnerhack.com/invite/MIKE2026";

const HOW_IT_WORKS = [
  { icon: "🔗", text: "Share your link — your friend gets a $9.50 trial month (half off)." },
  { icon: "👥", text: "Two friends sign up and keep their subscription for a full month." },
  { icon: "🎉", text: "Your next month is completely free — no coupon needed, auto-applied." },
  { icon: "♾️",  text: "No cap! Refer every month and save every month." },
];

export default function ReferralPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div>
      <div style={{ marginBottom: 26 }}>
        <h1 style={{ fontSize: 27, fontWeight: 800, color: "#111827", margin: "0 0 5px", letterSpacing: "-0.5px" }}>
          Refer Friends, Eat Free 🎁
        </h1>
        <p style={{ color: "#9ca3af", fontSize: 14, margin: 0 }}>
          Gift friends a $9.50 trial month. Get 2 to sign up and yours is on us.
        </p>
      </div>

      {/* Progress tracker */}
      <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 14, padding: "22px 24px", marginBottom: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 16 }}>
          📊 Your March Progress
        </div>
        <div style={{ display: "flex", gap: 14, marginBottom: 18 }}>
          {[
            { n: 1, filled: true,  name: "Sarah K.", sub: "Joined Mar 12" },
            { n: 2, filled: false, name: "Friend 2", sub: "Waiting..."    },
          ].map(f => (
            <div key={f.n} style={{
              flex: 1, textAlign: "center",
              background: f.filled ? "#f0fdf4" : "#f9fafb",
              border: `2px solid ${f.filled ? "#16a34a" : "#e5e7eb"}`,
              borderRadius: 12, padding: "16px 20px",
            }}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>{f.filled ? "✅" : "👤"}</div>
              <div style={{ fontWeight: 700, color: f.filled ? "#16a34a" : "#9ca3af", fontSize: 14 }}>
                Friend {f.n}
              </div>
              <div style={{ fontSize: 12, color: f.filled ? "#6b7280" : "#d1d5db", marginTop: 2 }}>
                {f.filled ? f.name : f.sub}
              </div>
              <div style={{ fontSize: 11, color: f.filled ? "#16a34a" : "#d1d5db", marginTop: 1 }}>
                {f.sub}
              </div>
            </div>
          ))}
        </div>
        <div style={{
          background: "#fffbeb", border: "1px solid #fde68a",
          borderRadius: 10, padding: "12px 16px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>⚡</span>
          <div>
            <div style={{ fontWeight: 700, color: "#92400e", fontSize: 13 }}>
              1 more friend needed for your free month!
            </div>
            <div style={{ fontSize: 12, color: "#b45309", marginTop: 1 }}>
              Your April subscription will be $0.00 when you refer one more friend this month.
            </div>
          </div>
        </div>
      </div>

      {/* Share link */}
      <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 14, padding: "22px 24px", marginBottom: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 12 }}>
          🔗 Your Gift Link
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <div style={{
            flex: 1, background: "#f9fafb", border: "1px solid #e5e7eb",
            borderRadius: 9, padding: "11px 14px",
            fontSize: 13, color: "#374151", fontFamily: "monospace",
          }}>
            {REFERRAL_LINK}
          </div>
          <button onClick={handleCopy} style={{
            background: copied ? "#16a34a" : "#111827",
            color: "white", border: "none", borderRadius: 9,
            padding: "11px 20px", fontWeight: 600, fontSize: 13,
            cursor: "pointer", minWidth: 95, transition: "background 0.2s",
          }}>
            {copied ? "✓ Copied!" : "📋 Copy"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["📱 Text", "✉️ Email", "📸 Story"].map(btn => (
            <button key={btn} style={{
              flex: 1, background: "#f3f4f6", border: "none",
              borderRadius: 8, padding: "9px",
              fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer",
            }}>
              {btn}
            </button>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 14, padding: "22px 24px" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 16 }}>How It Works</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {HOW_IT_WORKS.map((row, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{
                width: 34, height: 34, background: "#f0fdf4", border: "1px solid #bbf7d0",
                borderRadius: "50%", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 16, flexShrink: 0,
              }}>
                {row.icon}
              </div>
              <div style={{ paddingTop: 7, fontSize: 13, color: "#374151", lineHeight: 1.55 }}>
                {row.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
