import {
  Activity,
  Bell,
  FileBarChart,
  HeartPulse,
  LayoutDashboard,
  MapPin,
  Phone,
  Pill,
  Settings as SettingsIcon,
  ShieldCheck,
  Siren,
  Sun,
  Users,
  X,
} from "lucide-react";
import { navGroups } from "../data/careData";
import { useCare } from "../context/careContext";

const iconMap = {
  LayoutDashboard,
  HeartPulse,
  Activity,
  MapPin,
  Pill,
  Bell,
  Users,
  Siren,
  FileBarChart,
  Sun,
};

const utilityItems = [{ id: "settings", label: "Settings", icon: SettingsIcon }];

export default function Sidebar() {
  const { activePage, navigate, sidebarOpen, setSidebarOpen, unreadCount, senior, live } = useCare();

  const renderItem = (item) => {
    const Icon = iconMap[item.icon] || LayoutDashboard;
    const active = activePage === item.id;
    const badge = item.id === "alerts" ? unreadCount : null;

    return (
      <button
        key={item.id}
        className={`nav-item ${active ? "active" : ""} ${item.urgent ? "urgent" : ""}`}
        onClick={() => navigate(item.id)}
        aria-current={active ? "page" : undefined}
        title={item.label}
      >
        <span className="nav-ico">
          <Icon size={19} />
        </span>
        <span className="nav-label">{item.label}</span>
        {badge ? <span className="nav-badge">{badge}</span> : null}
      </button>
    );
  };

  return (
    <>
      <div
        className={`sidebar-scrim ${sidebarOpen ? "on" : ""}`}
        onClick={() => setSidebarOpen(false)}
        role="presentation"
      />

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <ShieldCheck size={24} />
          </div>
          <div className="brand-text">
            <h2>CareGuard</h2>
            <span>Smart Elderly Care</span>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <div className="senior-chip">
          <div className="sc-avatar">{senior.photo}</div>
          <div className="sc-text">
            <strong>{senior.shortName}</strong>
            <em>
              <i className="live-dot" /> Live · {live.hr} BPM
            </em>
          </div>
        </div>

        <nav className="nav-scroll">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.title}>
              <p className="nav-group-title">{group.title}</p>
              {group.items.map(renderItem)}
            </div>
          ))}

          <div className="nav-group">
            <p className="nav-group-title">Account</p>
            {utilityItems.map(renderItem)}
          </div>
        </nav>

        <div className="sidebar-bottom">
          <button className="sos-btn" onClick={() => navigate("emergency")}>
            <Siren size={18} />
            <span>Emergency SOS</span>
          </button>

          <div className="monitor-card">
            <span className="pulse-dot" />
            <div>
              <strong>Protection Active</strong>
              <em>Device battery {live.battery}%</em>
            </div>
          </div>

          <div className="sidebar-user">
            <div className="user-avatar">AM</div>
            <div className="su-text">
              <strong>Aryaa Menon</strong>
              <em>
                <Phone size={11} /> Primary Caregiver
              </em>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
