import { useState } from "react";
import { DEMO_LOGIN_HINTS } from "../services/authService";
import "./Login.css";

export default function Login({
  onSubmit,
  onCreateAccount,
  submitting = false,
}) {
  const [role, setRole] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  /* --------------------------------------------------- seeded demo accounts */

  // The demo passwords come from the same fixture the server seeds from, so
  // these always match what is actually in the database.
  const hints = role === "patient"
    ? DEMO_LOGIN_HINTS.filter((h) => h.role === "elderly")
    : DEMO_LOGIN_HINTS.filter((h) => h.role === "caregiver");

  const applyHint = (hint) => {
    setEmail(hint.email);
    setPassword(hint.password);
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await onSubmit(email.trim(), password);
    } catch (err) {
      setError(err?.message || "Could not sign in. Please try again.");
    }
  };

  const goBack = () => {
    setRole(null);
    setError("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
  };

  /* -----------------------------
     ROLE SELECTION
  ----------------------------- */

  if (!role) {
    return (
      <div className="auth-page">
        <div className="auth-container">

          <div className="auth-brand">
            <div className="auth-logo">❤</div>

            <h1>CareGuard</h1>

            <p>
              Safety, care and independence — connected.
            </p>
          </div>

          <h2>Welcome to CareGuard</h2>

          <p className="auth-subtitle">
            How would you like to continue?
          </p>

          <div className="role-grid">

            {/* CAREGIVER */}

            <button
              type="button"
              className="role-card"
              onClick={() => {
                setRole("caregiver");
                setError("");
              }}
            >
              <div className="role-icon">
                👩‍⚕️
              </div>

              <h3>I'm a Caregiver</h3>

              <p>
                Monitor loved ones, receive alerts
                and manage care.
              </p>

              <span>
                Continue as Caregiver →
              </span>
            </button>

            {/* PATIENT */}

            <button
              type="button"
              className="role-card"
              onClick={() => {
                setRole("patient");
                setError("");
              }}
            >
              <div className="role-icon">
                👴
              </div>

              <h3>I'm a Patient</h3>

              <p>
                Easily manage medicines, check in
                and request emergency help.
              </p>

              <span>
                Continue as Patient →
              </span>
            </button>

          </div>

          {onCreateAccount && (
            <button
              type="button"
              className="create-account-button"
              onClick={onCreateAccount}
            >
              Create an account
            </button>
          )}

        </div>
      </div>
    );
  }

  /* -----------------------------
     LOGIN FORM
  ----------------------------- */

  return (
    <div className="auth-page">
      <div className="login-card">

        <button
          type="button"
          className="back-button"
          onClick={goBack}
        >
          ← Back
        </button>

        <div className="auth-brand">
          <div className="auth-logo">❤</div>

          <h1>CareGuard</h1>
        </div>

        <h2>
          {role === "caregiver"
            ? "Caregiver Sign In"
            : "Patient Sign In"}
        </h2>

        <p className="auth-subtitle">
          {role === "caregiver"
            ? "Access your care management dashboard."
            : "Access your simple personal care dashboard."}
        </p>

        {hints.length > 0 && (
          <div className="demo-accounts">
            {hints.map((hint) => (
              <button
                key={hint.email}
                type="button"
                className="demo-account"
                onClick={() => applyHint(hint)}
              >
                <strong>{hint.name}</strong>
                <em>{hint.email}</em>
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleLogin}>

          <label>
            {role === "patient"
              ? "Email or Patient ID"
              : "Email"}
          </label>

          <input
            type="text"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            placeholder={
              role === "patient"
                ? "Enter your email or patient ID"
                : "Enter your email"
            }
            required
          />

          <label>Password</label>

          <div className="password-wrapper">

            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="Enter your password"
              required
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(!showPassword)
              }
              className="password-toggle"
            >
              {showPassword
                ? "Hide"
                : "Show"}
            </button>

          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={submitting}
          >
            {submitting ? "Signing in…" : "Sign In"}
          </button>

        </form>

        <button
          type="button"
          className="forgot-button"
        >
          Forgot password?
        </button>

        <p className="demo-note">
          Demo accounts above are seeded by <code>npm run seed</code>.
          Password: <strong>careguard</strong>
        </p>

      </div>
    </div>
  );
}