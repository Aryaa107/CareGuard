import { useEffect } from "react";
import { Activity, Check, X } from "lucide-react";
import iconMap from "./iconMap";

const cx = (...parts) => parts.filter(Boolean).join(" ");

export function Icon({ name, size = 18, ...rest }) {
  const Cmp = iconMap[name] || Activity;
  return <Cmp size={size} {...rest} />;
}

export function Card({ title, subtitle, icon, action, children, className = "", span = 1 }) {
  return (
    <section className={`card ${className}`} style={span ? { gridColumn: `span ${span}` } : undefined}>
      {(title || action) && (
        <header className="card-head">
          <div className="card-head-left">
            {icon && <div className="card-ico">{icon}</div>}
            <div>
              {title && <h3>{title}</h3>}
              {subtitle && <p>{subtitle}</p>}
            </div>
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Badge({ tone = "neutral", children, dot = false }) {
  return (
    <span className={`badge tone-${tone}`}>
      {dot && <i className="badge-dot" />}
      {children}
    </span>
  );
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  full = false,
  className = "",
  ...rest
}) {
  return (
    <button className={`btn v-${variant} s-${size} ${full ? "full" : ""} ${className}`} {...rest}>
      {icon}
      <span>{children}</span>
    </button>
  );
}

export function Modal({ open, onClose, title, subtitle, children, footer, wide = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className={`modal ${wide ? "wide" : ""}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="modal-head">
          <div>
            <h3>{title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close dialog">
            <X size={20} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>
  );
}

export function Segmented({ options, value, onChange }) {
  return (
    <div className="segmented" role="tablist">
      {options.map((o) => (
        <button
          key={o.id}
          role="tab"
          aria-selected={value === o.id}
          className={value === o.id ? "on" : ""}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="toggle-row">
      <span className="toggle-text">
        <strong>{label}</strong>
        {hint && <em>{hint}</em>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`switch ${checked ? "on" : ""}`}
        onClick={() => onChange(!checked)}
      >
        <i />
      </button>
    </label>
  );
}

export function ProgressBar({ value, max = 100, tone = "primary", label, right }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="progress">
      {(label || right) && (
        <div className="progress-head">
          {label && <span>{label}</span>}
          {right && <strong>{right}</strong>}
        </div>
      )}
      <div className="progress-track">
        <div className={cx("progress-fill", `tone-${tone}`)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function EmptyState({ icon = "info", title, text }) {
  return (
    <div className="empty">
      <div className="empty-ico">
        <Icon name={icon} size={26} />
      </div>
      <h4>{title}</h4>
      <p>{text}</p>
    </div>
  );
}

export function ToastStack({ toasts, onDismiss }) {
  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast tone-${t.tone}`}>
          <Icon name={t.tone === "danger" ? "siren" : t.tone === "good" ? "check" : "info"} size={18} />
          <span>{t.message}</span>
          <button onClick={() => onDismiss(t.id)} aria-label="Dismiss notification">
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function DetailRow({ label, value, tone }) {
  return (
    <div className="detail-row">
      <span>{label}</span>
      <strong className={tone ? `text-${tone}` : ""}>{value}</strong>
    </div>
  );
}

export function CheckPill({ done, onToggle, title, detail, icon }) {
  return (
    <button className={`check-pill ${done ? "done" : ""}`} onClick={onToggle}>
      <span className="cp-box">{done ? <Check size={16} /> : null}</span>
      <span className="cp-ico">
        <Icon name={icon} size={17} />
      </span>
      <span className="cp-text">
        <strong>{title}</strong>
        <em>{detail}</em>
      </span>
    </button>
  );
}
