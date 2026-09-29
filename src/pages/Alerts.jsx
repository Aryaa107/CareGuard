import { useMemo, useState } from "react";
import { Bell, CheckCheck, Filter, Search, Trash2 } from "lucide-react";
import { Badge, Button, Card, Icon } from "../components/UI";
import { useCare } from "../context/careContext";

const filters = [
  { id: "all", label: "All" },
  { id: "danger", label: "Critical" },
  { id: "warning", label: "Warning" },
  { id: "info", label: "Info" },
  { id: "success", label: "Resolved" },
  { id: "unread", label: "Unread" },
];

const sources = ["All sources", "CareBand X2", "Motion sensor", "Geofence", "Glucometer", "Home Hub"];

export default function Alerts() {
  const { alerts, unreadCount, markAllRead, markAlertRead, clearAlert, pushToast } = useCare();
  const [filter, setFilter] = useState("all");
  const [source, setSource] = useState("All sources");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    return alerts.filter((a) => {
      if (filter === "unread" && a.read) return false;
      if (filter !== "all" && filter !== "unread" && a.type !== filter) return false;
      if (source !== "All sources" && a.source !== source) return false;
      if (q && !`${a.title} ${a.detail}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [alerts, filter, source, q]);

  const counts = useMemo(
    () => ({
      danger: alerts.filter((a) => a.type === "danger").length,
      warning: alerts.filter((a) => a.type === "warning").length,
      info: alerts.filter((a) => a.type === "info").length,
      success: alerts.filter((a) => a.type === "success").length,
    }),
    [alerts]
  );

  return (
    <div className="page">
      <div className="alert-summary">
        {[
          { t: "danger", l: "Critical", v: counts.danger, c: "var(--c-danger)" },
          { t: "warning", l: "Warnings", v: counts.warning, c: "var(--c-warn)" },
          { t: "info", l: "Information", v: counts.info, c: "var(--c-info)" },
          { t: "success", l: "Resolved", v: counts.success, c: "var(--c-good)" },
        ].map((s) => (
          <div className={`as-cell tone-${s.t}`} key={s.t}>
            <span className="as-bar" style={{ background: s.c }} />
            <div>
              <strong>{s.v}</strong>
              <span>{s.l}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="alert-toolbar">
        <div className="filter-chips">
          {filters.map((f) => (
            <button
              key={f.id}
              className={filter === f.id ? "on" : ""}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
              {f.id === "unread" && unreadCount > 0 && <i>{unreadCount}</i>}
            </button>
          ))}
        </div>
        <div className="toolbar-right">
          <label className="src-select">
            <Filter size={15} />
            <select value={source} onChange={(e) => setSource(e.target.value)} aria-label="Filter by source">
              {sources.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="q-input">
            <Search size={15} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search alerts"
              aria-label="Search alerts"
            />
          </label>
          <Button variant="ghost" size="sm" icon={<CheckCheck size={14} />} onClick={markAllRead}>
            Mark all read
          </Button>
        </div>
      </div>

      <Card
        title="Event Timeline"
        subtitle={`${list.length} of ${alerts.length} events`}
        icon={<Bell size={19} />}
        className="full-card"
      >
        {list.length === 0 ? (
          <div className="empty">
            <div className="empty-ico">
              <Bell size={26} />
            </div>
            <h4>No alerts match your filters</h4>
            <p>Try a different filter or clear the search box.</p>
          </div>
        ) : (
          <div className="evt-list">
            {list.map((a) => (
              <div className={`evt-row ${a.read ? "read" : "unread"}`} key={a.id}>
                <span className={`evt-ico tone-${a.type}`}>
                  <Icon name={a.icon} size={17} />
                </span>
                <div className="evt-body">
                  <div className="evt-head">
                    <strong>{a.title}</strong>
                    <Badge tone={a.type}>{a.type === "success" ? "Resolved" : a.type}</Badge>
                    {!a.read && <i className="evt-unread" />}
                  </div>
                  <p>{a.detail}</p>
                  <div className="evt-meta">
                    <span>{a.date}</span>
                    <span>{a.time}</span>
                    <span className="evt-src">
                      <Icon name="zap" size={12} /> {a.source}
                    </span>
                  </div>
                </div>
                <div className="evt-actions">
                  <button
                    onClick={() => {
                      markAlertRead(a.id);
                      pushToast(a.read ? "Marked as read" : "Marked as unread", "info");
                    }}
                  >
                    {a.read ? "Mark unread" : "Mark read"}
                  </button>
                  <button
                    className="danger"
                    onClick={() => {
                      clearAlert(a.id);
                      pushToast("Alert removed from timeline", "info");
                    }}
                    aria-label={`Delete ${a.title}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
