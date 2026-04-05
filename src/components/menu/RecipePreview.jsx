// ─── RecipePreview.jsx ─────────────────────────────────────────────────────────
// In-app recipe card — no iframe (AllRecipes blocks embedding).
// Shows meal info we already have + a prominent "Open Full Recipe" link.
// • Mobile  → slides up from the bottom (bottom sheet)
// • Desktop → centered modal overlay
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect, useCallback } from "react";

function useIsMobile() {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
}

export default function RecipePreview({ day, onClose }) {
  const isMobile = useIsMobile();

  const handleKey = useCallback((e) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [handleKey]);

  const overlayStyle = {
    position: "fixed", inset: 0, zIndex: 1000,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: isMobile ? "flex-end" : "center",
    justifyContent: "center",
    padding: isMobile ? 0 : 24,
  };

  const sheetStyle = {
    background: "white",
    borderRadius: isMobile ? "20px 20px 0 0" : 18,
    width: isMobile ? "100%" : "min(560px, 92vw)",
    maxHeight: isMobile ? "88vh" : "90vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 -4px 32px rgba(0,0,0,0.18)",
    animation: isMobile ? "slideUp 0.28s ease" : "fadeIn 0.2s ease",
  };

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1);    }
        }
      `}</style>

      <div style={overlayStyle} onClick={onClose}>
        <div style={sheetStyle} onClick={e => e.stopPropagation()}>

          {/* ── Drag handle (mobile) ──────────────────────────────────────── */}
          {isMobile && (
            <div style={{
              width: 36, height: 4, borderRadius: 2, background: "#d1d5db",
              margin: "10px auto 0",
            }} />
          )}

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 18px", borderBottom: "1px solid #f3f4f6", flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 22 }}>{day.emoji}</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>
                  {day.meal}
                </div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                  {day.subtitle}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: "50%",
                border: "none", background: "#f3f4f6",
                cursor: "pointer", fontSize: 16, color: "#6b7280",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              ✕
            </button>
          </div>

          {/* ── Body ───────────────────────────────────────────────────────── */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 18px", display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Quick stats row */}
            <div style={{
              display: "flex", gap: 12, flexWrap: "wrap",
            }}>
              <div style={statBox}>
                <span style={statLabel}>⏱ Prep Time</span>
                <span style={statValue}>{day.prepTime}</span>
              </div>
              <div style={statBox}>
                <span style={statLabel}>💰 Per Serving</span>
                <span style={statValue}>${day.costPerServing.toFixed(2)}</span>
              </div>
              <div style={statBox}>
                <span style={statLabel}>💚 Weekly Savings</span>
                <span style={{ ...statValue, color: "#16a34a" }}>${day.weekSaved.toFixed(2)}</span>
              </div>
            </div>

            {/* Deal ingredients */}
            {day.dealIngredients?.length > 0 && (
              <div>
                <div style={sectionLabel}>🏷️ This week's deal ingredients</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                  {day.dealIngredients.map(ing => (
                    <span key={ing} style={{
                      padding: "5px 12px", borderRadius: 20,
                      background: "#fef9c3", color: "#854d0e",
                      fontSize: 13, fontWeight: 600,
                      border: "1px solid #fde68a",
                    }}>
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {day.tags?.length > 0 && (
              <div>
                <div style={sectionLabel}>🍽️ Meal type</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                  {day.tags.map(t => (
                    <span key={t} style={{
                      padding: "5px 12px", borderRadius: 20,
                      background: "#f3f4f6", color: "#4b5563",
                      fontSize: 13, border: "1px solid #e5e7eb",
                    }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Open on AllRecipes CTA */}
            <div style={{
              background: "#f0fdf4", borderRadius: 14,
              border: "1.5px solid #bbf7d0",
              padding: "18px 20px",
              display: "flex", flexDirection: "column", gap: 10, alignItems: "center",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 13, color: "#166534", fontWeight: 600 }}>
                Ready to cook? Get the full recipe with ingredients &amp; step-by-step instructions:
              </div>
              <a
                href={day.recipeUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "12px 24px", borderRadius: 10,
                  background: "#16a34a", color: "white",
                  fontSize: 14, fontWeight: 700,
                  textDecoration: "none",
                  boxShadow: "0 2px 8px rgba(22,163,74,0.3)",
                }}
              >
                📖 Open Full Recipe on AllRecipes ↗
              </a>
              <div style={{ fontSize: 11, color: "#6b7280" }}>
                Opens in a new tab
              </div>
            </div>

          </div>

          {/* ── Footer ─────────────────────────────────────────────────────── */}
          <div style={{
            padding: "10px 18px", borderTop: "1px solid #f3f4f6",
            fontSize: 11, color: "#9ca3af", textAlign: "center", flexShrink: 0,
          }}>
            Press Escape or tap outside to close
          </div>

        </div>
      </div>
    </>
  );
}

// ── Local style constants ───────────────────────────────────────────────────
const statBox = {
  flex: 1, minWidth: 100,
  background: "#f9fafb", borderRadius: 10,
  border: "1px solid #e5e7eb",
  padding: "10px 14px",
  display: "flex", flexDirection: "column", gap: 4,
};
const statLabel = { fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" };
const statValue = { fontSize: 15, fontWeight: 700, color: "#111827" };
const sectionLabel = { fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.4px" };
