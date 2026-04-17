// ─── App.jsx ───────────────────────────────────────────────────────────────────
// Root component with auth-gated routing.
//
// Render tree:
//   AppLoading       – while useAuth is resolving the session
//   AuthView         – no session: sign-in / sign-up / magic link
//   OnboardingWizard – session exists but profiles row doesn't yet
//   MainApp          – fully authenticated + onboarded user
//
// Keeping the main app in a separate sub-component (MainApp) means useMenu is
// only instantiated when there's a confirmed userId — no defensive null-checks
// needed inside the hook.
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from "react";

import { useAuth }    from "./hooks/useAuth";
import { useProfile } from "./hooks/useProfile";
import { useMenu }    from "./hooks/useMenu";

import AuthView        from "./components/auth/AuthView";
import OnboardingWizard from "./components/auth/OnboardingWizard";
import Sidebar         from "./components/layout/Sidebar";
import MenuDashboard   from "./components/menu/MenuDashboard";
import GroceryListView from "./components/grocery/GroceryListView";
import RecipeVault     from "./components/vault/RecipeVault";
import ReferralPage    from "./components/referral/ReferralPage";
import SettingsPage    from "./components/settings/SettingsPage";

// ── Full-page loading spinner shown while session is resolving ─────────────────

function AppLoading() {
  return (
    <div style={{
      minHeight: "100vh", background: "#f8fafc",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🍽️</div>
        <p style={{ color: "#9ca3af", fontSize: 14, margin: 0 }}>Loading DinnerHack…</p>
      </div>
    </div>
  );
}

// ── Main app shell — only rendered when user + profile are both confirmed ──────

function MainApp({ user, signOut, profile }) {
  const [tab, setTab] = useState("menu");

  const {
    menu, deals,
    updateHeadcount, toggleSaved, regenerateDay,
    totalSaved, totalCost, avgPerServing,
    loading, error, saveError, weekRange,
  } = useMenu(user.id);

  return (
    <div style={{
      display: "flex", minHeight: "100vh", background: "#f8fafc",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <Sidebar
        active={tab}
        setActive={setTab}
        totalSaved={totalSaved}
        user={user}
        signOut={signOut}
      />

      <main style={{ marginLeft: 240, flex: 1, minHeight: "100vh" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "34px 40px" }}>
          {tab === "menu" && (
            <MenuDashboard
              menu={menu}
              deals={deals}
              updateHeadcount={updateHeadcount}
              toggleSaved={toggleSaved}
              regenerateDay={regenerateDay}
              totalSaved={totalSaved}
              totalCost={totalCost}
              avgPerServing={avgPerServing}
              weekRange={weekRange}
              loading={loading}
              error={error}
              saveError={saveError}
              goToGrocery={() => setTab("grocery")}
            />
          )}
          {tab === "grocery"  && <GroceryListView menu={menu} userId={user?.id} />}
          {tab === "vault"    && <RecipeVault />}
          {tab === "refer"    && <ReferralPage />}
          {tab === "settings" && (
            <SettingsPage
              user={user}
              profile={profile}
              signOut={signOut}
            />
          )}
        </div>
      </main>
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────

export default function App() {
  const { session, user, loading: authLoading, signOut } = useAuth();

  // Only fetch profile once we have a confirmed user
  const {
    profile, hasProfile,
    loading: profileLoading,
    saveProfile,
  } = useProfile(user?.id ?? null);

  // ── Gate 1: auth session still resolving ────────────────────────────────────
  if (authLoading) return <AppLoading />;

  // ── Gate 2: no session → show auth UI ───────────────────────────────────────
  if (!user) return <AuthView />;

  // ── Gate 3: session exists but profile row hasn't loaded yet ────────────────
  // (profileLoading is true while the DB call is in-flight)
  if (profileLoading) return <AppLoading />;

  // ── Gate 4: profile doesn't exist yet → onboarding ──────────────────────────
  if (!hasProfile) {
    return <OnboardingWizard saveProfile={saveProfile} />;
  }

  // ── Gate 5: fully authenticated + onboarded ──────────────────────────────────
  return <MainApp user={user} signOut={signOut} profile={profile} />;
}
