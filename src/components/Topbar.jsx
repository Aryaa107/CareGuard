import { useMemo, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Contrast,
  Menu,
  Moon,
  Search,
  Sun,
  Type,
  Volume2,
  X,
} from "lucide-react";
import useClock from "../hooks/useClock";
import { useCare } from "../context/careContext";
import { useAuth } from "../context/authContext";
import { Icon } from "./UI";

/**
 * Page titles. Each `sub` may be a function of the signed-in user and the
 * selected profile, so the copy names the actual person being cared for
 * rather than a hardcoded fixture.
 */
const pageInfo = {
  overview: { title: "Care Command Center", sub: ({ name }) => (name ? `Everything happening with ${name} right now.` : "Your care dashboard.") },
  health: { title: "Health Monitor", sub: () => "Vitals, trends and thresholds for every reading." },
  emergency: { title: "Emergency Center", sub: () => "SOS, medical profile and rapid response." },
  location: { title: "Live Location", sub: () => "Position, safe zones and visit history." },
  medications: { title: "Medications", sub: () => "Schedule, adherence and refills." },
  activity: { title: "Activity & Falls", sub: () => "Movement, sleep and fall detection." },
  family: { title: "Family Care", sub: () => "Care circle, permissions and shared tasks." },
  senior: { title: "Senior View", sub: () => "A simple, large-target screen." },
  alerts: { title: "Alerts & Timeline", sub: () => "Every event, filtered and searchable." },
  reports: { title: "Reports & Insights", sub: () => "Weekly score, trends and care summary." },
  settings: { title: "Settings", sub: () => "Accessibility, thresholds and notifications." },
};

export default function Topbar() {
  const {
    activePage,
    setSidebarOpen,
    alerts,
    unreadCount,
    markAllRead,
    markAlertRead,
    settings,
    updateSetting,
    nightMode,
    setNightMode,
    navigate,
    senior,
  } = useCare();

  const { user } = useAuth();

  const [panelOpen, setPanelOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const clock = useClock();

  const info = pageInfo[activePage] || pageInfo.overview;

  const firstName = user?.name?.split(/\s+/)[0] || "there";
  const careName = senior?.shortName || senior?.name || null;

  const greeting = useMemo(() => {
    if (!clock) return "Hello";
    const h = clock.getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, [clock]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return alerts
      .filter((a) => `${a.title} ${a.detail} ${a.source}`.toLowerCase().includes(q))
      .slice(0, 5);
  }, [query, alerts]);

  return (
    <header className="topbar">
      <button className="icon-btn menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
        <Menu size={20} />
      </button>

      <div className="topbar-title">
        <h1>{info.title}</h1>
        <p>
          {greeting}, {firstName} — {info.sub({ name: careName, user })}
        </p>
      </div>

      <div className="topbar-tools">
        <div className={`search-box ${searchOpen ? "on" : ""}`}>
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search alerts, meds, events…"
            aria-label="Search"
            onFocus={() => setSearchOpen(true)}
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
          {searchOpen && query && (
            <div className="search-results">
              {results.length === 0 ? (
                <p className="sr-empty">No matching events</p>
              ) : (
                results.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      setSearchOpen(false);
                      setQuery("");
                      navigate("alerts");
                    }}
                  >
                    <Icon name={a.icon} size={15} />
                    <span>
                      <strong>{a.title}</strong>
                      <em>{a.time}</em>
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="a11y-group">
          <button
            className={`icon-btn ${settings.textScale > 1 ? "on" : ""}`}
            title="Larger text"
            aria-label="Increase text size"
            onClick={() => updateSetting("textScale", settings.textScale >= 1.3 ? 1 : Number((settings.textScale + 0.15).toFixed(2)))}
          >
            <Type size={18} />
          </button>
          <button
            className={`icon-btn ${settings.highContrast ? "on" : ""}`}
            title="High contrast"
            aria-label="Toggle high contrast"
            onClick={() => updateSetting("highContrast", !settings.highContrast)}
          >
            <Contrast size={18} />
          </button>
          <button
            className={`icon-btn ${settings.voiceAssist ? "on" : ""}`}
            title="Voice assist"
            aria-label="Toggle voice assist"
            onClick={() => updateSetting("voiceAssist", !settings.voiceAssist)}
          >
            <Volume2 size={18} />
          </button>
          <button
            className={`icon-btn ${nightMode ? "on" : ""}`}
            title="Night mode"
            aria-label="Toggle night mode"
            onClick={() => setNightMode(!nightMode)}
          >
            {nightMode ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>

        <div className="clock">
          <strong>{clock ? clock.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"}</strong>
          <span>
            {clock
              ? clock.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })
              : ""}
          </span>
        </div>

        <div className="notif-wrap">
          <button
            className={`icon-btn notif-btn ${panelOpen ? "on" : ""}`}
            onClick={() => setPanelOpen(!panelOpen)}
            aria-label={`Notifications, ${unreadCount} unread`}
          >
            <Bell size={19} />
            {unreadCount > 0 && <span className="notif-dot">{unreadCount}</span>}
          </button>

          {panelOpen && (
            <>
              <div className="panel-scrim" onClick={() => setPanelOpen(false)} role="presentation" />
              <div className="notif-panel">
                <header>
                  <h4>Notifications</h4>
                  <button onClick={markAllRead}>
                    <CheckCheck size={15} /> Mark all read
                  </button>
                </header>
                <div className="notif-list">
                  {alerts.slice(0, 6).map((a) => (
                    <button
                      key={a.id}
                      className={a.read ? "read" : "unread"}
                      onClick={() => markAlertRead(a.id)}
                    >
                      <span className={`np-ico tone-${a.type}`}>
                        <Icon name={a.icon} size={15} />
                      </span>
                      <span className="np-body">
                        <strong>{a.title}</strong>
                        <em>{a.time}</em>
                      </span>
                      {!a.read && <i className="np-unread" />}
                    </button>
                  ))}
                </div>
                <footer onClick={() => { setPanelOpen(false); navigate("alerts"); }}>
                  <Check size={14} /> View all alerts
                </footer>
              </div>
            </>
          )}
        </div>

        <div className="profile">
          <div className="profile-avatar">{user?.avatar || "—"}</div>
          <div className="profile-text">
            <strong>{firstName}</strong>
            <span>
              {user?.role === "elderly" ? "Elderly User" : "Primary Caregiver"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
