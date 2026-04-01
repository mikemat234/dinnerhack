// ─── OnboardingWizard.jsx ──────────────────────────────────────────────────────
// Shown once after a user creates their account, before the main app.
// Three steps:
//   Step 1 — Store selection   (which grocery stores to track deals for)
//   Step 2 — No-No List        (allergens / foods to skip)
//   Step 3 — Default headcount (how many people you're cooking for)
//
// On "Finish", calls saveProfile() which upserts to `profiles` table.
// Parent (App.jsx) watches hasProfile; once true it renders MainApp.
//
// Props:
//   userId      – string, the authenticated user's UUID
//   saveProfile – async (updates) => { error } from useProfile
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from "react";

// ── Constants ──────────────────────────────────────────────────────────────────

const AVAILABLE_STORES = [
  "Aldi",
  "Giant Eagle",
  "Kroger",
  "Walmart",
  "Meijer",
  "Costco",
  "Trader Joe's",
  "Whole Foods",
  "Target",
  "Sam's Club",
];

const COMMON_ALLERGENS = [
  "Peanuts", "Tree Nuts", "Milk", "Eggs",
  "Wheat / Gluten", "Shellfish", "Fish", "Soy",
  "Sesame", "Pork", "Beef", "Lamb",
];

// ── Shared primitives ──────────────────────────────────────────────────────────

function WizardHeader({ step, total, title, subtitle }) {
  return (
    <div style={{ marginBottom: 28 }}>
      {/* Progress dots */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18, justifyContent: "center" }}>
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            style={{
              width: i === step - 1 ? 24 : 8,
              height: 8, borderRadius: 4,
              background: i < step ? "#16a34a" : "#e5e7eb",
              transition: "all 0.3s",
            }}
          />
        ))}
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: "0 0 6px", textAlign: "center" }}>
        {title}
      </h2>
      <p style={{ color: "#6b7280", fontSize: 14, margin: 0, textAlign: "center" }}>
        {subtitle}
      </p>
    </div>
  );
}

