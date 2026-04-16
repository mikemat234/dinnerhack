// ─── SettingsPage.jsx ──────────────────────────────────────────────────────────
// User account settings page.
// Props:
//   user        – Supabase User object (for email display)
//   profile     – profile row from useProfile (for initialising local state)
//   signOut     – async fn from useAuth
//
// Local state is initialised from `profile` props and changes are saved to
// Supabase immediately via individual update calls (feel free to add a
// "Save Changes" button pattern if preferred).
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

// Must match pipeline/scraper.js STORE_MAP keys and OnboardingWizard AVAILABLE_STORES
const ALL_STORES = [
  { name: "ALDI",           emoji: "🛍️" },
  { name: "Giant Eagle",    emoji: "🦅" },
  { name: "Kroger",         emoji: "🏪" },
  { name: "Meijer",         emoji: "🛒" },
  { name: "Publix",         emoji: "🏪" },
  { name: "Safeway",        emoji: "🏪" },
  { name: "Food Lion",      emoji: "🦁" },
  { name: "Whole Foods",    emoji: "🌿" },
  { name: "Trader Joe's",   emoji: "🌺" },
];

// ── Shared save helper ─────────────────────────────────────────────────────────

async function patchProfile(userId, updates) {
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);
  return error?.message ?? null;
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function SettingsPage({ user, profile, signOut }) {
  // ── Initialise local state from profile prop ──────────────────────────────
  const [familyName, setFamilyName] = useState(profile?.family_name ?? "My Family");
  const [stores,     setStores]     = useState(profile?.stores ?? ["Walmart", "ALDI"]);
  const [nonoList,   setNonoList]   = useState(profile?.nono_list ?? []);
  const [newNono,    setNewNono]    = useState("");
  const [saveStatus, setSaveStatus] = useState(""); // "saving" | "saved" | "error"
  const [signingOut, setSigningOut] = useState(false);

  // Sync if profile prop changes (e.g. after a refetch)
  useEffect(() => {
    if (profile) {
      setFamilyName(profile.family_name ?? "My Family");
      setStores(profile.stores ?? ["Walmart", "ALDI"]);
      setNonoList(profile.nono_list ?? []);
    }
  }, [profile]);

  // ── Generic save wrapper ──────────────────────────────────────────────────
  async function save(updates) {
    if (!user?.id) return;
    setSaveStatus("saving");
    const err = await patchProfile(user.id, updates);
    setSaveStatus(err ? "error" : "saved");
    setTimeout(() => setSaveStatus(""), 2000);
  }

  // ── Field handlers ────────────────────────────────────────────────────────
  function toggleStore(store) {
    const next = stores.includes(store)
      ? stores.filter(s => s !== store)
      : [...stores, store];
    setStores(next);
    save({ stores: next });
  }

  async function saveFamilyName() {
    save({ family_name: familyName.trim() || "My Family" });
  }

  function addNono() {
    const trimmed = newNono.trim();
    if (!trimmed || nonoList.map(n => n.toLowerCase()).includes(trimmed.toLowerCase())) return;
    const next = [...nonoList, trimmed];
    setNonoList(next);
    setNewNono("");
    save({ nono_list: next });
  }

  function removeNono(item) {
    const next = nonoList.filter(n => n !== item);
    setNonoList(next);
    save({ nono_list: next });
  }

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
  }

  // ── Subscription status label ─────────────────────────────────────────────
  const subStatus = profile?.subscription_status ?? "trial";
  const subLabel  = subStatus === "active" ? "DinnerHack Pro · Active"
                  : subStatus === "trial"  ? "Free Trial"
                  : "Cancelled";

  return (
    <div>
      <div style={{ marginBottom: 26 }}>
        <h1 style={{ fontSize: 27, fontWeight: 800, color: "#111827", margin: "0 0 5px", letterSpacing: "-0.5px" }}>
          Settings
        </h1>
        <p style={{ color: "#9ca3af", fontSize: 14, margin: 0 }}>
          Your family profile and preferences
        </p>
      </div>

      {/* Save status toast */}
      {saveStatus && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 100,
          background: saveStatus === "error" ? "#dc2626" : "#16a34a",
          color: "white", borderRadius: 10, padding: "10px 18px",
          fontSize: 13, fontWeight: 600,
          boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
        }}>
          {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "✓ Saved" : "Save failed — try again"}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

        {/* Account info */}
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 14, padding: "20px 24px" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 14px" }}>
            👤 Account
          </h2>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 4 }}>
              Email
            </div>
            <div style={{ fontSize: 14, color: "#374151" }}>{user?.email ?? "—"}</div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.4px" }}>
              Household Name
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                value={familyName}
                onChange={e => setFamilyName(e.target.value)}
                onBlur={saveFamilyName}
                onKeyDown={e => e.key === "Enter" && saveFamilyName()}
                style={{
                  flex: 1, maxWidth: 280, padding: "10px 14px",
                  border: "1.5px solid #e5e7eb", borderRadius: 8,
                  fontSize: 14, color: "#111827", outline: "none",
                }}
                onFocus={e => e.target.style.borderColor = "#16a34a"}
                onBlur2={e => e.target.style.borderColor = "#e5e7eb"}
              />
            </div>
          </div>
        </div>

        {/* Store picker */}
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 14, padding: "20px 24px" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
            📍 My Stores
          </h2>
          <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 16px" }}>
            We scan flyers from these stores every week
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {ALL_STORES.map(({ name, emoji }) => {
              const on = stores.includes(name);
              return (
                <button key={name} onClick={() => toggleStore(name)} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "11px 14px",
                  border: `1.5px solid ${on ? "#86efac" : "#e5e7eb"}`,
                  borderRadius: 9, background: on ? "#f0fdf4" : "white",
                  cursor: "pointer", textAlign: "left",
                }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>
                    {on ? "✓" : emoji}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: on ? "#15803d" : "#374151" }}>
                    {name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* No-No List */}
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 14, padding: "20px 24px" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
            🚫 The No-No List
          </h2>
          <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 16px" }}>
            Hard allergies and family dislikes. These are <strong>never</strong> used in meal plans.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {nonoList.map(item => (
              <span key={item} style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "#fef2f2", border: "1px solid #fecaca",
                borderRadius: 20, padding: "5px 12px",
                fontSize: 13, fontWeight: 600, color: "#dc2626",
              }}>
                🚫 {item}
                <button onClick={() => removeNono(item)} style={{
                  border: "none", background: "none", cursor: "pointer",
                  color: "#fca5a5", fontSize: 15, padding: 0, lineHeight: 1,
                }}>×</button>
              </span>
            ))}
            {nonoList.length === 0 && (
              <span style={{ fontSize: 13, color: "#9ca3af" }}>No restrictions added yet.</span>
            )}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              value={newNono}
              onChange={e => setNewNono(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addNono()}
              placeholder="Add allergy or dislike…"
              style={{
                flex: 1, maxWidth: 250, padding: "10px 14px",
                border: "1.5px solid #e5e7eb", borderRadius: 8,
                fontSize: 14, outline: "none",
              }}
              onFocus={e => e.target.style.borderColor = "#16a34a"}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"}
            />
            <button onClick={addNono} style={{
              background: "#dc2626", color: "white", border: "none",
              borderRadius: 8, padding: "10px 18px",
              fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}>
              + Add
            </button>
          </div>
        </div>

        {/* Subscription */}
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 14, padding: "20px 24px" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 14px" }}>
            💳 Subscription
          </h2>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: subStatus === "active" ? "#f0fdf4" : "#fafafa",
            border: `1px solid ${subStatus === "active" ? "#bbf7d0" : "#e5e7eb"}`,
            borderRadius: 10, padding: "14px 18px", marginBottom: 12,
          }}>
            <div>
              <div style={{ fontWeight: 700, color: subStatus === "active" ? "#166534" : "#374151", fontSize: 15 }}>
                {subLabel}
              </div>
              {subStatus === "active" && (
                <div style={{ fontSize: 13, color: "#16a34a", marginTop: 1 }}>$19.00 / month</div>
              )}
              {subStatus === "trial" && (
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Upgrade to unlock all features</div>
              )}
            </div>
            {profile?.billing_date && subStatus === "active" && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>Next billing</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginTop: 1 }}>
                  {new Date(profile.billing_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
              </div>
            )}
          </div>
          <button style={{
            background: "#f9fafb", border: "1px solid #e5e7eb",
            color: "#6b7280", borderRadius: 8, padding: "9px 18px",
            fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}>
            Manage Subscription
          </button>
        </div>

        {/* Danger zone: Sign Out */}
        <div style={{ background: "white", border: "1px solid #fee2e2", borderRadius: 14, padding: "20px 24px" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>
            🔐 Session
          </h2>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 14px" }}>
            Signed in as <strong>{user?.email ?? "unknown"}</strong>.
          </p>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            style={{
              padding: "10px 22px",
              background: signingOut ? "#f9fafb" : "#fef2f2",
              border: "1.5px solid #fecaca",
              borderRadius: 9, cursor: signingOut ? "not-allowed" : "pointer",
              fontWeight: 700, fontSize: 13,
              color: signingOut ? "#9ca3af" : "#dc2626",
              transition: "all 0.12s",
            }}
          >
            {signingOut ? "Signing out…" : "↩ Sign Out"}
          </button>
        </div>

      </div>
    </div>
  );
}
