// ─── RecipePreview.jsx ─────────────────────────────────────────────────────────
// In-app recipe preview.
// • Mobile  → slides up from the bottom (bottom sheet)
// • Desktop → centered modal overlay
//
// The iframe src points directly to the recipe anchor (e.g. #recipe-ingredients)
// to skip AllRecipes' blog intro and land as close to the recipe as possible.
//
// Props:
//   meal       – string (meal name shown in the header)
//   recipeUrl  – string (full URL including anchor)
//   onClose    – fn (called when user dismisses)
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect, useCallback } from "react";

// Detect mobile by viewport width
function useIsMobile() {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
}

export default function RecipePreview({ meal, recipeUrl, onClose }) {
  const isMobile = useIsMobile();

  // Close on Escape key
  const handleKey = useCallback((e) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    // Prevent body scroll while open
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [handleKey]);

  // ── Shared styles ──────────────────────────────────────────────────────────
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
    width: isMobile ? "100%" : "min(820px, 92vw)",
    height: isMobile ? "88vh" : "82vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 -4px 32px rgba(0,0,0,0.18)",
    animation: isMobile ? "slideUp 0.28s ease" : "fadeIn 0.2s ease",
  };

  return (
    <>
      {/* CSS animations */}
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

      {/* Backdrop — click to close */}
      <div style={overlayStyle} onClick={onClose}>

        {/* Sheet — stop propagation so clicking inside doesn't close */}
        <div style={sheetStyle} onClick={e => e.stopPropagation()}>

          {/* ── Header ──────────────────────────────────────────────────────── */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 18px", borderBottom: "1px solid #f3f4f6", flexShrink: 0,
          }}>
            {/* Drag handle (mobile) */}
            {isMobile && (
              <div style={{
                position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)",
                width: 36, height: 4, borderRadius: 2, background: "#d1d5db",
              }} />
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>📖</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>
                  {meal}
                </div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                  Recipe via AllRecipes
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Open in Browser button */}
              <a
                href={recipeUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                title="Open in browser"
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "6px 12px", borderRadius: 8,
                  background: "#f3f4f6", border: "none",
                  fontSize: 12, fontWeight: 600, color: "#374151",
                  textDecoration: "none", cursor: "pointer",
                }}
              >
                ↗ Open in Browser
              </a>

              {/* Close button */}
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
          </div>

          {/* ── iframe ──────────────────────────────────────────────────────── */}
          <iframe
            src={recipeUrl}
            title={meal}
            style={{
              flex: 1, border: "none", width: "100%",
              background: "#fafafa",
            }}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            loading="lazy"
          />

          {/* ── Footer note ─────────────────────────────────────────────────── */}
          <div style={{
            padding: "8px 18px", borderTop: "1px solid #f3f4f6",
            fontSize: 11, color: "#9ca3af", textAlign: "center", flexShrink: 0,
          }}>
            Recipe content from AllRecipes · press Escape or tap outside to close
          </div>
        </div>
      </div>
    </>
  );
}