function NavButtons({ step, totalSteps, onBack, onNext, nextLabel, loading }) {
  return (
    <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
      {step > 1 && (
        <button
          onClick={onBack}
          style={{
            flex: 1, padding: "12px 0", background: "#f3f4f6", color: "#374151",
            border: "none", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer",
          }}
        >
          ← Back
        </button>
      )}
      <button
        onClick={onNext}
        disabled={loading}
        style={{
          flex: 2, padding: "12px 0",
          background: loading ? "#86efac" : "#16a34a",
          color: "white", border: "none", borderRadius: 10,
          fontWeight: 700, fontSize: 14,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Saving…" : (nextLabel ?? (step < totalSteps ? "Next →" : "Finish 🎉"))}
      </button>
    </div>
  );
}

// ── Step 1: Store Selection ────────────────────────────────────────────────────

function StoreStep({ selected, setSelected }) {
  function toggle(store) {
    setSelected(prev =>
      prev.includes(store) ? prev.filter(s => s !== store) : [...prev, store]
    );
  }

  return (
    <div>
      <WizardHeader
        step={1} total={3}
        title="Which stores do you shop at?"
        subtitle="We'll only show you deals from your chosen stores."
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {AVAILABLE_STORES.map(store => {
          const active = selected.includes(store);
          return (
            <button
              key={store}
              onClick={() => toggle(store)}
              style={{
                padding: "12px 14px", borderRadius: 10, border: "none", cursor: "pointer",
                background: active ? "#f0fdf4" : "#f9fafb",
                color:      active ? "#15803d" : "#374151",
                fontWeight: active ? 700 : 500,
                fontSize: 13,
                outline: active ? "2px solid #16a34a" : "2px solid transparent",
                textAlign: "left",
                transition: "all 0.15s",
              }}
            >
              {active ? "✓ " : ""}{store}
            </button>
          );
        })}
      </div>
      {selected.length === 0 && (
        <p style={{ fontSize: 12, color: "#ef4444", margin: "12px 0 0", textAlign: "center" }}>
          Select at least one store to continue.
        </p>
      )}
    </div>
  );
}

// ── Step 2: No-No List ─────────────────────────────────────────────────────────

function NoNoStep({ nonoList, setNonoList }) {
  const [custom, setCustom] = useState("");

  function toggle(item) {
    const lower = item.toLowerCase();
    setNonoList(prev =>
      prev.map(n => n.toLowerCase()).includes(lower)
        ? prev.filter(n => n.toLowerCase() !== lower)
        : [...prev, item]
    );
  }

  function addCustom() {
    const trimmed = custom.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    if (!nonoList.map(n => n.toLowerCase()).includes(lower)) {
      setNonoList(prev => [...prev, trimmed]);
    }
    setCustom("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") { e.preventDefault(); addCustom(); }
  }

  return (
    <div>
      <WizardHeader
        step={2} total={3}
        title="Any foods to avoid?"
        subtitle="We'll filter these out of your weekly menu. You can edit this anytime."
      />

      {/* Common allergen chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
        {COMMON_ALLERGENS.map(item => {
          const active = nonoList.map(n => n.toLowerCase()).includes(item.toLowerCase());
          return (
            <button
              key={item}
              onClick={() => toggle(item)}
              style={{
                padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: active ? 700 : 500,
                background: active ? "#fef2f2" : "#f3f4f6",
                color:      active ? "#dc2626" : "#374151",
                outline:    active ? "2px solid #fca5a5" : "2px solid transparent",
                transition: "all 0.15s",
              }}
            >
              {active ? "✕ " : ""}{item}
            </button>
          );
        })}
      </div>

      {/* Custom entry */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={custom}
          onChange={e => setCustom(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a custom item (e.g. cilantro)"
          style={{
            flex: 1, padding: "9px 13px", border: "1.5px solid #e5e7eb",
            borderRadius: 8, fontSize: 13, outline: "none",
          }}
          onFocus={e => e.target.style.borderColor = "#16a34a"}
          onBlur={e => e.target.style.borderColor = "#e5e7eb"}
        />
        <button
          onClick={addCustom}
          style={{
            padding: "9px 14px", background: "#f3f4f6", border: "none",
            borderRadius: 8, fontWeight: 600, color: "#374151",
            cursor: "pointer", fontSize: 13,
          }}
        >
          Add
        </button>
      </div>

      {/* Custom items already added */}
      {nonoList.filter(n => !COMMON_ALLERGENS.map(a => a.toLowerCase()).includes(n.toLowerCase())).length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
          {nonoList
            .filter(n => !COMMON_ALLERGENS.map(a => a.toLowerCase()).includes(n.toLowerCase()))
            .map(n => (
              <span
                key={n}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "4px 10px", background: "#fef9c3", borderRadius: 20,
                  fontSize: 12, color: "#854d0e",
                }}
              >
                {n}
                <button
                  onClick={() => toggle(n)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#854d0e", lineHeight: 1 }}
                >
                  ✕
                </button>
              </span>
            ))}
        </div>
      )}

      <p style={{ fontSize: 12, color: "#9ca3af", margin: "14px 0 0" }}>
        Skip this step if you have no restrictions — no worries!
      </p>
    </div>
  );
}

// ── Step 3: Headcount ──────────────────────────────────────────────────────────

function HeadcountStep({ familyName, setFamilyName, headcount, setHeadcount }) {
  return (
    <div>
      <WizardHeader
        step={3} total={3}
        title="Last step — family basics"
        subtitle="Used to calculate cost-per-serving and scale ingredient amounts."
      />

      {/* Family name */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
          What should we call your household?
        </label>
        <input
          type="text"
          value={familyName}
          onChange={e => setFamilyName(e.target.value)}
          placeholder="e.g. The Smiths"
          maxLength={40}
          style={{
            width: "100%", padding: "10px 14px", border: "1.5px solid #e5e7eb",
            borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box",
          }}
          onFocus={e => e.target.style.borderColor = "#16a34a"}
          onBlur={e => e.target.style.borderColor = "#e5e7eb"}
        />
      </div>

      {/* Headcount */}
      <div>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 14 }}>
          Default number of servings per meal
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 0, justifyContent: "center" }}>
          <button
            onClick={() => setHeadcount(h => Math.max(1, h - 1))}
            style={{
              width: 44, height: 44, borderRadius: "10px 0 0 10px", border: "1.5px solid #e5e7eb",
              background: "white", fontSize: 20, cursor: "pointer", color: "#374151",
              borderRight: "none",
            }}
          >
            −
          </button>
          <div style={{
            width: 64, height: 44, display: "flex", alignItems: "center",
            justifyContent: "center", border: "1.5px solid #e5e7eb",
            fontSize: 20, fontWeight: 700, color: "#111827",
          }}>
            {headcount}
          </div>
          <button
            onClick={() => setHeadcount(h => Math.min(12, h + 1))}
            style={{
              width: 44, height: 44, borderRadius: "0 10px 10px 0", border: "1.5px solid #e5e7eb",
              background: "white", fontSize: 20, cursor: "pointer", color: "#374151",
              borderLeft: "none",
            }}
          >
            +
          </button>
        </div>
        <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 12, margin: "10px 0 0" }}>
          {headcount === 1 ? "Just me" : headcount === 2 ? "Couple" : headcount <= 4 ? "Small family" : "Large family"} · You can change this per-meal anytime
        </p>
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function OnboardingWizard({ saveProfile }) {
  const [step,        setStep]        = useState(1);
  const [stores,      setStores]      = useState(["Aldi", "Giant Eagle"]);
  const [nonoList,    setNonoList]    = useState([]);
  const [familyName,  setFamilyName]  = useState("My Family");
  const [headcount,   setHeadcount]   = useState(4);
  const [saving,      setSaving]      = useState(false);
  const [saveErr,     setSaveErr]     = useState("");

  const TOTAL_STEPS = 3;

  async function handleNext() {
    if (step === 1 && stores.length === 0) return;

    if (step < TOTAL_STEPS) {
      setStep(s => s + 1);
      return;
    }

    // Final step → save profile
    setSaving(true);
    setSaveErr("");

    const { error } = await saveProfile({
      family_name:       familyName.trim() || "My Family",
      stores,
      nono_list:         nonoList,
      default_headcount: headcount,
    });

    if (error) {
      setSaveErr(`Couldn't save your preferences: ${error}. Please try again.`);
    }
    // On success, useProfile's hasProfile flips to true → App.jsx shows MainApp
    setSaving(false);
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#f8fafc",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: "24px 16px",
    }}>
      <div style={{
        width: "100%", maxWidth: 480, background: "white",
        borderRadius: 18, padding: "40px 36px",
        boxShadow: "0 4px 32px rgba(0,0,0,0.08)",
        border: "1px solid #f3f4f6",
      }}>
        {/* Logo wordmark */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <span style={{ fontSize: 28 }}>🍽️</span>
          <span style={{ fontWeight: 900, fontSize: 18, color: "#111827", marginLeft: 8, verticalAlign: "middle" }}>
            DinnerHack
          </span>
        </div>

        {step === 1 && <StoreStep      selected={stores}     setSelected={setStores} />}
        {step === 2 && <NoNoStep       nonoList={nonoList}   setNonoList={setNonoList} />}
        {step === 3 && <HeadcountStep  familyName={familyName} setFamilyName={setFamilyName} headcount={headcount} setHeadcount={setHeadcount} />}

        {saveErr && (
          <p style={{ fontSize: 13, color: "#dc2626", margin: "12px 0 0", textAlign: "center" }}>
            ⚠️ {saveErr}
          </p>
        )}

        <NavButtons
          step={step}
          totalSteps={TOTAL_STEPS}
          onBack={() => setStep(s => s - 1)}
          onNext={handleNext}
          loading={saving}
        />
      </div>
    </div>
  );
}
