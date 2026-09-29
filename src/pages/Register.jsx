import { useState } from "react";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  Phone,
  Globe,
} from "lucide-react";
import { COUNTRIES } from "../data/countries";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9][0-9\s().-]{5,18}[0-9]$/;

function validateField(name, value, form) {
  switch (name) {
    case "fullName":
      return !value.trim() ? "Full name is required" : null;
    case "email":
      if (!value.trim()) return "Email address is required";
      if (!EMAIL_RE.test(value.trim())) return "Enter a valid email address";
      return null;
    case "password":
      if (!value) return "Password is required";
      if (value.length < 8) return "Password must be at least 8 characters";
      if (!/[A-Za-z]/.test(value)) return "Password must contain a letter";
      if (!/[0-9]/.test(value)) return "Password must contain a number";
      return null;
    case "confirmPassword":
      if (!value) return "Please confirm your password";
      if (value !== form.password) return "Passwords do not match";
      return null;
    case "country":
      return !value ? "Please select a country" : null;
    case "phone":
      if (!value) return null;
      return PHONE_RE.test(value.replace(/\s+/g, " "))
        ? null
        : "Enter a valid phone number";
    case "role":
      return !value ? "Please select a role" : null;
    case "terms":
      return !value ? "You must accept the Terms and Privacy Policy" : null;
    default:
      return null;
  }
}

