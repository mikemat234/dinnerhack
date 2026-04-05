import DealsStrip from "./DealsStrip";
import StatsBar from "./StatsBar";
import DayCard from "./DayCard";

// ── Loading skeleton ───────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      background: "white", border: "1px solid #e5e7eb", borderRadius: 14,
      padding: "16px 20px", display: "flex", alignItems: "center", gap: 18,
      animation: "pulse 1.5s ease-in-out infinite",
    }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }
      `}</style>

      {/* Day + emoji placeholder */}
      <div style={{ minWidth: 72, textAlign: "center", flexShrink: 0 }}>
        <div style={{ height: 10, width: 48, background: "#e5e7eb", borderRadius: 4, margin: "0 auto 8px" }} />
        <div style={{ height: 34, width: 34, background: "#e5e7eb", borderRadius: "50%", margin: "0 auto" }} />
      </div>

      <div style={{ width: 1, background: "#f3f4f6", alignSelf: "stretch", flexShrink: 0 }} />

      {/* Meal info placeholder */}
      <div style={{ flex: 1 }}>
        <div style={{ height: 14, width: "60%", background: "#e5e7eb", borderRadius: 4, marginBottom: 8 }} />
        <div style={{ height: 10, width: "40%", background: "#f3f4f6", borderRadius: 4, marginBottom: 14 }} />
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ height: 20, width: 80, background: "#fef3c7", borderRadius: 6 }} />
          <div style={{ height: 20, width: 64, background: "#f3f4f6", borderRadius: 6 }} />
        </div>
      </div>

      {/* Headcount placeholder */}
      <div style={{ minWidth: 80, textAlign: "center" }}>
        <div style={{ height: 10, width: 48, background: "#e5e7eb", borderRadius: 4, margin: "0 auto 10px" }} />
        <div style={{ height: 28, width: 80, background: "#f3f4f6", borderRadius: 14, margin: "0 auto" }} />
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div>
      <div style={{ marginBottom: 26 }}>
        <div style={{ height: 27, width: 300, background: "#e5e7eb", borderRadius: 6, marginBottom: 8 }} />
        <div style={{ height: 14, width: 220, background: "#f3f4f6", borderRadius: 4 }} />
      </div>
      <div style={{ height: 148, background: "white", border: "1px solid #e5e7eb", borderRadius: 14, marginBottom: 20 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 22 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ height: 70, background: "white", border: "1px solid #e5e7eb", borderRadius: 12 }} />
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[0, 1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
      </div>
    </div>
  );
}

// ── Error banner (non-blocking: shows mock data behind it) ─────────────────────
function ErrorBanner({ message }) {
  return (
    <div style={{
      background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
      padding: "12px 18px", marginBottom: 20,
      display: "flex", alignItems: "flex-start", gap: 10,
    }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
      <div>
        <div style={{ fontWeight: 700, color: "#dc2626", fontSize: 13 }}>
          Couldn't load live data
        </div>
        <div style={{ fontSize: 12, color: "#ef4444", marginTop: 2 }}>
          {message} — showing last saved plan instead.
        </div>
      </div>
    </div>
  );
}

// ── Save-error toast (auto-disappears via CSS, stays until new error) ──────────
function SaveErrorToast({ message }) {
  if (!message) return null;
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 100,
      background: "#1f2937", color: "white", borderRadius: 10,
      padding: "12px 18px", fontSize: 13, fontWeight: 500,
      boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
      display: "flex", alignItems: "center", gap: 8, maxWidth: 340,
    }}>
      <span>⚠️</span>
      {message}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function MenuDashboard({
  menu, deals,
  updateHeadcount, toggleSaved, regenerateDay,
  totalSaved, totalCost, avgPerServing,
  weekRange,
  loading, error, saveError,
  goToGrocery,
}) {
  if (loading) return <LoadingState />;

  return (
    <div>
      {error   && <ErrorBanner message={error} />}
      {saveError && <SaveErrorToast message={saveError} />}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 26 }}>
        <div>
          <h1 style={{ fontSize: 27, fontWeight: 800, color: "#111827", margin: 0, letterSpacing: "-0.5px" }}>
            This Week's Dinner Plan
          </h1>
          <p style={{ color: "#9ca3af", margin: "5px 0 0", fontSize: 14 }}>
            Built around this week's best deals · {weekRange}
          </p>
        </div>
        <button onClick={goToGrocery} style={{
          background: "#16a34a", color: "white", border: "none", borderRadius: 10,
          padding: "11px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", flexShrink: 0,
        }}>
          🛒 Get Grocery List
        </button>
      </div>

      <DealsStrip deals={deals} />
      <StatsBar totalSaved={totalSaved} totalCost={totalCost} avgPerServing={avgPerServing} />

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {menu.map(day => (
          <DayCard
            key={day.id}
            day={day}
            updateHeadcount={updateHeadcount}
            toggleSaved={toggleSaved}
            regenerateDay={regenerateDay}
          />
        ))}
      </div>
    </div>
  );
}
