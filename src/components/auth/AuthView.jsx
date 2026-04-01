// ─── AuthView.jsx ──────────────────────────────────────────────────────────────
// Full-page auth screen shown when no active session is detected.
// Supports three modes via a tab switcher:
//   "signin"  – Email + Password sign in
//   "signup"  – Email + Password account creation
//   "magic"   – Passwordless Magic Link (send-link flow)
//
// No props required. Uses Supabase directly; session is managed by useAuth.
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { supabase } from "../../lib/supabase";

// ── Sub-components ─────────────────────────────────────────────────────────────

function Logo() {
  return (
    <div style={{ textAlign: "center", marginBottom: 32 }}>
      <div style={{ fontSize: 48, marginBottom: 8 }}>🍽️</div>
      <h1 style={{
        fontSize: 28, fontWeight: 900, color: "#111827",
        margin: 0, letterSpacing: "-0.5px",
      }}>
        DinnerHack
      </h1>
      <p style={{ color: "#6b7280", fontSize: 14, margin: "6px 0 0" }}>
        Weekly dinners built around your best local deals
      </p>
    </div>
  );
}

function TabBar({ active, setActive }) {
  const tabs = [
    { id: "signin", label: "Sign In" },
    { id: "signup", label: "Create Account" },
    { id: "magic",  label: "Magic Link" },
  ];
  return (
    <div style={{
      display: "flex", background: "#f3f4f6", borderRadius: 10,
      padding: 4, marginBottom: 24, gap: 2,
    }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => setActive(t.id)}
          style={{
            flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
            cursor: "pointer", fontSize: 13, fontWeight: active === t.id ? 700 : 500,
            background: active === t.id ? "white" : "transparent",
            color: active === t.id ? "#111827" : "#6b7280",
            boxShadow: active === t.id ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
            transition: "all 0.15s",
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function InputField({ label, type = "text", value, onChange, placeholder, autoComplete }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        style={{
          width: "100%", padding: "10px 14px", border: "1.5px solid #e5e7eb",
          borderRadius: 8, fontSize: 14, color: "#111827", outline: "none",
          boxSizing: "border-box", transition: "border-color 0.15s",
        }}
        onFocus={e => e.target.style.borderColor = "#16a34a"}
        onBlur={e => e.target.style.borderColor = "#e5e7eb"}
      />
    </div>
  );
}

function SubmitButton({ loading, children }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        width: "100%", padding: "12px 0", background: loading ? "#86efac" : "#16a34a",
        color: "white", border: "none", borderRadius: 10, fontWeight: 700,
        fontSize: 15, cursor: loading ? "not-allowed" : "pointer", marginTop: 8,
        transition: "background 0.15s",
      }}
    >
      {loading ? "Please wait…" : children}
    </button>
  );
}

function AlertBox({ type, message }) {
  if (!message) return null;
  const isError = type === "error";
  return (
    <div style={{
      padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13,
      background: isError ? "#fef2f2" : "#f0fdf4",
      border:     `1px solid ${isError ? "#fecaca" : "#bbf7d0"}`,
      color:      isError ? "#dc2626" : "#15803d",
    }}>
      {isError ? "⚠️ " : "✅ "}{message}
    </div>
  );
}

// ── Sign In form ───────────────────────────────────────────────────────────────

function SignInForm() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
    }
    // On success, onAuthStateChange in useAuth fires → App re-renders to MainApp
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <AlertBox type="error" message={error} />
      <InputField
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
        autoComplete="email"
      />
      <InputField
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="Your password"
        autoComplete="current-password"
      />
      <SubmitButton loading={loading}>Sign In →</SubmitButton>
    </form>
  );
}

// ── Sign Up form ───────────────────────────────────────────────────────────────

function SignUpForm() {
  const [email,     setEmail]    = useState("");
  const [password,  setPassword] = useState("");
  const [confirm,   setConfirm]  = useState("");
  const [loading,   setLoading]  = useState(false);
  const [error,     setError]    = useState("");
  const [success,   setSuccess]  = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
    } else {
      setSuccess("Account created! Check your email to confirm, then sign in.");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <AlertBox type="error"   message={error}   />
      <AlertBox type="success" message={success} />
      <InputField
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
        autoComplete="email"
      />
      <InputField
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="At least 6 characters"
        autoComplete="new-password"
      />
      <InputField
        label="Confirm Password"
        type="password"
        value={confirm}
        onChange={setConfirm}
        placeholder="Repeat your password"
        autoComplete="new-password"
      />
      <SubmitButton loading={loading}>Create Account →</SubmitButton>
    </form>
  );
}

// ── Magic Link form ────────────────────────────────────────────────────────────

function MagicLinkForm() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [sent,    setSent]    = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div style={{ textAlign: "center", padding: "24px 0" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📬</div>
        <p style={{ fontWeight: 700, color: "#111827", margin: "0 0 8px", fontSize: 16 }}>
          Magic link sent!
        </p>
        <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>
          Check your inbox at <strong>{email}</strong> and click the link to sign in.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <p style={{ fontSize: 13, color: "#6b7280", marginTop: 0, marginBottom: 18 }}>
        Enter your email and we'll send you a one-click sign-in link — no password needed.
      </p>
      <AlertBox type="error" message={error} />
      <InputField
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
        autoComplete="email"
      />
      <SubmitButton loading={loading}>Send Magic Link ✨</SubmitButton>
    </form>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function AuthView() {
  const [activeTab, setActiveTab] = useState("signin");

  return (
    <div style={{
      minHeight: "100vh", background: "#f8fafc",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: "24px 16px",
    }}>
      <div style={{
        width: "100%", maxWidth: 420, background: "white",
        borderRadius: 18, padding: "40px 36px",
        boxShadow: "0 4px 32px rgba(0,0,0,0.08)",
        border: "1px solid #f3f4f6",
      }}>
        <Logo />
        <TabBar active={activeTab} setActive={setActiveTab} />

        {activeTab === "signin" && <SignInForm />}
        {activeTab === "signup" && <SignUpForm />}
        {activeTab === "magic"  && <MagicLinkForm />}

        <p style={{ textAlign: "center", fontSize: 11, color: "#9ca3af", margin: "20px 0 0" }}>
          By signing up you agree to use this app responsibly. DinnerHack does not share your data.
        </p>
      </div>
    </div>
  );
}