export default function Register({ onSubmit, onBackToLogin }) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: COUNTRIES[0]?.code || "",
    phone: "",
    role: "senior",
    terms: false,
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const updateField = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    const msg = validateField(name, value, { ...form, [name]: value });
    setErrors((e) => ({ ...e, [name]: msg }));
  };

  const validateAll = () => {
    const next = {};
    let ok = true;
    Object.keys(form).forEach((name) => {
      const msg = validateField(name, form[name], form);
      next[name] = msg;
      if (msg) ok = false;
    });
    setErrors(next);
    return ok;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;

    setServerError("");
    setSubmitting(true);

    // The password goes straight to the API and is never stored in component
    // state beyond this call. On success the app is already signed in, so this
    // component unmounts and the success card below is never shown.
    try {
      await onSubmit({
        name: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        country: form.country,
        phone: form.phone.trim(),
        role: form.role,
        includeDemoData: false,
      });
    } catch (err) {
      setServerError(err?.message || "Could not create your account.");
      if (err?.field) setErrors((e) => ({ ...e, [err.field]: err.message }));
    } finally {
      setSubmitting(false);
    }
  };

  const showFieldError = (field) =>
    errors[field] ? <span className="cg-field-error">{errors[field]}</span> : null;

  return (
    <>
      <style>{`
        .cg-register-backdrop {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: color-mix(in srgb, var(--c-primary) 6%, transparent);
          padding: 24px;
        }
        .cg-register-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--shadow-lg);
          width: 100%;
          max-width: 400px;
          padding: 40px 32px 36px;
        }
        .cg-register-brand {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          margin-bottom: 22px;
        }
        .cg-register-brand .cg-login-logo {
          width: 52px;
          height: 52px;
          border-radius: 15px;
          background: var(--c-primary);
          color: #06211d;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cg-register-brand h1 {
          font-size: 1.55rem;
          letter-spacing: -0.3px;
          margin: 0;
        }
        .cg-register-brand p {
          font-size: 0.8rem;
          color: var(--ink-3);
          margin: 0;
        }
        .cg-register-error {
          background: color-mix(in srgb, var(--c-danger) 8%, transparent);
          border: 1px solid color-mix(in srgb, var(--c-danger) 22%, transparent);
          color: var(--c-danger);
          border-radius: var(--radius-sm);
          padding: 10px 12px;
          font-size: 0.8rem;
          margin-bottom: 18px;
        }
        .cg-register-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
          margin-bottom: 16px;
        }
        .cg-register-field label {
          font-size: 0.74rem;
          font-weight: 600;
          color: var(--ink-2);
          letter-spacing: 0.03em;
        }
        .cg-register-field.full-width {
          flex: 1 1 auto;
        }
        .cg-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .cg-input-wrap input,
        .cg-input-wrap select {
          width: 100%;
          padding: 11px 14px 11px 38px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          color: var(--ink);
          outline: none;
          transition: border-color 0.16s, background 0.16s;
          appearance: none;
        }
        .cg-input-wrap input:focus,
        .cg-input-wrap select:focus {
          border-color: var(--c-primary);
          background: var(--surface);
        }
        .cg-input-wrap input::placeholder,
        .cg-input-wrap select::placeholder {
          color: var(--ink-3);
        }
        .cg-input-wrap select {
          background-image: none;
        }
        .cg-input-icon {
          position: absolute;
          left: 12px;
          width: 18px;
          height: 18px;
          color: var(--ink-3);
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
        .cg-field-error {
          color: var(--c-danger);
          font-size: 0.74rem;
          margin-top: 2px;
          min-height: 16px;
        }
        .cg-field-row {
          display: flex;
          gap: 14px;
          align-items: flex-end;
        }
        .cg-field-row .cg-register-field {
          flex: 1;
          min-width: 0;
        }
        .cg-pass-toggle {
          position: absolute;
          right: 10px;
          background: transparent;
          color: var(--ink-3);
          border: none;
          padding: 4px;
          border-radius: 8px;
          cursor: pointer;
          transition: color 0.16s;
        }
        .cg-pass-toggle:hover {
          color: var(--c-primary);
        }
        .cg-role-group {
          display: flex;
          gap: 12px;
          margin-top: 4px;
        }
        .cg-role-option {
          flex: 1;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 11px 12px;
          background: var(--surface-2);
          cursor: pointer;
          transition: border-color 0.16s, background 0.16s;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: var(--ink);
        }
        .cg-role-option:hover {
          border-color: var(--c-neutral);
        }
        .cg-role-option.selected {
          border-color: var(--c-primary);
          background: var(--surface);
        }
        .cg-role-option input {
          width: 16px;
          height: 16px;
          accent-color: var(--c-primary);
        }
        .cg-terms {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          margin-bottom: 16px;
          font-size: 0.8rem;
          color: var(--ink-2);
          cursor: pointer;
          user-select: none;
        }
        .cg-terms input {
          width: 17px;
          height: 17px;
          margin-top: 1px;
          accent-color: var(--c-primary);
          cursor: pointer;
        }
        .cg-terms a {
          color: var(--c-primary);
          font-weight: 600;
          text-decoration: none;
          white-space: nowrap;
        }
        .cg-terms a:hover {
          text-decoration: underline;
        }
        .cg-login-submit {
          width: 100%;
          padding: 12px 16px;
          background: var(--c-primary);
          color: #fff;
          border-radius: var(--radius-sm);
          font-weight: 700;
          font-size: 0.86rem;
          cursor: pointer;
          transition: filter 0.16s, transform 0.04s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .cg-login-submit:hover {
          filter: brightness(1.08);
        }
        .cg-login-submit:active {
          transform: translateY(1px);
        }
        .cg-login-submit:disabled {
          filter: brightness(0.9);
          cursor: progress;
        }
        .cg-register-footer {
          margin-top: 20px;
          text-align: center;
          font-size: 0.82rem;
          color: var(--ink-2);
        }
        .cg-register-footer .cg-create {
          color: var(--c-primary);
          font-weight: 600;
          cursor: pointer;
        }
        .cg-register-footer .cg-create:hover {
          text-decoration: underline;
        }
        .cg-register-success {
          text-align: center;
        }
        .cg-register-success-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: color-mix(in srgb, var(--c-good) 12%, transparent);
          color: var(--c-good);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 18px;
        }
        .cg-register-success-title {
          font-size: 1.35rem;
          letter-spacing: -0.2px;
          margin-bottom: 10px;
        }
        .cg-register-success-msg {
          font-size: 0.82rem;
          color: var(--ink-2);
          margin-bottom: 18px;
        }
        .cg-register-success-summary {
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 12px 14px;
          margin-bottom: 22px;
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 0.82rem;
          color: var(--ink-2);
        }
        .cg-register-summary-name {
          font-weight: 700;
          color: var(--ink);
          white-space: nowrap;
        }
        .cg-register-summary-email {
          color: var(--ink-3);
          white-space: nowrap;
          margin-left: auto;
        }
        @media (max-width: 470px) {
          .cg-register-card { padding: 32px 22px 32px; }
          .cg-field-row { flex-direction: column; gap: 0; }
        }
      `}</style>
      <div className="cg-register-backdrop">
        <div className="cg-register-card">
          <div className="cg-register-brand">
            <div className="cg-login-logo">
              <ShieldCheck size={26} />
            </div>
            <h1>CareGuard</h1>
            <p>Create your account</p>
          </div>

          {serverError && (
            <div className="cg-field-error cg-form-error" role="alert">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
              <div className="cg-register-field">
                <label htmlFor="cg-fullName">Full Name *</label>
                <div className="cg-input-wrap">
                  <span className="cg-input-icon">
                    <User size={17} />
                  </span>
                  <input
                    id="cg-fullName"
                    type="text"
                    placeholder="Jane Doe"
                    autoComplete="name"
                    autoFocus
                    value={form.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    aria-invalid={!!errors.fullName}
                  />
                </div>
                {showFieldError("fullName")}
              </div>

              <div className="cg-register-field">
                <label htmlFor="cg-email">Email Address *</label>
                <div className="cg-input-wrap">
                  <span className="cg-input-icon">
                    <Mail size={17} />
                  </span>
                  <input
                    id="cg-email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    aria-invalid={!!errors.email}
                  />
                </div>
                {showFieldError("email")}
              </div>

              <div className="cg-register-field">
                <label htmlFor="cg-password">Password *</label>
                <div className="cg-input-wrap">
                  <span className="cg-input-icon">
                    <Lock size={17} />
                  </span>
                  <input
                    id="cg-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 8 characters"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    className="cg-pass-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={0}
                    onKeyDown={(e) =>
                      (e.key === "Enter" || e.key === " ") &&
                      setShowPassword((v) => !v)
                    }
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {showFieldError("password")}
              </div>

              <div className="cg-register-field">
                <label htmlFor="cg-confirmPassword">Confirm Password *</label>
                <div className="cg-input-wrap">
                  <span className="cg-input-icon">
                    <Lock size={17} />
                  </span>
                  <input
                    id="cg-confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-type password"
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={(e) =>
                      updateField("confirmPassword", e.target.value)
                    }
                    aria-invalid={!!errors.confirmPassword}
                  />
                  <button
                    type="button"
                    className="cg-pass-toggle"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={
                      showConfirm ? "Hide password" : "Show password"
                    }
                    tabIndex={0}
                    onKeyDown={(e) =>
                      (e.key === "Enter" || e.key === " ") &&
                      setShowConfirm((v) => !v)
                    }
                  >
                    {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {showFieldError("confirmPassword")}
              </div>

              <div className="cg-register-field">
                <label htmlFor="cg-country">Country *</label>
                <div className="cg-input-wrap">
                  <span className="cg-input-icon">
                    <Globe size={17} />
                  </span>
                  <select
                    id="cg-country"
                    value={form.country}
                    onChange={(e) => updateField("country", e.target.value)}
                    aria-invalid={!!errors.country}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.dialCode})
                      </option>
                    ))}
                  </select>
                </div>
                {showFieldError("country")}
              </div>

              <div className="cg-field-row">
                <div className="cg-register-field">
                  <label htmlFor="cg-phone">Phone Number</label>
                  <div className="cg-input-wrap">
                    <span className="cg-input-icon">
                      <Phone size={17} />
                    </span>
                    <input
                      id="cg-phone"
                      type="tel"
                      placeholder="+1 555 000 0000"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      aria-invalid={!!errors.phone}
                    />
                  </div>
                  <span
                    className="cg-optional-hint"
                    style={{ fontSize: "0.72rem", fontWeight: 400, marginTop: "2px" }}
                  >
                    Optional
                  </span>
                  {showFieldError("phone")}
                </div>

                <div className="cg-register-field" style={{ minWidth: "150px" }}>
                  <label>Role *</label>
                  <div className="cg-role-group">
                    <label
                      className={`cg-role-option ${
                        form.role === "senior" ? "selected" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="senior"
                        checked={form.role === "senior"}
                        onChange={() => updateField("role", "senior")}
                      />
                      Senior
                    </label>
                    <label
                      className={`cg-role-option ${
                        form.role === "caregiver" ? "selected" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="caregiver"
                        checked={form.role === "caregiver"}
                        onChange={() => updateField("role", "caregiver")}
                      />
                      Caregiver
                    </label>
                  </div>
                  {showFieldError("role")}
                </div>
              </div>

              <div className="cg-register-field">
                <label className="cg-terms" htmlFor="cg-terms">
                  <input
                    id="cg-terms"
                    type="checkbox"
                    checked={form.terms}
                    onChange={(e) => updateField("terms", e.target.checked)}
                    aria-invalid={!!errors.terms}
                  />
                  <span>
                    I agree to the{" "}
                    <a
                      onClick={(e) => {
                        e.preventDefault();
                        alert(
                          "Terms and Privacy Policy are not available in this demo."
                        );
                      }}
                    >
                      Terms and Privacy Policy
                    </a>
                  </span>
                </label>
                {showFieldError("terms")}
              </div>

              <button
                type="submit"
                className="cg-login-submit"
                disabled={submitting}
              >
                {submitting ? "Creating account…" : "Create account"}
              </button>
            </form>

          {!submitting && (
            <div className="cg-register-footer">
              Already have an account?{" "}
              <span
                className="cg-create"
                onClick={onBackToLogin}
                role="link"
                tabIndex={0}
                onKeyDown={(e) =>
                  (e.key === "Enter" || e.key === " ") && onBackToLogin()
                }
              >
                Sign in
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
